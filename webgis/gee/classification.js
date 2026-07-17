/**
 * GeoAI final project: Vegetation Change Analysis of Cape Town (2024–2025)
 * Google Earth Engine (GEE) script for Sentinel-2 classification using Random Forest.
 * 
 * Instructions: Copy and paste this script into the GEE Code Editor (code.earthengine.google.com)
 */

// =========================================================================
// 1. Study Area and Parameters
// =========================================================================
// Load Cape Town boundary (adjust table ID or import asset)
var roi = ee.FeatureCollection("FAO/GAUL/2015/level2")
  .filter(ee.Filter.eq('clean_adm2', 'Cape Town'));

Map.centerObject(roi, 10);
Map.addLayer(roi, {color: 'orange'}, 'Cape Town Boundary', false);

var CLOUD_FILTER = 20; // Maximum cloud percentage
var SEED = 42;

// =========================================================================
// 2. Preprocessing & Cloud Masking Functions
// =========================================================================
/**
 * Mask clouds in Sentinel-2 images using the QA60 band.
 */
function maskS2clouds(image) {
  var qa = image.select('QA60');
  var cloudBitMask = 1 << 10;
  var cirrusBitMask = 1 << 11;
  var mask = qa.bitwiseAnd(cloudBitMask).eq(0)
      .and(qa.bitwiseAnd(cirrusBitMask).eq(0));
  return image.updateMask(mask).divide(10000)
      .copyProperties(image, ["system:time_start"]);
}

/**
 * Add NDVI and other spectral indices to image.
 */
function addIndices(image) {
  var ndvi = image.normalizedDifference(['B8', 'B4']).rename('NDVI');
  var ndmi = image.normalizedDifference(['B8', 'B11']).rename('NDMI');
  return image.addBands([ndvi, ndmi]);
}

// =========================================================================
// 3. Image composites for 2024 and 2025
// =========================================================================
// Rentang tanggal musim kemarau/panas di Cape Town (Dec - Feb) untuk menghindari awan
var s2_2024 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
  .filterBounds(roi)
  .filterDate('2023-12-01', '2024-03-31')
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', CLOUD_FILTER))
  .map(maskS2clouds)
  .map(addIndices);

var s2_2025 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
  .filterBounds(roi)
  .filterDate('2024-12-01', '2025-03-31')
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', CLOUD_FILTER))
  .map(maskS2clouds)
  .map(addIndices);

var composite_2024 = s2_2024.median().clip(roi);
var composite_2025 = s2_2025.median().clip(roi);

var visParams = {bands: ['B4', 'B3', 'B2'], min: 0, max: 0.3};
Map.addLayer(composite_2024, visParams, 'Sentinel-2 2024 True Color');
Map.addLayer(composite_2025, visParams, 'Sentinel-2 2025 True Color');

// =========================================================================
// 4. Ground Truth Preparation
// =========================================================================
// Define training bands
var bands = ['B2', 'B3', 'B4', 'B8', 'B11', 'B12', 'NDVI'];

// Note: In Earth Engine, you would collect training points manually or load an asset
// The training points dataset should have attributes: 'class' (0: Non-Veg, 1: Veg) and 'year'
// Here is a mock example of generating points or loading a pre-saved FeatureCollection:
var samples_2024 = ee.FeatureCollection.randomPoints(roi, 150, SEED)
  .map(function(feat) {
    // Labeling process (here shown as random class for illustrative code completeness)
    // In production, label from Sentinel-2 or reference Google Maps Imagery
    var randomVal = ee.Number(feat.get('random'));
    var label = randomVal.gt(0.5).cast(ee.PixelType.int8());
    return feat.set({class: label, year: 2024});
  });

var samples_2025 = ee.FeatureCollection.randomPoints(roi, 150, SEED + 1)
  .map(function(feat) {
    var randomVal = ee.Number(feat.get('random'));
    var label = randomVal.gt(0.6).cast(ee.PixelType.int8()); // slightly lower veg in 2025
    return feat.set({class: label, year: 2025});
  });

var allSamples = samples_2024.merge(samples_2025);

// =========================================================================
// 5. Training and Classification
// =========================================================================
// Extract spectral values for training samples
var training_2024 = composite_2024.select(bands).sampleRegions({
  collection: samples_2024,
  properties: ['class'],
  scale: 10
});

var training_2025 = composite_2025.select(bands).sampleRegions({
  collection: samples_2025,
  properties: ['class'],
  scale: 10
});

// Combine training data
var trainingData = training_2024.merge(training_2025);

// Split 70% Training / 30% Testing
var withRandom = trainingData.randomColumn('random', SEED);
var trainingSplit = withRandom.filter(ee.Filter.lt('random', 0.7));
var testingSplit = withRandom.filter(ee.Filter.gte('random', 0.7));

// Train Random Forest Classifier (100 estimators)
var classifier = ee.Classifier.smileRandomForest(100)
  .train({
    features: trainingSplit,
    classProperty: 'class',
    inputProperties: bands
  });

// Classify both years with the same model
var classified_2024 = composite_2024.select(bands).classify(classifier);
var classified_2025 = composite_2025.select(bands).classify(classifier);

Map.addLayer(classified_2024, {min: 0, max: 1, palette: ['#d9d9d9', '#1a9641']}, 'Classification 2024');
Map.addLayer(classified_2025, {min: 0, max: 1, palette: ['#d9d9d9', '#1a9641']}, 'Classification 2025');

// =========================================================================
// 6. Validation
// =========================================================================
var validation = testingSplit.classify(classifier);
var errorMatrix = validation.errorMatrix('class', 'classification');

print('Confusion Matrix (Testing Data):', errorMatrix);
print('Overall Accuracy:', errorMatrix.accuracy());
print('Kappa Index:', errorMatrix.kappa());
print('Producer Accuracy (Recall):', errorMatrix.producersAccuracy());
print('Consumer Accuracy (Precision):', errorMatrix.consumersAccuracy());

// =========================================================================
// 7. Change Detection Analysis
// =========================================================================
// Kategori perubahan:
// 0: Tetap Non-Vegetasi (0 -> 0)
// 1: Pertambahan/Gain (0 -> 1)
// 2: Pengurangan/Loss (1 -> 0)
// 3: Tetap Vegetasi (1 -> 1)
var changeDetection = ee.Image(0)
  .where(classified_2024.eq(0).and(classified_2025.eq(0)), 0)
  .where(classified_2024.eq(0).and(classified_2025.eq(1)), 1)
  .where(classified_2024.eq(1).and(classified_2025.eq(0)), 2)
  .where(classified_2024.eq(1).and(classified_2025.eq(1)), 3)
  .clip(roi);

var changePalette = ['#d9d9d9', '#4daf4a', '#e41a1c', '#1a9641'];
Map.addLayer(changeDetection, {min: 0, max: 3, palette: changePalette}, 'Vegetation Change (2024-2025)');

// =========================================================================
// 8. Vectorization & Exports
// =========================================================================
// Convert classification results to vector polygons for WebGIS deployment
var changeVectors = changeDetection.reduceToVectors({
  geometry: roi,
  crs: changeDetection.projection(),
  scale: 20,
  geometryType: 'polygon',
  eightConnected: false,
  labelProperty: 'kode_perubahan',
  bestEffort: true
});

// Clean vectors (remove very small patches for performance optimization)
var minAreaM2 = 2000;
var cleanedVectors = changeVectors.filter(ee.Filter.gt('area', minAreaM2));

// Export vector changes to Google Drive (convertible to GeoJSON)
Export.table.toDrive({
  collection: cleanedVectors,
  description: 'Perubahan_Vegetasi_CapeTown_2024_2025',
  fileFormat: 'GeoJSON',
  folder: 'GeoAI_CapeTown_Output'
});

// Export rasters
Export.image.toDrive({
  image: classified_2024,
  description: 'Classification_CapeTown_2024',
  scale: 10,
  region: roi,
  maxPixels: 1e9,
  folder: 'GeoAI_CapeTown_Output'
});

Export.image.toDrive({
  image: classified_2025,
  description: 'Classification_CapeTown_2025',
  scale: 10,
  region: roi,
  maxPixels: 1e9,
  folder: 'GeoAI_CapeTown_Output'
});
