import React from 'react'
import { ArrowLeft, MapPin, AlertCircle } from 'lucide-react'
import { PrayerSchedule } from '../services/prayerService'

interface PrayerViewProps {
  city: string
  prayerSchedule?: PrayerSchedule | null
  onBack: () => void
}

export const PrayerView: React.FC<PrayerViewProps> = ({ city, prayerSchedule, onBack }) => {
  const t = prayerSchedule?.timings
  const nextId = prayerSchedule?.nextPrayer?.id

  const prayerDetails = [
    { id: 'imsak', name: 'Imsak', time: t?.imsak || '--:--', note: '10 menit sebelum Subuh' },
    { id: 'subuh', name: 'Subuh', time: t?.subuh || '--:--', note: 'Mulai waktu fajar' },
    { id: 'terbit', name: 'Terbit', time: t?.terbit || '--:--', note: 'Matahari terbit (syuruq)', forbidden: true },
    { id: 'dhuha', name: 'Dhuha', time: t?.dhuha || '--:--', note: 'Mulai waktu sholat Dhuha' },
    { id: 'dzuhur', name: 'Dzuhur', time: t?.dzuhur || '--:--', note: 'Matahari tergelincir' },
    { id: 'ashar', name: 'Ashar', time: t?.ashar || '--:--', note: 'Bayangan sama panjang' },
    { id: 'maghrib', name: 'Maghrib', time: t?.maghrib || '--:--', note: 'Matahari terbenam' },
    { id: 'isya', name: 'Isya', time: t?.isya || '--:--', note: 'Hilangnya syafaq merah' },
  ]

  const nextName = prayerSchedule?.nextPrayer?.name || 'Memuat...'
  const nextTime = prayerSchedule?.nextPrayer?.time || '--:--'
  const nextRemaining = prayerSchedule?.nextPrayer?.remainingLabel || 'Mengambil jadwal Kemenag RI...'

  return (
    <div className="space-y-4 pb-28">
      {/* Header with back button */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="w-10 h-10 rounded-xl glass-card flex items-center justify-center text-[#101828] hover:border-[#CBD5E1] cursor-pointer active:scale-95 transition-all shrink-0"
          aria-label="Kembali ke Beranda"
        >
          <ArrowLeft size={19} />
        </button>
        <div className="min-w-0">
          <h1 className="text-xl font-extrabold text-[#101828] tracking-tight">
            Jadwal Sholat Lengkap
          </h1>
          <div className="flex items-center gap-1.5 text-xs text-[#475467] mt-0.5 truncate">
            <MapPin size={13} className="text-[#0F50BD] shrink-0" aria-hidden="true" />
            <span className="truncate">{city}</span>
            <span aria-hidden="true">·</span>
            <span className="shrink-0">Kemenag RI</span>
          </div>
        </div>
      </div>

      {/* Rich Tazkirah Blue Next Prayer Highlight Card */}
      <div className="bg-gradient-to-r from-[#0F50BD] to-[#1941B5] text-white p-5 rounded-[22px] shadow-[0_8px_24px_rgba(25,65,181,0.2)] flex items-center justify-between gap-3">
        <div>
          <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/18 border border-white/25 text-white text-xs font-bold">
            {nextName} berikutnya
          </span>
          <p className="text-xs text-[#DBEAFE] font-medium mt-2">{nextRemaining}</p>
        </div>
        <div className="text-3xl font-extrabold text-white tabular-nums tracking-tight shrink-0">
          {nextTime}
        </div>
      </div>

      {/* Detailed Prayer List */}
      <div className="glass-card divide-y divide-[#EEF2F6] overflow-hidden">
        {prayerDetails.map((item) => {
          const isNext = item.id === nextId
          return (
            <div
              key={item.id}
              className={`px-4 py-3.5 flex items-center justify-between gap-2 transition-colors ${
                isNext ? 'bg-[#F5F9FF]' : ''
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-sm font-bold ${isNext ? 'text-[#0F50BD]' : 'text-[#101828]'}`}
                  >
                    {item.name}
                  </span>
                  {isNext && (
                    <span className="px-2 py-0.5 rounded-full bg-[#0F50BD] text-white text-[11px] font-bold">
                      Berikutnya
                    </span>
                  )}
                  {item.forbidden && (
                    <span className="px-2 py-0.5 rounded-md bg-red-50 border border-red-200 text-red-700 text-[11px] font-semibold">
                      Larangan Sholat
                    </span>
                  )}
                </div>
                <div className="text-xs text-[#475467] mt-0.5">{item.note}</div>
              </div>

              <div
                className={`text-base font-bold tabular-nums shrink-0 ${
                  isNext ? 'text-[#0F50BD]' : 'text-[#101828]'
                }`}
              >
                {item.time}
              </div>
            </div>
          )
        })}
      </div>

      {/* Note Waktu Tahrim */}
      <div className="rounded-[18px] p-4 flex items-start gap-2.5 bg-[#FFFBEB] border border-[#FDE68A]">
        <AlertCircle size={18} className="text-[#B45309] shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-xs text-[#475467] leading-relaxed">
          <b className="text-[#101828]">Waktu Terlarang Sholat (Tahrim):</b> Saat matahari tepat terbit hingga naik setinggi tombak (sekitar 15–20 menit setelah terbit), saat matahari tepat di puncaknya (istiwak), dan saat matahari tenggelam hingga sempurna.
        </p>
      </div>
    </div>
  )
}
