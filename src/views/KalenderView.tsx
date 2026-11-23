import React from 'react'
import { Calendar as CalendarIcon, Check, Sparkles } from 'lucide-react'

export const KalenderView: React.FC = () => {
  const currentRamadanDay = 12 // Data demo sesuai v19

  // Generate 30 days of Ramadan
  const days = Array.from({ length: 30 }, (_, i) => {
    const dayNum = i + 1
    const isPast = dayNum < currentRamadanDay
    const isToday = dayNum === currentRamadanDay
    const isLailatulQadr = dayNum >= 21 && dayNum % 2 !== 0 // Malam ganjil
    return {
      dayNum,
      isPast,
      isToday,
      isLailatulQadr,
    }
  })

  return (
    <div className="space-y-4 pb-24">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-[#101828]">Kalender Ramadan</h1>
        <p className="text-xs text-[#525252] mt-0.5">Pantau perjalanan 30 hari ibadah di bulan suci</p>
      </div>

      {/* Recap Banner */}
      <div className="glass-card p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#0F50BD]/10 text-[#0F50BD] flex items-center justify-center">
            <CalendarIcon size={22} />
          </div>
          <div>
            <div className="text-sm font-bold text-[#101828]">Hari ke-{currentRamadanDay} Ramadan</div>
            <div className="text-xs text-[#525252]">Tersisa 18 hari menuju Idul Fitri</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs font-semibold text-[#525252]">Rata-rata</div>
          <div className="text-base font-extrabold text-[#0F50BD]">85%</div>
        </div>
      </div>

      {/* 30-Day Grid */}
      <div className="glass-card p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-[#101828]">30 Hari Ramadan 1448 H</h3>
          <div className="flex items-center gap-2 text-[10px] text-[#525252]">
            <span className="flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-[#0F50BD] inline-block" /> Terisi</span>
            <span className="flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-[#F59E0B] inline-block" /> Hari ini</span>
          </div>
        </div>

        <div className="grid grid-cols-6 sm:grid-cols-7 gap-2">
          {days.map((d) => {
            return (
              <div
                key={d.dayNum}
                className={`aspect-square rounded-xl p-1 flex flex-col items-center justify-center relative transition-all ${
                  d.isToday
                    ? 'bg-[#0F50BD] text-white shadow-[0_4px_12px_rgba(15,80,189,0.3)] ring-2 ring-[#0F50BD]/40 font-bold'
                    : d.isPast
                    ? 'bg-blue-50/80 text-[#0F50BD] font-semibold border border-[#0F50BD]/20'
                    : 'bg-white/70 text-[#525252] border border-black/[0.05]'
                }`}
              >
                <span className="text-xs">{d.dayNum}</span>
                {d.isPast && <Check size={12} strokeWidth={3} className="mt-0.5 text-[#0F50BD]" />}
                {d.isToday && <span className="text-[9px] uppercase tracking-wider font-extrabold text-[#8BA0F3]">Kini</span>}
                {d.isLailatulQadr && (
                  <span className="absolute -top-1 -right-1 text-[#F59E0B]">
                    <Sparkles size={11} fill="currentColor" />
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Info Lailatul Qadar */}
      <div className="glass-card p-4 flex items-start gap-3 bg-amber-50/40 border-amber-200/50">
        <div className="w-8 h-8 rounded-xl bg-[#F59E0B]/15 text-[#F59E0B] flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles size={17} />
        </div>
        <div>
          <div className="text-xs font-bold text-[#101828]">Malam Lailatul Qadar</div>
          <p className="text-[11px] text-[#525252] mt-0.5 leading-relaxed">
            Ikon bintang menandai 10 malam terakhir (terutama malam-malam ganjil: 21, 23, 25, 27, 29). Tingkatkan tilawah, qiyamul lail, dan iktikaf.
          </p>
        </div>
      </div>

      <p className="text-[11px] text-center text-[#525252]/80 mt-2">
        Data kalender contoh — prototipe · Tanggal resmi 1 Ramadan menunggu sidang isbat Kemenag
      </p>
    </div>
  )
}
