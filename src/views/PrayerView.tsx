import React from 'react'
import { ArrowLeft, Clock, MapPin, Sparkles, AlertCircle } from 'lucide-react'

interface PrayerViewProps {
  city: string
  onBack: () => void
}

export const PrayerView: React.FC<PrayerViewProps> = ({ city, onBack }) => {
  const prayerDetails = [
    { name: 'Imsak', time: '04:28', note: '10 menit sebelum Subuh', passed: true },
    { name: 'Subuh', time: '04:38', note: 'Mulai puasa harian', passed: true },
    { name: 'Terbit', time: '05:53', note: 'Matahari terbit (syuruq)', passed: true, forbidden: true },
    { name: 'Dhuha', time: '06:20', note: 'Mulai waktu sholat Dhuha', passed: true },
    { name: 'Dzuhur', time: '12:05', note: 'Matahari tergelincir', passed: true },
    { name: 'Ashar', time: '15:19', note: 'Bayangan sama panjang', passed: true },
    { name: 'Maghrib', time: '18:07', note: 'Waktu berbuka puasa', isNext: true },
    { name: 'Isya', time: '19:19', note: 'Dilanjutkan Sholat Tarawih & Witir' },
  ]

  return (
    <div className="space-y-4 pb-24">
      {/* Header with back button */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="w-10 h-10 rounded-xl glass-card flex items-center justify-center text-[#101828] hover:bg-white cursor-pointer active:scale-95 transition-all shadow-sm"
          aria-label="Kembali ke Beranda"
        >
          <ArrowLeft size={19} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-[#101828]">Jadwal Sholat Lengkap</h1>
          <div className="flex items-center gap-1 text-xs text-[#525252]">
            <MapPin size={13} className="text-[#0F50BD]" />
            <span>{city}</span>
            <span>•</span>
            <span>Kemenag RI</span>
          </div>
        </div>
      </div>

      {/* Next Prayer Highlight Card */}
      <div className="bg-gradient-to-r from-[#0F50BD] to-[#1941B5] text-white p-5 rounded-[22px] shadow-[0_8px_24px_rgba(25,65,181,0.2)]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#8BA0F3] uppercase tracking-wider">
            Sholat Berikutnya
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-bold">
            Maghrib
          </span>
        </div>
        <div className="mt-2 text-3xl font-extrabold">18:07 WIB</div>
        <p className="text-xs text-white/80 mt-1">Waktu berbuka puasa · Kurang lebih 2 jam 41 menit lagi</p>
      </div>

      {/* Detailed Prayer List */}
      <div className="glass-card divide-y divide-black/[0.05] overflow-hidden">
        {prayerDetails.map((item) => (
          <div
            key={item.name}
            className={`p-4 flex items-center justify-between transition-colors ${
              item.isNext ? 'bg-[#0F50BD]/5' : ''
            }`}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${item.isNext ? 'text-[#0F50BD]' : 'text-[#101828]'}`}>
                  {item.name}
                </span>
                {item.isNext && (
                  <span className="px-2 py-0.5 rounded-full bg-[#0F50BD] text-white text-[10px] font-bold">
                    Berikutnya
                  </span>
                )}
                {item.forbidden && (
                  <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-semibold">
                    Larangan Sholat
                  </span>
                )}
              </div>
              <div className="text-xs text-[#525252] mt-0.5">{item.note}</div>
            </div>

            <div className={`text-base font-bold ${item.isNext ? 'text-[#0F50BD]' : 'text-[#101828]'}`}>
              {item.time}
            </div>
          </div>
        ))}
      </div>

      {/* Note Waktu Tahrim */}
      <div className="glass-card p-4 flex items-start gap-2.5 bg-amber-50/40 border-amber-200/50">
        <AlertCircle size={18} className="text-[#F59E0B] shrink-0 mt-0.5" />
        <div className="text-xs text-[#525252] leading-relaxed">
          <b className="text-[#101828]">Waktu Terlarang Sholat (Tahrim):</b> Saat matahari tepat terbit hingga naik setinggi tombak (sekitar 15-20 menit setelah terbit), saat matahari tepat di puncaknya (istiwak), dan saat matahari tenggelam hingga sempurna.
        </div>
      </div>
    </div>
  )
}
