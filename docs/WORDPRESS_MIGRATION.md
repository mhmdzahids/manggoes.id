# Panduan Migrasi WordPress & Elementor: Manggoes.id

Panduan langkah demi langkah untuk memindahkan prototype website Manggoes ke instalasi WordPress live di Hostinger dengan tema Astra, Elementor, dan Elementor Header & Footer Builder.

---

## Ringkasan Arsitektur Migrasi

Semua komponen Manggoes dirancang khusus agar tahan terhadap benturan CSS bawaan Astra dan Elementor:
1. **Namespace Terisolasi**: Seluruh elemen dibungkus dalam kelas induk `.mg` dengan prefix kelas `mg-*` dan ID `mg-*`.
2. **Tanpa Ketergantungan Eksternal**: Berjalan murni dengan HTML5, CSS kustom, dan Vanilla JavaScript tanpa jQuery atau pustaka pihak ketiga.
3. **Kompatibel WordPress Multisite**: Script JavaScript dan CSS di-*enqueue* melalui hook resmi WordPress (`wp_enqueue_scripts`), sehingga terhindar dari pembersihan tag `<script>` oleh filter keamanan `unfiltered_html` pada WordPress Multisite.

---

## Langkah 1: Persiapan Lingkungan (Staging / Halaman Draf)

1. Masuk ke WP-Admin (`https://manggoes.id/wp-admin`).
2. Jangan langsung mengubah halaman depan yang sedang aktif.
3. Buat halaman baru: **Pages > Add New Page**.
4. Beri judul sementara, misalnya `Beranda Baru` dengan slug URL `beranda` atau `mangga`.
5. Simpan sebagai **Draft** terlebih dahulu.

---

## Langkah 2: Atur Template Halaman Menjadi Elementor Canvas

Pengaturan ini menonaktifkan header, footer, dan sidebar bawaan tema Astra agar desain landing page Manggoes tampil penuh tanpa gangguan visual:
1. Klik tombol **Edit with Elementor**.
2. Pada panel kiri bawah Elementor, klik ikon **Settings** (roda gigi).
3. Cari menu **Page Layout**.
4. Ubah dari `Default` menjadi **Elementor Canvas**.
5. Klik **Save Draft** atau **Update**. Kanvas kini bersih total.

---

## Langkah 3: Unggah Berkas Gambar dan Logo

1. Buka folder lokal `/wordpress/images/` hasil export.
2. Anda memiliki dua pilihan metode pengunggahan:
   - **Metode A (FTP / File Manager Hostinger - Direkomendasikan)**:
     Buka File Manager di hPanel Hostinger. Buat folder `mg` di dalam direktori `wp-content/uploads/` sehingga jalurnya menjadi `wp-content/uploads/mg/`. Unggah seluruh isi file dari folder `/wordpress/images/` ke lokasi tersebut.
   - **Metode B (Media Library WordPress)**:
     Buka **Media > Add New Media File**. Unggah seluruh gambar WebP. Jika URL file di media library berbeda (misal `wp-content/uploads/2026/10/...`), jalankan ulang export lokal dengan argumen base URL yang sesuai:
     ```bash
     node scripts/export-wp.mjs --base-url https://manggoes.id/wp-content/uploads/2026/10/
     ```

---

## Langkah 4: Pasang CSS, JS, dan Google Fonts via functions-snippet.php

Terdapat dua cara aman untuk mendaftarkan aset tanpa mengubah core theme:

### Pilihan A: Menggunakan Child Theme Astra (Direkomendasikan)
1. Buka file `functions.php` pada tema anak Astra Anda:
   `wp-content/themes/astra-child/functions.php`
2. Unggah file `wordpress/manggoes.css` dan `wordpress/manggoes.js` ke folder tema anak (`wp-content/themes/astra-child/`).
3. Salin seluruh isi kode dari `wordpress/functions-snippet.php` dan tempelkan di bagian paling bawah file `functions.php`.
4. Sesuaikan nilai variabel `$GLOBALS['mg_target_page_slug'] = 'beranda';` sesuai slug halaman draf Anda.

### Pilihan B: Menggunakan Plugin Code Snippets / WPCode
1. Pasang dan aktifkan plugin **Code Snippets** atau **WPCode**.
2. Pilih **Add New Snippet**, pilih tipe **PHP Code**.
3. Beri nama: `Manggoes Landing Page Enqueue`.
4. Tempelkan isi dari `wordpress/functions-snippet.php`.
5. Pastikan file `manggoes.css` dan `manggoes.js` telah diunggah ke `wp-content/uploads/mg/`.
6. Simpan dan aktifkan (Active).

---

## Langkah 5: Tempel Fragmen Sesi ke Widget HTML Elementor

Buka editor Elementor pada halaman yang telah diatur ke **Elementor Canvas**:

1. Buat **Container** baru untuk setiap sesi:
   - Width: **Full Width** (atau 100%)
   - Columns Gap: **No Gap** (0px)
   - Padding: **0px** pada semua sisi (Top, Right, Bottom, Left)
   - Margin: **0px**
2. Tarik widget **HTML** ke dalam Container tersebut.
3. Buka folder lokal `/wordpress/sections/` dan salin kode per file sesuai urutan:
   - Container 1: Tempelkan kode dari `01-header.html` (Header & Mobile Drawer)
   - Container 2: Tempelkan kode dari `02-hero.html` (Hero Section)
   - Container 3: Tempelkan kode dari `03-strip.html` (Strip Kepercayaan)
   - Container 4: Tempelkan kode dari `04-kenapa.html` (Kenapa Manggoes)
   - Container 5: Tempelkan kode dari `05-harga.html` (Harga & Special Offer 5 Varietas)
   - Container 6: Tempelkan kode dari `06-cerita.html` (Cerita Kami)
   - Container 7: Tempelkan kode dari `07-garansi.html` (Garansi 100%)
   - Container 8: Tempelkan kode dari `08-testimoni.html` (Testimoni Pelanggan)
   - Container 9: Tempelkan kode dari `09-cara-pesan.html` (Cara Pesan 3 Langkah)
   - Container 10: Tempelkan kode dari `10-faq.html` (Pertanyaan Sering Ditanyakan / FAQ)
   - Container 11: Tempelkan kode dari `11-kontak-footer.html` (Penutup, Footer & Floating WhatsApp)
4. Klik **Save Draft** atau **Publish**.

---

## Langkah 6: Pembersihan Cache dan Pengujian Responsif

1. **Purge Cache Hostinger**:
   - Di dashboard WP-Admin, klik menu **Hostinger** pada bar atas, lalu pilih **Purge All**.
   - Jika menggunakan plugin LiteSpeed Cache, klik ikon LiteSpeed dan pilih **Purge All - LSCache**.
2. **Pengujian Layar Desktop (1440px+)**:
   - Periksa tata letak floating header, kartu hero, carousel varietas, dan kisi footer.
   - Uji drag carousel dengan mouse dan tombol navigasi kiri/kanan.
   - Klik tombol play pada sesi "Pendekatan Kami" untuk memverifikasi jendela popup video.
3. **Pengujian Layar Ponsel (360px - 390px)**:
   - Buka DevTools (F12) dan aktifkan mode perangkat mobile (iPhone 12/14/15 atau Android 360px).
   - Pastikan tidak ada horizontal scrollbar (`overflow-x` tetap terkendali).
   - Uji klik tombol hamburger di kiri header: menu drawer mobile wajib terbuka penuh dan dapat ditutup kembali.
   - Uji tombol unduh harga dan tombol kontak WhatsApp / telepon.

---

## Langkah 7: Opsi Pendekatan Hybrid (Widget Asli vs Kode Kustom)

Jika tim pengelola klien ingin kemudahan menyunting konten harian tanpa menyentuh HTML:

| Bagian Halaman | Rekomendasi Format | Alasan |
|---|---|---|
| **Header** (`01-header.html`) | Widget HTML Kustom | Mempertahankan desain kapsul floating, tombol hamburger terintegrasi, dan responsive drawer tanpa benturan layout Astra. |
| **Hero** (`02-hero.html`) | Widget HTML Kustom | Memiliki dua kartu kaca (frosted glass) bertumpuk dengan posisi absolut presisi di atas gambar full-bleed. |
| **Varietas** (`03-varietas.html`) | Widget HTML Kustom | Slider kartu vertikal dengan touch-drag, mouse-drag, keyboard navigation, dan scroll-snap yang ringan tanpa perlu plugin Swiper/Slick tambahan. |
| **Statistik** (`04-statistik.html`) | Hybrid (Bisa HTML atau Elementor Counter) | Format HTML saat ini sudah memiliki observer angka dinamis. Jika klien ingin ganti angka lewat UI, dapat diganti widget native Counter Elementor dengan warna token `#1F3A14`. |
| **Pendekatan** (`05-pendekatan.html`) | Widget HTML Kustom | Integrasi tombol play video dengan modal dialog terisolasi. |
| **Ulasan Pelanggan** (`06-ulasan.html`) | Widget HTML Kustom | Kartu ulasan bergaya Google Maps dengan rating 5 bintang, inisial avatar kontras tinggi, dan tata letak scroll-snap horizontal responsif. |
| **Footer** (`07-footer.html`) | Widget HTML Kustom | 4 kolom responsif dengan kontras tinggi, tautan media sosial SVG inline, dan hak cipta. |

---

## Langkah 8: Rencana Rollback (Kembali ke Kondisi Semula)

Jika terjadi kendala selama masa pengujian atau revisi:
1. Karena pekerjaan dilakukan di halaman draf terpisah (misal `/beranda-baru`), halaman utama yang sedang aktif di `https://manggoes.id` tetap utuh dan tidak terpengaruh sama sekali.
2. Untuk menonaktifkan kode PHP aset kapan saja:
   - Matikan snippet di plugin Code Snippets / WPCode, ATAU
   - Hapus baris pemanggilan di `functions.php` tema anak.
3. Ketika draf sudah 100% disetujui oleh klien:
   - Buka **Settings > Reading** di WP-Admin.
   - Pada opsi **Your homepage displays**, pilih **A static page**.
   - Pilih halaman draf yang telah disetujui sebagai **Homepage**.
   - Simpan perubahan.
