# CreditPulse / CrediVault

> **Status: prototipe demo untuk pembelajaran dan portofolio.** Project ini tidak memproses pengajuan atau dana nyata. Seluruh data pada dataset demo bersifat sintetis.

CreditPulse menggabungkan simulasi beberapa bagian siklus kredit UMKM: intake pengajuan, pra-screening berbasis aturan, analisis arus kas, keputusan komite, alokasi pendanaan investor simulasi, serta simulasi indikator treasury.

## Batas demo

- Aplikasi adalah frontend React/Vite tanpa backend, autentikasi, database, atau integrasi eksternal.
- Peran hanya navigasi demo, bukan RBAC. Data dan riwayat demo tersimpan di browser melalui `localStorage`.
- Skor menggunakan aturan dan bobot buatan tangan. Skor, indikator risiko, rekomendasi, dan kontribusi faktor bukan model ML yang telah dilatih atau divalidasi.
- Nilai kerugian hanya proxy ilustratif. Nilai tersebut bukan PD/LGD/EAD terkalibrasi, CKPN, atau perhitungan PSAK 71/PSAK 413.
- Pool investor, escrow, SLIK, e-KYC, pencairan, pembayaran, dan rasio regulasi tidak terhubung ke layanan atau lembaga nyata.
- Jangan memasukkan data debitur, identitas, rekening, atau dokumen nyata.

## Modul demo

1. **Borrower** — formulir sintetis, simulator angsuran anuitas dan murabahah, dan pelacak status.
2. **Underwriter** — indikator berbasis aturan, rasio arus kas, uji sensitivitas, anomali dari agregat mutasi sintetis, dan checklist verifikasi demo.
3. **Komite** — hanya memilih berkas siap komite; mencatat komitmen untuk pengajuan bagi hasil dan simulasi pelepasan dana investor.
4. **Treasury** — hanya menampilkan skenario bank, simulasi penerimaan dan pencatatan pencairan, stres likuiditas, serta eksposur sektor.
5. **Admin** — parameter pra-screening dan profil demo; daftar anggota hanya data tampilan.

Bank/BPRS dan LPBBTI/P2P ditampilkan sebagai **dua skenario portofolio terpisah**. Demo ini tidak menyatukan kegiatan atau kewajiban regulasi keduanya menjadi satu produk operasional.

Untuk Mudharabah/Musyarakah, nisbah investor hanya angka demo dan belum menghitung distribusi hasil; tidak ada jadwal atau yield tetap yang ditampilkan.

## Menjalankan demo

```bash
npm install
npm run dev
```

Perintah `npm run build` dan `npm run test` tersedia untuk pemeriksaan pengembangan.

## Dokumen

- [ARCHITECTURE.md](./ARCHITECTURE.md) — arsitektur yang benar-benar ada dan batas simulasi.
- [ROADMAP.md](./ROADMAP.md) — rencana perbaikan demo dan gerbang sebelum memilih jalur produk nyata.
