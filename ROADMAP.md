# Roadmap CreditPulse / CrediVault

## Tujuan

Menjadikan project ini demo portofolio yang bisa diikuti dari pengajuan sampai keputusan, sambil memperagakan skenario bank/BPRS dan pendanaan investor secara terpisah. Dataset tetap sintetis; seluruh angka dan tindakan demo harus diberi label simulasi.

## Status implementasi saat ini

**Baseline demo sudah diterapkan:** alur pencairan bank dan pelepasan dana investor dipisahkan; aplikasi bank tidak lagi memakai komitmen P2P seed; hasil skor/kerugian dan dokumen diberi batasan demo; batch komite hanya memproses berkas siap komite.

**Fitur demo lanjutan telah selesai diimplementasikan:**
- **Checklist dokumen berjenjang:** status bertahap (*Belum Diperiksa*, *Sedang Ditelaah*, *Diverifikasi Valid*, dan *Perlu Revisi*) beserta catatan analis per dokumen tanpa mengklaim verifikasi biro eksternal.
- **Paket skenario demo deterministik siap pakai:** pemulihan instan 3 kasus uji terarah (*Kasus Lancar / Prime*, *Kasus Borderline / Butuh Restrukturisasi*, dan *Kasus Perlu Ditolak / Fraud Anomaly Warning*) langsung dari Topbar maupun Workspace Analis tanpa menghapus data browser lain.
- **Simulasi bagi hasil laba usaha riil (Mudharabah/Musyarakah):** kalkulator pembagian nisbah hasil usaha bulanan, proyeksi *equivalent return* p.a. indikatif, serta matriks sensitivitas 3 skenario kinerja (+20%, 0%, -20%) sesuai prinsip *profit-and-loss sharing* syariah tanpa bunga tetap.
- **Pencarian, filter, dan ekspor riwayat tindakan (Audit Log):** pencarian kata kunci, filter peran aktor, tampilan snapshot risiko/DSCR, serta tombol unduh file `.CSV` dan `.JSON` ber-watermark data sintetis lokal.
- **Validasi formulir pengajuan:** pencegahan data tidak lengkap/negatif dengan peringatan validasi informatif.

## Tahap demo

### 1. Kejujuran produk dan batas skenario

- Nyatakan di README, layar awal, memo, ekspor, dan dashboard bahwa aplikasi adalah demo lokal.
- Pisahkan jalur bank neraca sendiri dan jalur commitment investor; tidak menyebut commitment sebagai escrow atau pencairan nyata.
- Ganti istilah yang mengklaim ML/SHAP/PD/ECL/CKPN/RBAC/audit immutable bila belum diimplementasikan.
- Beri cap data sintetis pada nama nasabah, dokumen, consent, dan event log.

**Selesai bila:** pengunjung demo dapat membedakan fitur yang berjalan dari integrasi yang disimulasikan.

### 2. Alur pengajuan dan keputusan

- Lengkapi status: pengajuan → review → siap komite → disetujui menunggu penerimaan → penawaran diterima → pencairan demo.
- Batasi batch committee action hanya pada berkas yang siap dibahas.
- Pisahkan jalur bank (penerimaan penawaran → catat pencairan bank demo) dari jalur bagi hasil (komitmen penuh → penerimaan penawaran → catat pelepasan dana investor demo).
- Baru buat status dokumen `verified` lewat aksi underwriter; pengajuan baru dimulai sebagai belum diverifikasi.
- Batasi commitment investor ke sisa kebutuhan aplikasi dan likuiditas pool sintetis.

**Selesai bila:** satu kasus sintetis bisa ditelusuri end-to-end tanpa menyebut approval sebagai disbursement.

### 3. Mesin risiko demo

- Namai mesin sebagai pra-screening berbasis aturan; jangan mengklaim model terlatih.
- Namai kontribusi sebagai kontribusi faktor aturan, bukan SHAP.
- Namai nilai kerugian sebagai proxy ilustratif, bukan CKPN/PSAK 71.
- Tambahkan skenario batas, input tidak lengkap, dan alasan hasil yang bisa dibaca.
- Dokumentasikan definisi DSCR/DSR dan jangan mencampur omzet dengan pendapatan bersih tanpa label.
- Bedakan jadwal Murabahah dari proyeksi bagi hasil Mudharabah/Musyarakah; bila model bagi hasil belum dibuat, tandai sebagai belum disimulasikan.

**Selesai bila:** setiap angka dashboard dijelaskan dengan input, rumus demo, dan batas pemakaian.

### 4. Konsistensi demo dan presentasi

- Hilangkan SLA, uptime, RBAC, connector, dan immutable audit yang saat ini hanya angka/teks statis.
- Gunakan timestamp dinamis dan ID event unik untuk event lokal demo.
- Sediakan reset demo yang jelas dan seed yang konsisten.
- Tampilkan label skenario bank atau investor pada halaman terkait.
- Perbarui laporan HTML/CSV agar tidak menyebut metrik proxy sebagai angka regulator atau akuntansi.

**Selesai bila:** seluruh layar, ekspor, dan dokumentasi menggunakan istilah yang sama.

## Gerbang bila kelak diarahkan ke produk nyata

Demo ini tidak otomatis siap produksi setelah tahap di atas. Sebelum pekerjaan produksi dimulai, pilih satu jalur dan bentuk backlog terpisah:

### Jalur LOS bank/BPRS

Tetapkan jenis lembaga dan kebijakan kredit; bangun backend, identitas, RBAC, pemisahan data, penyimpanan dokumen, maker-checker, core banking/GL/payment integration, servicing, rekonsiliasi, audit service, keamanan, DR/BCP, dan pelaporan sesuai lembaga.

### Jalur LPBBTI/P2P

Tetapkan penyelenggara berizin, peran perantara, onboarding pemberi dana, keterbukaan risiko/biaya, eligibility, alokasi dana, kontrak, payment/escrow rails yang sah, reporting OJK/asosiasi, servicing, penagihan, pengaduan, keamanan, dan audit. Jangan memakai asumsi neraca bank sebagai pengganti alur LPBBTI.

### Governance kredit dan akuntansi

Untuk kedua jalur, validasi definisi dan policy bersama pemilik risiko, kepatuhan, legal, serta akuntansi. Model scoring memerlukan data kinerja yang sah, validasi independen, kalibrasi, backtesting, fairness, drift monitoring, reason codes, model versioning, dan mekanisme override. Pengukuran penurunan nilai harus mengikuti instrumen dan standar yang relevan; aset syariah tertentu memerlukan penilaian PSAK 413.

## Indikator selesai untuk demo portofolio

- Tidak ada klaim konektor, autentikasi, legal compliance, atau uptime yang tidak didukung kode.
- Skor, rekomendasi, dan proxy risiko dijelaskan sebagai hasil simulasi.
- Persetujuan komite tidak langsung menyatakan pencairan.
- Pengajuan baru tidak otomatis memiliki consent/dokumen terverifikasi.
- Skenario bank dan investor dapat diperagakan secara terpisah.

## Fitur demo lanjutan yang telah diselesaikan

- [x] Checklist dokumen berjenjang dengan 4 tahapan status (*Belum Diperiksa*, *Sedang Ditelaah*, *Diverifikasi Valid*, dan *Perlu Revisi*) serta catatan analis per dokumen, tanpa menyebut verifikasi eksternal.
- [x] Paket skenario demo deterministik (kasus lancar, borderline, dan perlu ditolak) yang bisa dipulihkan langsung dari Topbar/Workspace tanpa menghapus data browser lain.
- [x] Simulasi bagi hasil berbasis asumsi laba usaha riil untuk Mudharabah/Musyarakah dengan kalkulator nisbah dan matriks sensitivitas 3 skenario kinerja (+20%, 0%, -20%).
- [x] Pencarian dan filter riwayat tindakan (berdasarkan nama pemohon, nomor LOS, dan peran aktor), dilengkapi ekspor riwayat ke `.CSV` dan `.JSON` ber-watermark data sintetis.
- [x] Validasi input formulir pengajuan debitur yang komprehensif dengan penanganan data tidak lengkap dan pesan peringatan ramah.
