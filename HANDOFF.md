# HANDOFF Mizany

Dokumen ini untuk agent lain yang melanjutkan pengembangan Mizany.
Baca dokumen ini dulu, lalu dokumen yang dirujuk, sebelum mengubah apa pun.

## Baca dulu, urut

1. `README.md` — gambaran proyek dan status.
2. `SPEC.md` — spesifikasi lengkap (fitur, amal, fase).
3. `design-system-tazkirah.md` — sistem visual yang berlaku.
4. `prototype/v19.html` — wujud UI terbaru (v19). Buka di browser,
   jangan hanya baca kodenya.
5. `design-system/mizany/MASTER.md` — design system hasil pencarian.
   Perhatian: gaya claymorphism di dokumen ini DITOLAK. Yang berlaku
   adalah token Tazkirah (poin di bawah).
6. `catatan-intro-nawaetu.md` — riset intro aplikasi sejenis.

## Desain yang berlaku (jangan diubah tanpa persetujuan user)

- Token Tazkirah: primer `#0F50BD`, hero `#1941B5`, `#8BA0F3`,
  teks `#101828`, abu `#525252`, putih. Font Poppins. Detail lengkap
  di `design-system-tazkirah.md`.
- Hero biru solid `#1941B5` full-bleed dengan artwork skyline masjid.
  Sudah disetujui user, jangan diubah.
- Bottom nav kapsul putih mengambang, pil aktif `#0F50BD`.
- Ikon sholat kuning-oranye `#F59E0B`. Tombol primer pil biru penuh.
- Kartu kaca terang (putih 90-92%). Glassmorphism gelap DITOLAK.
- Claymorphism DITOLAK.

## Keadaan prototipe v19 (jujur)

Dihitung live: progres harian (selesai/total), countdown dan gauge
sholat berikutnya, persentase tilawah, rata-rata mingguan.

Masih angka contoh atau hardcode. Jangan sajikan sebagai hasil hitung:
streak "11 hari" (belum ada fungsi streak), khatam "12 dari 30 juz",
kalender hari 1-11, rekap, jadwal sholat (tanpa API Aladhan meski
labelnya "Metode Kemenag RI"; ganti kota hanya ganti label), tanggal
demo "12 Ramadan 1448 H, 19 Februari 2027".

Tidak ada rumus skor, poin, atau level. Data demo berlabel
"Data contoh — prototipe". State hanya sesi (tidak tersimpan).

## Keputusan yang belum dibuat (jangan putuskan sendiri)

1. Definisi streak nyata: checklist 100% atau cukup 1 amal.
2. Bagian "Cara Mizany menghitung" di Pengaturan: dibuat atau tidak.
3. Kompas kiblat: ditambah atau tidak (tidak ada di spek).
4. Dasar pembangunan aplikasi sebenarnya: fork
   Abdelkaderbzz/ramadan-tracker (MIT, Next.js 14 + Tailwind + shadcn,
   PWA, API Aladhan) atau bangun dari nol. Jangan mulai fork atau
   bangun sebelum user memilih.
5. Domain: mizany.id masih kosong (per 16 Nov 2026), belum dibeli.

## Batasan

- Nawaetu (hadianr/nawaetu) berlisensi AGPLv3: inspirasi saja,
  jangan salin kodenya.
- Jangan mengarang angka, pengalaman, atau klaim. Angka contoh
  harus dilabeli contoh.
- Target rilis: sebelum tarawih pertama 7 Feb 2027 (1 Ramadan 1448 H
  diprediksi 8 Feb 2027; resmi menunggu sidang isbat).

## Cara melanjutkan

- Verifikasi tiap perubahan di level kode. Uji klik dan visual di HP
  diserahkan ke user.
- Perubahan visual: tunjukkan hasil rendernya sebelum dianggap selesai.
- Perbaiki hanya poin yang disebutkan. Desain yang sudah dikunci
  jangan diubah.
