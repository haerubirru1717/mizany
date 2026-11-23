import React, { useState, useEffect } from 'react'
import { MosqueSkyline } from '../components/MosqueSkyline'
import { Plus, Minus, Bookmark, Link2 } from 'lucide-react'

interface QuranViewProps {
  dailyTarget: number
  pagesReadToday: number
  totalPagesRead: number
  hijriDateLabel?: string
  linkedAmalName?: string
  onChangePagesToday: (nextPages: number) => void
  onAddToChecklist?: () => void
}

const TOTAL_MUSHAF_PAGES = 604

export const QuranView: React.FC<QuranViewProps> = ({
  dailyTarget,
  pagesReadToday,
  totalPagesRead,
  hijriDateLabel,
  linkedAmalName,
  onChangePagesToday,
  onAddToChecklist,
}) => {
  const [lastReadNote, setLastReadNote] = useState<string>('')

  useEffect(() => {
    try {
      const saved = localStorage.getItem('mizany_last_read_quran')
      if (saved) setLastReadNote(saved)
    } catch {}
  }, [])

  const handleSaveLastRead = (value: string) => {
    setLastReadNote(value)
    try {
      localStorage.setItem('mizany_last_read_quran', value)
    } catch {}
  }

  const completedJuz = Math.min(30, Number((totalPagesRead / (TOTAL_MUSHAF_PAGES / 30)).toFixed(1)))
  const khatamPercent = Math.min(100, Math.round((totalPagesRead / TOTAL_MUSHAF_PAGES) * 100))
  const todayPercent = dailyTarget > 0 ? Math.min(100, Math.round((pagesReadToday / dailyTarget) * 100)) : 0

  return (
    <div className="space-y-4 pb-24">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-[#101828]">Quran & Tilawah</h1>
        <p className="text-xs text-[#525252] mt-0.5">Pantau target khatam dan tilawah harianmu</p>
      </div>

      {/* Banner Khatam Progress (Real Cumulative Pages) */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0F50BD] to-[#1941B5] text-white p-5 rounded-[22px] shadow-[0_8px_24px_rgba(25,65,181,0.2)]">
        <div className="absolute right-0 bottom-0 pointer-events-none opacity-20 w-56 h-auto">
          <MosqueSkyline className="w-full h-auto" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8BA0F3]">
              Progres Khatam
            </span>
            {hijriDateLabel && (
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-bold truncate">
                {hijriDateLabel}
              </span>
            )}
          </div>

          <div className="mt-3">
            <div className="text-3xl font-extrabold tabular-nums">
              {completedJuz}{' '}
              <span className="text-lg font-normal text-white/80">/ 30 Juz</span>
            </div>
            <p className="text-xs text-white/80 mt-1 tabular-nums">
              {totalPagesRead} dari {TOTAL_MUSHAF_PAGES} halaman Mushaf ({khatamPercent}%)
            </p>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 rounded-full bg-white/20 overflow-hidden mt-4">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-teal-300 rounded-full transition-all duration-300"
              style={{ width: `${khatamPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Today's Tilawah Stepper (Two-Way Synced with Beranda Checklist) */}
      <div className="glass-card p-5">
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="text-base font-bold text-[#101828]">Tilawah Hari Ini</h3>
          <span className="text-xs font-semibold text-[#525252] tabular-nums">
            Target: <span className="text-[#0F50BD] font-bold">{dailyTarget}</span> hal ({todayPercent}%)
          </span>
        </div>

        <div className="flex items-center justify-center gap-6 py-4">
          <button
            type="button"
            onClick={() => onChangePagesToday(Math.max(0, pagesReadToday - 1))}
            className="w-12 h-12 rounded-2xl glass-card flex items-center justify-center text-[#525252] hover:text-[#101828] active:scale-95 transition-all shadow-sm cursor-pointer"
            aria-label="Kurangi 1 halaman"
          >
            <Minus size={20} strokeWidth={2.5} />
          </button>

          <div className="text-center">
            <div className="text-4xl font-extrabold text-[#0F50BD] tabular-nums">{pagesReadToday}</div>
            <div className="text-xs font-medium text-[#525252] mt-1">halaman selesai</div>
          </div>

          <button
            type="button"
            onClick={() => onChangePagesToday(pagesReadToday + 1)}
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
            onClick={() => onChangePagesToday(pagesReadToday + 5)}
            className="py-1.5 rounded-lg bg-black/[0.04] text-xs font-semibold text-[#525252] hover:bg-[#0F50BD]/10 hover:text-[#0F50BD] cursor-pointer"
          >
            +5 Hal
          </button>
          <button
            type="button"
            onClick={() => onChangePagesToday(pagesReadToday + 10)}
            className="py-1.5 rounded-lg bg-black/[0.04] text-xs font-semibold text-[#525252] hover:bg-[#0F50BD]/10 hover:text-[#0F50BD] cursor-pointer"
          >
            +10 Hal
          </button>
          <button
            type="button"
            onClick={() => onChangePagesToday(dailyTarget)}
            className="py-1.5 rounded-lg bg-[#0F50BD]/10 text-xs font-bold text-[#0F50BD] hover:bg-[#0F50BD]/20 cursor-pointer"
          >
            Capai Target
          </button>
        </div>
      </div>

      {/* Penanda Terakhir Dibaca (Editable & Persisted) */}
      <div className="glass-card p-4 flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-2xl bg-[#0F50BD]/10 text-[#0F50BD] flex items-center justify-center shrink-0">
          <Bookmark size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <label htmlFor="last-read-input" className="text-xs font-medium text-[#525252] block">
            Penanda terakhir dibaca
          </label>
          <input
            id="last-read-input"
            type="text"
            value={lastReadNote}
            onChange={(e) => handleSaveLastRead(e.target.value)}
            placeholder="Tulis surah & ayat, mis. Al-Baqarah : 183"
            maxLength={60}
            className="w-full mt-0.5 text-sm font-bold text-[#101828] bg-transparent border-b border-transparent focus:border-[#0F50BD] focus:outline-none placeholder:font-normal placeholder:text-[#525252]/60"
          />
        </div>
      </div>

      {/* Two-way checklist sync status */}
      {linkedAmalName ? (
        <div className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-[#0F766E] bg-teal-50/80 border border-teal-200/70 rounded-xl px-3 py-2">
          <Link2 size={13} className="shrink-0" />
          <span>
            Tersinkron dua arah dengan checklist Beranda: <b>{linkedAmalName}</b>
          </span>
        </div>
      ) : (
        <div className="glass-card p-3.5 flex items-center justify-between gap-2.5">
          <p className="text-[11px] text-[#525252] leading-snug">
            Tercatat ke progres khatam & streak. Ingin tampil juga di Checklist Beranda?
          </p>
          {onAddToChecklist && (
            <button
              type="button"
              onClick={onAddToChecklist}
              className="px-3 py-1.5 rounded-full bg-[#0F50BD]/10 text-[#0F50BD] text-[11px] font-bold hover:bg-[#0F50BD]/20 shrink-0 cursor-pointer transition-colors"
            >
              + Checklist
            </button>
          )}
        </div>
      )}
    </div>
  )
}
