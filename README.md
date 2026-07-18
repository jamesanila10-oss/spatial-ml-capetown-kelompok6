# Klasifikasi dan Deteksi Perubahan Vegetasi Kota Cape Town (2024–2025)

Repositori ini menyimpan seluruh kode, data spasial, hasil analisis, dan laporan akhir proyek pemetaan tutupan vegetasi Kota Cape Town, Afrika Selatan. Proyek menggunakan citra Sentinel-2, algoritma Random Forest di Google Earth Engine, dan disajikan melalui WebGIS interaktif.

**Mata Kuliah:** Maha Data & Kapita Selekta Sistem Informasi

**Dosen:** Zakiul Fahmi Jailani, S.Kom, MSc

**Program Studi:** Sistem Informasi — Fakultas Teknik dan Ilmu Komputer, Universitas Bakrie

**Semester:** Genap 2025/2026

---

## Anggota Kelompok 6

| Nama | NIM | Peran |
|---|---|---|
| Moerice Joel Kalangit | 1242002047 | Spatial Data Engineer & Ground Truth Specialist |
| Achmad Taufik Alfarizy | 1232002087 | Machine Learning Engineer |
| Hafizhah Dea Az Zahrah | 1232002059 | Model Evaluation & Change Analyst · Repository Manager & Technical Writer |
| Haryo Raafi Antarikso | 1232002003 | WebGIS Developer |
| Ahmad Rafly | 1232002058 | Repository Manager & Technical Writer |
| Zahrotul Mu'minati | 1232002086 | Repository Manager & Technical Writer |

---

## Ringkasan Proyek

| Aspek | Keterangan |
|---|---|
| Wilayah studi | Kota Cape Town, Afrika Selatan |
| Objek target | Vegetasi (biner: kelas 1 = vegetasi, kelas 0 = non-vegetasi) |
| Periode analisis | 2024 vs 2025 |
| Sumber data | Sentinel-2 Surface Reflectance Harmonized (COPERNICUS/S2_SR_HARMONIZED) |
| Resolusi | 10 m |
| Platform | Google Earth Engine + WebGIS (Leaflet.js) |

Cape Town dipilih karena vegetasi endemik fynbos di kawasan ini sangat rentan terhadap kebakaran lahan. Kondisi kemarau panjang pada pertengahan 2024 memperparah risiko kebakaran, dan periode 2024–2025 mencatat sejumlah kejadian kebakaran besar termasuk di kawasan Table Mountain National Park pada Februari dan April 2025.

---

## Metodologi

| Tahap | Konfigurasi |
|---|---|
| Rentang komposit | 1 Jan – 31 Des (identik untuk kedua tahun) |
| Filter awan (metadata) | CLOUDY_PIXEL_PERCENTAGE < 20% |
| Cloud masking piksel | SCL — exclude kelas 3 (shadow), 8, 9 (awan), 10 (cirrus) |
| Metode komposit | Median composite |
| Feature stack | 7 fitur: B2, B3, B4, B8, B11, B12, NDVI |
| Ground truth | 360 titik (90 vegetasi + 90 non-vegetasi per tahun) |
| Split | 70:30 melalui kode, seed tetap = 42 (239 training / 121 testing) |
| Model | Random Forest, 100 trees satu model untuk kedua tahun |

**Alur:** Sentinel-2 → Cloud Masking (SCL) → Median Composite → Feature Stack → Ground Truth → Split 70:30 → Random Forest → Evaluasi APRF → Klasifikasi 2024 & 2025 → Change Detection → WebGIS

---

## Performa Model

Evaluasi dilakukan secara independen menggunakan 121 titik testing yang tidak pernah dilibatkan dalam pelatihan model.

**Confusion Matrix (n = 121)**

| | Prediksi: Non-vegetasi (0) | Prediksi: Vegetasi (1) |
|---|---|---|
| **Aktual: Non-vegetasi (0)** | TN = 64 | FP = 1 |
| **Aktual: Vegetasi (1)** | FN = 6 | TP = 50 |

**Metrik APRF (kelas target = vegetasi)**

| Metrik | Nilai |
|---|---|
| Accuracy | 94,21% |
| Precision | 98,04% |
| Recall | 89,29% |
| F1-Score | 93,46% |

**Feature importance:** NDVI merupakan prediktor paling dominan (46,26), diikuti B2 (32,45) dan B12 (29,86).

**Catatan:** Ground truth disusun dua tahap. Tahap pertama menghasilkan 300 titik dengan precision yang sangat tinggi, mengindikasikan sampel non-vegetasi didominasi objek yang mudah dibedakan. Tahap kedua menambahkan 60 titik pada zona transisi spektral (area bekas terbakar bertunggul, lereng bertutup bayangan, vegetasi jarang) tanpa menghapus titik lama. Penurunan metrik setelah penambahan tersebut mencerminkan pengujian model pada kondisi yang lebih menantang dan realistis.

---

## Hasil Deteksi Perubahan

| Indikator | Nilai |
|---|---|
| Luas vegetasi 2024 | 105.930,99 ha (43,1% luas kota) |
| Luas vegetasi 2025 | 86.749,17 ha (35,3% luas kota) |
| Area bertambah (Gain) | 4.538,16 ha |
| Area berkurang (Loss) | 23.719,99 ha |
| Tetap vegetasi | 82.211,01 ha |
| **Perubahan bersih (Net Change)** | **−19.181,82 ha (−18,1%)** |
| Luas total administrasi kota | 245.597,61 ha |

Area loss lebih dari lima kali lebih luas dibanding area gain. Penyusutan terkonsentrasi di kawasan lereng Table Mountain, wilayah utara Cape Town, dan semenanjung selatan (Cape Point) konsisten dengan rangkaian kebakaran vegetasi sepanjang 2024–2025. Interpretasi kausal terhadap kebakaran merupakan indikasi berdasarkan konteks, bukan kesimpulan yang telah diverifikasi lapangan.

---

## Aplikasi WebGIS

**Tautan:** https://jamesanila10-oss.github.io/spatial-ml-capetown-kelompok6/webgis/#map 

WebGIS interaktif terdiri atas 4 tab:

1. **Peta Hasil:** basemap, batas kota, vegetasi 2024, vegetasi 2025, gain, loss, legenda, layer control, popup informasi
2. **Data & Proses:** sumber data, parameter preprocessing, ground truth, split, seed, konfigurasi model, diagram alur
3. **Evaluasi Model:** jumlah training/testing, confusion matrix, metrik APRF, interpretasi FP/FN, keterbatasan
4. **Insight Hasil:** ringkasan luas dan perubahan, lokasi perubahan terbesar, pola distribusi, kemungkinan penyebab, rekomendasi

---

## Struktur Folder

```
spatial-ml-capetown-kelompok6/
├── README.md
├── gee/
│   └── script_capetown_final.js      # Pipeline lengkap GEE
├── data/
│   ├── GroundTruth_CapeTown_360.csv  # 360 titik ground truth
│   └── boundary_cape_town.geojson    # Batas administrasi kota
├── results/
│   ├── Vegetasi_CapeTown_2024.geojson
│   ├── Vegetasi_CapeTown_2025.geojson
│   ├── Perubahan_Vegetasi_CapeTown_2024_2025.geojson
│   ├── Classification_CapeTown_2024.tif
│   └── Classification_CapeTown_2025.tif
├── webgis/
│   └── index.html                    # Aplikasi WebGIS
└── report/
    └── Laporan_Akhir_Kelompok6.pdf
```

**Keterangan file hasil:**

| File | Isi |
|---|---|
| `Vegetasi_CapeTown_2024.geojson` | Poligon vegetasi tahun 2024 (kelas 1) |
| `Vegetasi_CapeTown_2025.geojson` | Poligon vegetasi tahun 2025 (kelas 1) |
| `Perubahan_Vegetasi_CapeTown_2024_2025.geojson` | Poligon perubahan — atribut `kode_perubahan`: 1 = gain, 2 = loss, 3 = tetap vegetasi; atribut `keterangan`: Bertambah / Berkurang / Tetap Vegetasi |
| `Classification_CapeTown_2024.tif` | Raster klasifikasi biner 2024 |
| `Classification_CapeTown_2025.tif` | Raster klasifikasi biner 2025 |

---

## Cara Menjalankan Ulang Kode GEE

1. Buka [Google Earth Engine Code Editor](https://code.earthengine.google.com)
2. Upload `data/GroundTruth_CapeTown_360.csv` ke GEE Assets
   → **New** → **CSV file (.csv)** → pilih kolom `longitude` dan `latitude` → beri nama `groundtruth_cape_town`
3. Upload `data/boundary_cape_town.geojson` ke GEE Assets dengan nama `Cape-Town`
   (GEE tidak menerima GeoJSON secara langsung — konversi ke Shapefile `.zip` terlebih dahulu)
4. Cek project ID akun GEE Anda:
   ```javascript
   print(ee.data.getAssetRoots());
   ```
5. Salin isi `gee/script_capetown_final.js` ke script baru, lalu ganti variabel `PROJECT_ID` di bagian awal dengan project ID Anda
6. Klik **Run**
7. Buka tab **Tasks** dan jalankan seluruh export task

**Catatan reproduksi:** Hasil numerik dapat sedikit berbeda antar-akun GEE karena `system:index` pada asset hasil re-upload berbeda, sehingga `randomColumn(seed 42)` menghasilkan pembagian training/testing yang tidak identik. Metodologi, parameter, dan alur analisis tetap sama.

---

## Cara Membuka WebGIS

**Online:** akses langsung melalui tautan WebGIS di atas.

**Lokal:**
```bash
git clone https://github.com/jamesanila10-oss/spatial-ml-capetown-kelompok6.git
cd spatial-ml-capetown-kelompok6/webgis
# buka index.html di browser, atau jalankan server lokal:
python -m http.server 8000
# lalu akses http://localhost:8000
```

---

## Tautan

- **Repository:** https://github.com/jamesanila10-oss/spatial-ml-capetown-kelompok6
- **WebGIS:** https://jamesanila10-oss.github.io/spatial-ml-capetown-kelompok6/webgis/#map 
- **Laporan Akhir:** [`report/Laporan_Akhir_Kelompok6.pdf`](report/)

---

## Referensi Data

- European Space Agency (ESA) / Copernicus Programme. *Sentinel-2 Surface Reflectance Harmonized (COPERNICUS/S2_SR_HARMONIZED)*. Google Earth Engine Data Catalog.
- Google LLC. *Google Earth Engine Developer Guide: ee.Classifier.smileRandomForest*.
