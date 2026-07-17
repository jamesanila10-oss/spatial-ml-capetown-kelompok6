# OUTLINE & TEMPLATE LAPORAN AKHIR (UAS GEOAI)
*Gunakan template ini sebagai acuan untuk menyusun Laporan Akhir PDF 5-8 Halaman.*

---

## 1. PENDAHULUAN
*   **Latar Belakang & Kota Pilihan:** Deskripsi umum Kota Cape Town, Afrika Selatan, letak geografis, ekologi (Biome Fynbos), dan kerentanan terhadap kebakaran hutan.
*   **Objek Target:** Vegetasi. Jelaskan mengapa deteksi vegetasi penting (misal: memantau dampak kebakaran hutan dan pemulihan vegetasi).
*   **Rumusan Masalah:**
    *   Apakah luas vegetasi di Cape Town mengalami pertambahan atau penyusutan antara tahun 2024 dan 2025?
    *   Di mana lokasi perubahan vegetasi terbesar terjadi?
    *   Seberapa andal hasil klasifikasi Random Forest yang diperoleh?
*   **Pengguna Potensial & Manfaat:** Badan Penanggulangan Bencana (Disaster Management), Dinas Kehutanan/Lingkungan Hidup Cape Town, peneliti akademis, dan LSM Lingkungan.

## 2. METODOLOGI
*   **Data & Sumber Citra:** Sentinel-2 Surface Reflectance Harmonized (`COPERNICUS/S2_SR_HARMONIZED`).
*   **Preprocessing & Konsistensi:**
    *   Tanggal: Periode musim kemarau Desember–Maret (2024 vs 2025).
    *   Cloud Masking: QA60 band cloud & cirrus masking.
    *   Compositing: Median composite.
    *   Resolusi spasial: 10 meter.
*   **Feature Stack (Variabel Input):**
    *   Band Spektral: B2, B3, B4, B8, B11, B12.
    *   Indeks Spektral: NDVI (Normalized Difference Vegetation Index) dan NDMI (Normalized Difference Moisture Index).
*   **Ground Truth Sampling:**
    *   Total Sampel: 300 titik (150 sampel tahun 2024, 150 sampel tahun 2025).
    *   Pembagian Kelas: 70:30 (Training: 214 sampel, Testing: 86 sampel).
    *   Seed: 42 (untuk replikasi pembagian acak).
*   **Pemodelan Random Forest:** Konfigurasi dengan 100 Trees (Estimators).

## 3. HASIL KLASIFIKASI & ANALISIS PERUBAHAN
*   **Luas Vegetasi Tahunan:**
    *   Tahun 2024: 81.040 ha (33.1% dari total luas kota Cape Town).
    *   Tahun 2025: 65.566 ha (26.8% dari total luas kota Cape Town).
*   **Statistik Perubahan:**
    *   Vegetation Gain: +4.200 ha.
    *   Vegetation Loss: -19.673 ha.
    *   Net Change: -15.474 ha (penurunan bersih sebesar -19.1% dibanding 2024).
*   **Pola Distribusi Spasial & Lokasi Terbesar:**
    *   Lokasi Perubahan Terbesar: Kawasan Table Mountain National Park dan Hottentots Holland Nature Reserve (Somerset West).
    *   Pola Distribusi: Perubahan kehilangan vegetasi (Loss) sangat terkluster di daerah pegunungan (dampak kebakaran hutan), sedangkan perubahan kehilangan vegetasi karena ekspansi perkotaan tersebar di pinggiran kota (Cape Flats).

## 4. EVALUASI MODEL & INTERPRETASI
*   **Metrik Kinerja Model (Testing Set):**
    *   Overall Accuracy: 90.7%
    *   Precision: 94.6%
    *   Recall: 85.4%
    *   F1-Score: 89.7%
*   **Interpretasi Kesalahan (Error Analysis):**
    *   *False Positive (FP = 6):* Lahan terbuka/perkotaan yang terklasifikasi sebagai vegetasi (kebingungan spektral).
    *   *False Negative (FN = 2):* Vegetasi yang terlewat oleh model (efek bayangan gunung atau vegetasi sangat jarang).
*   **Keterbatasan:**
    *   Resolusi spasial Sentinel-2 (10-20m) menghasilkan piksel campuran (*mixed pixels*).
    *   Klasifikasi biner (hanya vegetasi/non-vegetasi) belum membedakan jenis vegetasi secara spesifik.

## 5. KESIMPULAN & REKOMENDASI
*   **Kesimpulan:** Terjadi penyusutan vegetasi yang signifikan (-19.1%) akibat kebakaran hutan tahun 2024-2025. Model klasifikasi Random Forest terbukti andal dengan akurasi tinggi (90.7%).
*   **Rekomendasi Kebijakan:**
    1.  Prioritas reboisasi di wilayah loss terkluster (Table Mountain & Somerset West).
    2.  Penerapan sistem pemantauan kebakaran *near-real-time*.
    3.  Peningkatan sampel ground truth di wilayah pegunungan yang tertutup bayangan.

---

## 👥 LAMPIRAN: KONTRIBUSI ANGGOTA KELOMPOK
*Tuliskan pembagian tugas yang adil untuk assessment kelompok:*
1.  **Anggota 1:** [Tugasnya, misal: Akuisisi data GEE & Pembuatan Ground Truth]
2.  **Anggota 2:** [Tugasnya, misal: Penyusunan Kode Random Forest di GEE]
3.  **Anggota 3:** [Tugasnya, misal: Ekspor data & Penyiapan file GeoJSON]
4.  **Anggota 4:** [Tugasnya, misal: Desain WebGIS Frontend & Integrasi Leaflet]
5.  **Haryo Raafi Antarikso:** [Tugasnya, misal: Implementasi Dashboard Stats & Grafik Chart.js]
6.  **Anggota 6:** [Tugasnya, misal: Penulisan Laporan Akhir & Analisis Hasil]
