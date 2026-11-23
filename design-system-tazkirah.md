# Sistem Desain Tazkirah (referensi Mizany)

Sumber: galeri Behance "Tazkirah — Prayer Tracker & Quran App UI/UX Design" karya Madhuri Mim (Tangail, Bangladesh), dibaca 16 Nov 2026 00:34–00:38 WIB — 11 modul proyek, tanpa sign-in, tanpa unduh aset. Semua nilai di bawah adalah yang tertulis/terlihat di slide; BUKAN pengukuran file Figma.

## Warna (6 hex TERTULIS di slide "Color & Typography" — satu-satunya hex di halaman)

- `#1941B5` — biru tua/gelap
- `#0F50BD` — biru primer
- `#8BA0F3` — biru periwinkle muda
- `#525252` — abu gelap (teks sekunder)
- `#FFFFFF` — putih
- `#101828` — hitam-biru (teks/judul)

Pemakaian yang terlihat: primer/aksi `#0F50BD`/`#1941B5` (header Home, tombol, nav aktif, banner streak); latar aplikasi putih dengan kartu putih + abu sangat muda; teks `#101828`, sekunder `#525252`.

## Tipografi

- Font: **Poppins** — Regular, Medium, SemiBold, Bold
- Heading 28px ("Being with peace"), Subheading 20px ("Record your prayers daily"), Body 16px
- Size 10–28, line-height 14–32
- Nama font Arab TIDAK disebutkan di halaman

## Ikon

- Pustaka: **Hugeicons**, ukuran 24px, gaya line/outline tipis (stroke ~1,5–2px, ujung membulat)
- Aktif di bottom nav = filled biru; non-aktif = outline abu

## Grid

- Layar 375×812, margin/gutter 20px, 4 kolom

## Komponen (pengamatan visual)

- Arc gauge: setengah lingkaran, track putih, isi gradien toska → biru (hijau di kanan atas, biru di ujung bawah kanan). **Hex gradien TIDAK ditulis — jangan ditebak.**
- Kartu: putih, radius ~16–20px, bayangan sangat lembut
- Bottom nav: pil/kapsul putih mengambang, bayangan lembut; aktif = pil biru `#0F50BD` + ikon putih + label
- Tombol primer: biru penuh lebar, bentuk pil, teks putih
- Kartu waktu sholat: ikon kuning/oranye (matahari/bulan) di atas nama + jam. **Hex kuning TIDAK ditulis.**
- Status sholat (layar Prayer): pil kecil "Next Prayer" hijau muda, "Upcoming" biru muda, "Completed" abu, "No Prayer Time" merah (Forbidden Prayer Times: Sunrise 06:10–06:30)
- Strip cuaca: kartu biru tua translusen di atas header biru, teks putih
- Tasbih: cincin progres gradien biru → toska, track abu muda

## Layar di galeri

Splash, onboarding ("Begin with peace"), Log in, Sign up, Home, Prayer (alarm + forbidden times), Quran (daftar Surah/Juz/Page + pembaca), Tracker (streak 6 Days), Calendar (Hijri + festival Islam), Qibla Finder (kompas 257°), Tasbih Counter (120/300, Rounds 2), Profile (menu + form), Content (Ayah/Dua/Hadith), wireframe. Klaim: "30+ Screens & Workflow Steps".

## Yang TIDAK terverifikasi / tidak diberi angka di halaman

- Hex gradien arc gauge, hex kuning/oranye ikon sholat, ketebalan stroke (angka), nilai radius/shadow, nama font Arab
- Nama surah setelah Al-Fatihah, label individual grid ikon Hugeicons (terlalu kecil dibaca)
