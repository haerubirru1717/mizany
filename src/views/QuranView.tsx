import React, { useState } from 'react'
import { MosqueSkyline } from '../components/MosqueSkyline'
import { BookOpen, Plus, Minus, CheckCircle2, Bookmark } from 'lucide-react'

interface QuranViewProps {
  dailyTarget?: number
}

export const QuranView: React.FC<QuranViewProps> = ({ dailyTarget = 20 }) => {
  const [pagesReadToday, setPagesReadToday] = useState(15)
  const [totalJuzDone] = useState(12) // Demo data sesuai v19

  return (
    <div className="space-y-4 pb-24">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-[#101828]">Quran & Tilawah</h1>
        <p className="text-xs text-[#525252] mt-0.5">Pantau target khatam dan tilawah harianmu</p>
      </div>

      {/* Banner Khatam Progress */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0F50BD] to-[#1941B5] text-white p-5 rounded-[22px] shadow-[0_8px_24px_rgba(25,65,181,0.2)]">
        <div className="absolute right-0 bottom-0 pointer-events-none opacity-20 w-56 h-auto">
          <MosqueSkyline className="w-full h-auto" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8BA0F3]">
              Progres Khatam Ramadan
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-bold">
              Hari ke-12
            </span>
          </div>

          <div className="mt-3">
            <div className="text-3xl font-extrabold">{totalJuzDone} <span className="text-lg font-normal text-white/80">/ 30 Juz</span></div>
            <p className="text-xs text-white/80 mt-1">
              Sudah menyelesaikan 40% dari total 30 Juz Al-Qur'an
            </p>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 rounded-full bg-white/20 overflow-hidden mt-4">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-teal-300 rounded-full"
              style={{ width: `${(totalJuzDone / 30) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Today's Tilawah Stepper */}
      <div className="glass-card p-5">
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="text-base font-bold text-[#101828]">Tilawah Hari Ini</h3>
          <span className="text-xs font-semibold text-[#525252]">
            Target: <span className="text-[#0F50BD] font-bold">{dailyTarget}</span> halaman/hari
          </span>
        </div>

        <div className="flex items-center justify-center gap-6 py-4">
          <button
            type="button"
            onClick={() => setPagesReadToday(Math.max(0, pagesReadToday - 1))}
            className="w-12 h-12 rounded-2xl glass-card flex items-center justify-center text-[#525252] hover:text-[#101828] active:scale-95 transition-all shadow-sm cursor-pointer"
            aria-label="Kurangi 1 halaman"
          >
            <Minus size={20} strokeWidth={2.5} />
          </button>

          <div className="text-center">
            <div className="text-4xl font-extrabold text-[#0F50BD]">{pagesReadToday}</div>
            <div className="text-xs font-medium text-[#525252] mt-1">halaman selesai</div>
          </div>

          <button
            type="button"
            onClick={() => setPagesReadToday(pagesReadToday + 1)}
            className="w-12 h-12 rounded-2xl bg-[#0F50BD] text-white flex items-center justify-center active:scale-95 transition-all shadow-[0_4px_14px_rgba(15,80,189,0.3)] cursor-pointer"
            aria-label="Tambah 1 halaman"
          >
            <Plus size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Quick buttons */}
        <div className="grid grid-cols-3 gap-2 mt-2 pt-3 border-t border-black/[0.06]">
          <button
            type="button"
            onClick={() => setPagesReadToday(pagesReadToday + 5)}
            className="py-1.5 rounded-lg bg-black/[0.04] text-xs font-semibold text-[#525252] hover:bg-[#0F50BD]/10 hover:text-[#0F50BD] cursor-pointer"
          >
            +5 Hal
          </button>
          <button
            type="button"
            onClick={() => setPagesReadToday(pagesReadToday + 10)}
            className="py-1.5 rounded-lg bg-black/[0.04] text-xs font-semibold text-[#525252] hover:bg-[#0F50BD]/10 hover:text-[#0F50BD] cursor-pointer"
          >
            +10 Hal
          </button>
          <button
            type="button"
            onClick={() => setPagesReadToday(dailyTarget)}
            className="py-1.5 rounded-lg bg-[#0F50BD]/10 text-xs font-bold text-[#0F50BD] hover:bg-[#0F50BD]/20 cursor-pointer"
          >
            Capai Target
          </button>
        </div>
      </div>

      {/* Terakhir Dibaca */}
      <div className="glass-card p-4 flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-2xl bg-[#0F50BD]/10 text-[#0F50BD] flex items-center justify-center shrink-0">
          <Bookmark size={22} />
        </div>
        <div className="flex-1">
          <div className="text-xs font-medium text-[#525252]">Terakhir dibaca</div>
          <div className="text-sm font-bold text-[#101828]">Surah Yusuf : Ayat 53</div>
        </div>
        <span className="text-xs text-[#0F50BD] font-bold">Juz 13</span>
      </div>

      <p className="text-[11px] text-center text-[#525252]/80 mt-2">
        Data contoh — prototipe · Sesuaikan target tilawah di menu Pengaturan
      </p>
    </div>
  )
}
