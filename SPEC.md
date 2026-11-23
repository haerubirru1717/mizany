# Mizany — Spesifikasi Aplikasi Tracking Amal Harian

Nama: **Mizany** ("timbanganku"). Dibuat 15 November 2026 dari hasil planning 3 ronde bersama user. Semua keputusan di bawah sudah disetujui user.

## Problem Statement

Sulit konsisten mencatat amal harian, terutama di bulan Ramadan. Tidak ada alat yang sederhana, gratis, dan merekap progres harian dalam satu tempat.

## Solution

Mizany adalah web app gratis untuk siapa pun. Login pakai Google. Tiap hari user mencentang amal yang sudah dilakukan, melihat progres tilawah dan streak, serta jadwal sholat sesuai kotanya. Dipakai sepanjang tahun; mode khusus Ramadan aktif otomatis saat Ramadan.

## User Stories

1. Sebagai pengguna, saya ingin login pakai Google, supaya tidak perlu membuat password baru.
2. Sebagai pengguna, saya ingin mencentang amal harian (puasa, sholat 5 waktu, tarawih, witir, tilawah, dzikir, sedekah, sahur), supaya tahu apa yang sudah dan belum dilakukan hari ini.
3. Sebagai pengguna, saya ingin menambah amal sendiri, supaya daftarnya sesuai kebiasaan saya.
4. Sebagai pengguna, saya ingin mengatur target tilawah per hari (juz atau halaman), supaya bisa khatam tepat waktu.
5. Sebagai pengguna, saya ingin melihat progres khatam, supaya tahu sudah sejauh mana.
6. Sebagai pengguna, saya ingin melihat jadwal sholat sesuai kota saya, supaya tidak perlu buka aplikasi lain.
7. Sebagai pengguna, saya ingin melihat kalender Ramadan 30 hari dan hari ke-berapa sekarang, supaya sadar posisi saya di bulan ini.
8. Sebagai pengguna, saya ingin melihat streak dan skor harian, supaya termotivasi konsisten.
9. Sebagai pengguna, saya ingin melihat rekap mingguan, supaya bisa evaluasi.
10. Sebagai pengguna, saya ingin data tersimpan di cloud, supaya bisa dibuka dari HP atau laptop mana saja.
11. Sebagai pengguna, saya ingin mengedit centang hari yang lalu, supaya bisa memperbaiki kalau lupa isi.
12. Sebagai pengguna, saya ingin mengganti kota untuk jadwal sholat, supaya tetap akurat saat bepergian.
13. Sebagai pengguna, saya ingin memakai aplikasi tanpa iklan dan tanpa biaya, selamanya.

## Implementation Decisions

- Platform: web app, mobile-first, PWA-ready (bisa dipasang ke home screen HP).
- Stack yang diusulkan: Next.js + hosting Vercel (gratis; sudah dipakai TokenGratis AI). Database + auth: Supabase (Postgres + Google OAuth, free tier). Satu backend untuk auth dan data.
- Jadwal sholat: API Aladhan gratis (aladhan.com), metode Kemenag Indonesia. Kota dipilih user dan disimpan di profil.
- Kalender Hijriah: dari API Aladhan. Tanggal mulai Ramadan bisa dikoreksi manual mengikuti sidang isbat pemerintah.
- Mode Ramadan: aktif otomatis saat bulan Ramadan. Saat aktif, tarawih, witir, dan target khatam 30 hari muncul. Di luar Ramadan, checklist umum saja.
- Data model: users, amal_items (default + custom per user), daily_logs (user, tanggal, amal, status/nilai), tilawah_progress, settings (kota).
- Fase 1: login Google, checklist harian, amal custom, target tilawah, jadwal sholat, kalender + streak, rekap mingguan.
- Fase 2: notifikasi pengingat (sahur, buka, sholat), grup/ustadz pantau santri.
- Target rilis: sebelum tarawih pertama Ramadan 1448 H. Prediksi 1 Ramadan = Senin, 8 Februari 2027 (BMKG dan Muhammadiyah sepakat; tarawih pertama Minggu malam, 7 Februari 2027; tanggal resmi menunggu sidang isbat).

## Testing Decisions

- Tes perilaku luar, bukan detail implementasi: login berhasil, centang tersimpan, target tilawah terhitung benar, jadwal sholat sesuai kota, mode Ramadan hidup/mati di tanggal batas.
- Tes manual di HP Android dan desktop sebelum rilis.
- Tanpa tes unit untuk detail implementasi.

## Out of Scope

- Grup, keluarga, atau ustadz pantau santri (fase 2).
- Notifikasi push (fase 2).
- Aplikasi native Android/iOS.
- Pembayaran, donasi, iklan.
- Konten kajian atau artikel.

## Further Notes

- Selalu gratis: biaya jalan di free tier (Vercel + Supabase + Aladhan).
- Domain belum dicek (mizany.com / .id / .app). Cek ketersediaan sebelum beli.
- Desain mengikuti disiplin impeccable (standar user). Mockup visual dulu, eksekusi setelah user bilang Gas.
