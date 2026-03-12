# 🏥 Sehatku — Aplikasi PWA Kesehatan Keluarga

Aplikasi Progressive Web App (PWA) untuk merekam dan memantau kesehatan seluruh anggota keluarga, terhubung ke Google Sheets via Google Apps Script.

---

## ✨ Fitur Utama

### 👥 Multi-Profil dengan PIN
- Setiap anggota keluarga (Ayah, Ibu, Anak) memiliki profil terpisah
- Akses dilindungi **PIN 6 digit** per profil
- Bisa tambah/hapus profil sesuai kebutuhan

### 📊 Dashboard Kesehatan Lengkap
| Tab | Fitur |
|-----|-------|
| **Vital** | Detak jantung, SpO₂, suhu, pernapasan, tekanan darah, glukosa, berat/tinggi badan |
| **Tidur** | Fase tidur (ringan/dalam/REM), durasi, jadwal, tren 7 hari |
| **Jantung** | EKG, VO₂ Max, monitoring gangguan pernapasan |
| **Lab** | Glukosa, kolesterol, asam urat, SGPT, SGOT, LDL, HDL |
| **Gejala** | Pencatatan gejala harian + riwayat |
| **Imunisasi** | Jadwal vaksinasi + status + daftar alergi |
| **Nutrisi** | Kalori, karbohidrat, protein, lemak, hidrasi, kafein |
| **Gaya Hidup** | Langkah, aktivitas, kebiasaan merokok/alkohol, lingkungan |

---

## 🚀 Cara Menggunakan

### 1. Siapkan Google Sheets
Buat spreadsheet dengan sheet terpisah untuk setiap profil:
- Sheet "Ayah"
- Sheet "Ibu"  
- Sheet "Anak"

Setiap sheet berisi dua kolom: **KEY** | **VALUE**

Contoh isi sheet:
```
hr          | 72
spo2        | 98
temp        | 36.6
bp          | 120/80
glucose     | 105
bb          | 70
tb          | 172
sleep_dur   | 7.5
lab_glukosa | 105
...
```
(Lihat file `apps-script-backend.gs` untuk daftar lengkap key)

### 2. Deploy Google Apps Script
1. Buka Google Sheets → **Extensions > Apps Script**
2. Paste seluruh isi `apps-script-backend.gs`
3. Klik **Deploy > New Deployment**
4. Pilih Type: **Web App**
5. Execute as: **Me**, Who has access: **Anyone**
6. Klik Deploy → **Salin URL**

### 3. Instal PWA
1. Buka `index.html` di web server (atau hosting)
2. Masukkan URL Apps Script saat pertama kali buka
3. Di browser mobile: **Add to Home Screen** untuk install sebagai app

### 4. Login ke Profil
- Pilih profil di halaman utama
- Masukkan **PIN 6 digit** (default: `123456`)
- Ganti PIN di Pengaturan > Edit Profil

---

## 📁 Struktur File

```
sehatku/
├── index.html              # Aplikasi utama (single-file PWA)
├── manifest.json           # PWA manifest
├── sw.js                   # Service Worker (offline support)
├── apps-script-backend.gs  # Template Google Apps Script
└── README.md               # Dokumentasi ini
```

---

## 🔒 Keamanan

- PIN disimpan di **localStorage** perangkat
- Data diambil langsung dari Google Sheets milik Anda
- Tidak ada server pihak ketiga yang menyimpan data kesehatan

---

## 🌐 Hosting

Bisa di-host di:
- **GitHub Pages** (gratis)
- **Netlify** (gratis)
- **Vercel** (gratis)
- Server lokal / NAS pribadi

> ⚠️ Pastikan menggunakan HTTPS agar fitur PWA bekerja penuh.

---

## 📱 Kompatibilitas

- ✅ Chrome Android / iOS
- ✅ Safari iOS (Add to Home Screen)
- ✅ Edge, Firefox
- ✅ Mode offline (data terakhir tersimpan)
