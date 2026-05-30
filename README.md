# 🔐 TwofishVault

**Aplikasi Enkripsi & Dekripsi Teks dan File Berbasis Algoritma Twofish**  
*Client-side, tanpa server – seluruh proses berjalan di browser.*

---

## 👥 Tim Pengembang

| Nama | NIM (opsional) | Inisial | Peran Utama |
|------|----------------|---------|-------------|
| Muhammad Adib Haryadi | ... | MAH | Pengembang Inti Algoritma Twofish |
| Giffari Zaka Wali Andry | ... | GZW | Pengembang UI/UX & Integrasi Antarmuka |
| Muhammad Rahman Afrialdi | ... | MRA | Pengembang Mode Operasi & Validasi |

---

## 📖 Deskripsi Proyek

TwofishVault adalah aplikasi web single-page yang mengimplementasikan algoritma kriptografi **Twofish** (128/192/256-bit) secara murni di sisi klien menggunakan JavaScript. Aplikasi ini mendukung enkripsi dan dekripsi teks maupun file, dengan dua mode operasi — **ECB** dan **CBC** — serta padding standar **PKCS#7**. Semua proses komputasi terjadi di dalam browser; tidak ada data yang dikirim ke server.

Proyek ini disusun sebagai bagian dari tugas mata kuliah Kriptografi, bertujuan untuk:
- Menerapkan algoritma Twofish yang sesuai spesifikasi.
- Menyediakan antarmuka yang intuitif dan informatif.
- Menghasilkan dokumentasi teknis yang dapat digunakan langsung dalam laporan proyek (Bab 5).

---

## ✨ Fitur Utama

| Fitur | Deskripsi |
|-------|-----------|
| **Enkripsi Teks** | Ubah plaintext menjadi ciphertext (Base64) dengan kunci dan mode pilihan. |
| **Dekripsi Teks** | Kembalikan ciphertext (Base64) menjadi plaintext asli. |
| **Enkripsi File** | Unggah file (maks. 5 MB), hasil terenkripsi diunduh sebagai `.enc`. |
| **Dekripsi File** | Unggah file `.enc`, dapatkan kembali file asli. |
| **Generator Kunci** | Hasilkan kunci acak 128-bit, 192-bit, atau 256-bit (heksadesimal). |
| **Indikator Kekuatan** | Visualisasi panjang kunci dan validitas secara real‑time. |
| **Mode ECB & CBC** | Pilih mode operasi block cipher; CBC dilengkapi IV acak 16 byte. |
| **Salin & Unduh** | Salin output ke clipboard atau unduh sebagai file. |
| **Tema Gelap/Terang** | Toggle tema sesuai preferensi pengguna. |
| **Dokumentasi Teknis** | Penjelasan logika sistem, algoritma, dan potongan kode tersedia di halaman. |

---

## 🛠️ Teknologi yang Digunakan

- **HTML5** – Struktur semantik, aksesibilitas (skip link, ARIA label).
- **CSS3** – Custom properties, flex/grid, backdrop-filter, responsif penuh.
- **JavaScript (ES6+)** – Implementasi Twofish murni tanpa library eksternal:
  - Key schedule (40 subkey + 4 S-box bergantung kunci)
  - Fungsi `g` dengan MDS matrix dan perkalian Galois Field GF(2⁸)
  - Jaringan Feistel 16 round + pre/post-whitening
  - Mode ECB/CBC dan padding PKCS#7
  - Konversi hex, Base64, manipulasi file
- **Web Crypto API** – `crypto.getRandomValues()` untuk IV acak.
- **Fontshare** – Font Boska & Satoshi untuk tipografi profesional.

---

## 🚀 Cara Menjalankan

1. **Unduh** repositori atau salin file `index.html`.
2. Buka `index.html` langsung di browser modern (Chrome, Firefox, Edge, Safari).
3. Tidak perlu server lokal – semua berjalan di sisi klien.

> **Catatan:** Karena menggunakan modul ES6, pastikan browser mendukung (semua browser modern sudah kompatibel).

---

## 📘 Panduan Penggunaan Singkat

1. **Pilih tab** yang diinginkan: `Enkripsi Teks`, `Dekripsi Teks`, `Enkripsi File`, atau `Dekripsi File`.
2. **Kunci**: Masukkan kunci heksadesimal (32, 48, atau 64 karakter) atau klik tombol `Generate ...` untuk membuat kunci acak.
3. **Mode**: Pilih `ECB` atau `CBC`.
4. **Input**:
   - *Teks*: Ketik plaintext atau tempel ciphertext Base64.
   - *File*: Klik area unggah atau seret file ke dropzone.
5. **Proses**: Klik tombol `Enkripsi ...` / `Dekripsi ...`.
6. **Hasil**: Output muncul di panel kanan. Gunakan `Salin` atau `Unduh` untuk menyimpan.

---

## 🧠 Detail Algoritma (Ringkasan)

Implementasi Twofish mengikuti spesifikasi resmi Bruce Schneier. Komponen utama dalam kode:

- **S-box (q0, q1)** → 4 S-box yang bergantung pada kunci.
- **MDS Matrix 4×4** → difusi maksimum dalam fungsi `g`.
- **gfMult()** → perkalian polinomial modulo `0x169` di GF(2⁸).
- **_keySchedule()** → menghasilkan 40 subkey 32-bit.
- **_g()** → lookup S-box + perkalian MDS.
- **16 round Feistel** → pre-whitening, 16 putaran swap, post-whitening.
- **Mode CBC** → IV acak 16-byte disisipkan di awal ciphertext.

Penjelasan mendalam dan potongan kode disertakan langsung di bagian **Dokumentasi Teknis** pada halaman aplikasi.

---

## 👨‍💻 Pembagian Tugas Anggota

### 1. Muhammad Adib Haryadi (MAH)
**Peran: Desain Antarmuka & Integrasi**

| Tugas | Detail |
|-------|--------|
| **Perancangan Wireframe** | Membuat sketsa tata letak: header, hero, area kerja (kiri-kanan), tab, dan dokumentasi. |
| **Styling CSS** | Menulis seluruh CSS dengan tema terang/gelap, variabel warna, animasi, dropzone, indikator kekuatan, dan responsivitas. |
| **Komponen UI** | Membangun elemen: tombol tema, tombol tab, radio mode, card input/output, toast notifikasi. |
| **Aksesibilitas** | Menambahkan skip-link, label ARIA, dan memastikan navigasi keyboard. |
| **Integrasi Logika ke Tombol** | Menghubungkan event handler (klik, input) dengan fungsi JavaScript yang sudah disediakan tim. |
| **Dokumentasi Antarmuka** | Menyusun penjelasan arsitektur sistem dan diagram alir di dalam halaman. |

---

### 2. Giffari Zaka Wali Andry (GZW)
**Peran: Pengembang Inti Algoritma Twofish**

| Tugas | Detail |
|-------|--------|
| **Implementasi S-box** | Menulis array `q0` dan `q1` sesuai spesifikasi. |
| **Key Schedule** | Membuat method `_keySchedule()`: memecah kunci, membentuk Me/Mo, membangkitkan 4 S-box dependent key, dan 40 subkey. |
| **Fungsi `_f32` & `_g`** | Mengimplementasikan fungsi helper untuk penghitungan subkey dan transformasi non-linear utama Twofish. |
| **Fungsi `encryptBlock()` & `decryptBlock()`** | Menulis logika enkripsi/dekripsi satu blok 128-bit: pre-whitening, 16 round Feistel, post-whitening, dan swap output. |
| **MDS & Galois Field** | Menulis `gfMult()` dan `mdsMultiply()` untuk operasi perkalian di GF(2⁸). |
| **Optimasi & Debugging** | Memastikan kebenaran logika dengan test vector (key=0, plain=0 → ciphertext yang diharapkan). |

---

### 3. Muhammad Rahman Afrialdi (MRA)
**Peran: Mode Operasi, File Handling & Validasi**

| Tugas | Detail |
|-------|--------|
| **Padding PKCS#7** | Menulis fungsi `pkcs7Pad()` dan `pkcs7Unpad()` yang sesuai standar. |
| **Wrapper ECB/CBC** | Mengimplementasikan `processEncrypt()` dan `processDecrypt()` dengan dukungan mode ECB dan CBC, termasuk IV acak. |
| **Enkripsi/Dekripsi File** | Menangani pembacaan file dengan `FileReader`, memproses array byte, dan menyiapkan Blob untuk unduhan. |
| **Validasi Input** | Memvalidasi kunci (hex, panjang), ukuran file (<5MB), format Base64, dan ciphertext kelipatan 16. |
| **Fungsi Utilitas** | Menulis `hexToBytes`, `bytesToHex`, `toBase64`, `fromBase64`, `concatU8`. |
| **Test Vector & Debugging** | Menguji round-trip (enkripsi lalu dekripsi harus sama), menguji mode ECB vs CBC dengan plaintext berulang. |
| **Dokumentasi Akhir** | Menyusun tabel ringkasan komponen, validasi, dan test vector di halaman dokumentasi. |

---

## 📂 Struktur Proyek
├── index.html 
├── style.css
├── script.js
└── README.md
Masih Dalam Tahap Pengembangan

---

## 📝 Lisensi

Proyek ini dibuat untuk keperluan akademik. Silakan digunakan, dimodifikasi, dan disebarluaskan dengan tetap mencantumkan kredit tim pengembang.
"BUATAN SENDIRI"

---

## 🙏 Ucapan Terima Kasih

- Bruce Schneier dan tim atas spesifikasi algoritma Twofish.
- Dosen pengampu mata kuliah Sistem Keamanan.
- Fontshare untuk font Boska & Satoshi.
