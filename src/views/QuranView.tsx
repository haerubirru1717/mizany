import React, { useState, useEffect, useMemo } from 'react'
import { Plus, Minus, Bookmark, Link2, Check, ExternalLink, Moon } from 'lucide-react'
import { MosqueSkyline } from '../components/MosqueSkyline'
import {
  SURAHS,
  TOTAL_MUSHAF_PAGES,
  TOTAL_JUZ,
  JUZ_START_PAGES,
  getSurah,
  juzEndPage,
  juzOfPage,
  locateAyah,
  kemenagReaderUrl,
} from '../data/quranMeta'
import { computeKhatamPagesPerDay, type RamadanContext } from '../utils/ramadan'

interface QuranViewProps {
  dailyTarget: number
  pagesReadToday: number
  totalPagesRead: number
  last7Pages?: { iso: string; pages: number }[]
  hijriDateLabel?: string
  linkedAmalName?: string
  ramadan?: RamadanContext
  onChangePagesToday: (nextPages: number) => void
  onChangeDailyTarget?: (nextTarget: number) => void
  onAddToChecklist?: () => void
}

const TARGET_PRESETS = [4, 10, 20]
const LEGACY_LAST_READ_KEY = 'mizany_last_read_quran'
const LAST_READ_KEY = 'mizany_last_read_quran_v2'
const DAY_LABELS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

interface LastRead {
  surah: number
  ayah: number
}

const normalizeName = (value: string) => value.toLowerCase().replace(/[^a-z]/g, '')

/** Best-effort migration of the old free-text bookmark (e.g. "Al-Baqarah : 183"). */
function parseLegacyNote(note: string): LastRead | null {
  const normalized = normalizeName(note)
  if (!normalized) return null
  const match = [...SURAHS]
    .sort((a, b) => normalizeName(b.name).length - normalizeName(a.name).length)
    .find((s) => normalized.includes(normalizeName(s.name)))
  if (!match) return null
  const num = Number(note.match(/\d+/)?.[0] ?? 1)
  const ayah = Math.min(match.ayahCount, Math.max(1, num || 1))
  return { surah: match.number, ayah }
}

const clampInt = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Math.round(value)))

export const QuranView: React.FC<QuranViewProps> = ({
  dailyTarget,
  pagesReadToday,
  totalPagesRead,
  last7Pages,
  hijriDateLabel,
  linkedAmalName,
  ramadan,
  onChangePagesToday,
  onChangeDailyTarget,
  onAddToChecklist,
}) => {
  // ---------- Penanda terakhir dibaca ----------
  const [lastRead, setLastRead] = useState<LastRead | null>(null)
  const [ayahInput, setAyahInput] = useState('')
  const [legacyNote, setLegacyNote] = useState('')

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LAST_READ_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as LastRead
        const meta = getSurah(parsed?.surah)
        if (meta) {
          const ayah = clampInt(Number(parsed.ayah) || 1, 1, meta.ayahCount)
          setLastRead({ surah: meta.number, ayah })
          setAyahInput(String(ayah))
          return
        }
      }
      const legacy = localStorage.getItem(LEGACY_LAST_READ_KEY)
      if (legacy) {
        const migrated = parseLegacyNote(legacy)
        if (migrated) {
          setLastRead(migrated)
          setAyahInput(String(migrated.ayah))
          localStorage.setItem(LAST_READ_KEY, JSON.stringify(migrated))
        } else {
          setLegacyNote(legacy)
        }
      }
    } catch {}
  }, [])

  const persistLastRead = (next: LastRead) => {
    setLastRead(next)
    try {
      localStorage.setItem(LAST_READ_KEY, JSON.stringify(next))
    } catch {}
  }

  const handleSelectSurah = (value: string) => {
    const meta = getSurah(Number(value))
    if (!meta) return
    persistLastRead({ surah: meta.number, ayah: 1 })
    setAyahInput('1')
  }

  const handleAyahChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 3)
    setAyahInput(digits)
    const meta = lastRead ? getSurah(lastRead.surah) : undefined
    const num = Number(digits)
    if (meta && num >= 1 && num <= meta.ayahCount) {
      persistLastRead({ surah: meta.number, ayah: num })
    }
  }

  const handleAyahBlur = () => {
    if (!lastRead) return
    const meta = getSurah(lastRead.surah)
    if (!meta) return
    const ayah = clampInt(Number(ayahInput) || lastRead.ayah, 1, meta.ayahCount)
    setAyahInput(String(ayah))
    if (ayah !== lastRead.ayah) persistLastRead({ surah: meta.number, ayah })
  }

  const lastReadMeta = lastRead ? getSurah(lastRead.surah) : undefined
  const lastReadLocation = lastRead ? locateAyah(lastRead.surah, lastRead.ayah) : null

  // ---------- Khatam progress (real Juz boundaries) ----------
  const khatamCycle = Math.floor(totalPagesRead / TOTAL_MUSHAF_PAGES) + 1
  const pagesInCurrentCycle = totalPagesRead % TOTAL_MUSHAF_PAGES
  const displayPages =
    totalPagesRead > 0 && pagesInCurrentCycle === 0 ? TOTAL_MUSHAF_PAGES : pagesInCurrentCycle
  const cycleComplete = displayPages >= TOTAL_MUSHAF_PAGES
  const currentJuz = cycleComplete ? TOTAL_JUZ : juzOfPage(displayPages + 1)
  const currentJuzStart = JUZ_START_PAGES[currentJuz - 1]
  const currentJuzEnd = juzEndPage(currentJuz)
  const currentJuzLength = currentJuzEnd - currentJuzStart + 1
  const pagesIntoCurrentJuz = Math.max(0, displayPages - currentJuzStart + 1)
  const pagesLeftInJuz = Math.max(0, currentJuzEnd - displayPages)
  const completedJuz = cycleComplete
    ? TOTAL_JUZ
    : Number((currentJuz - 1 + pagesIntoCurrentJuz / currentJuzLength).toFixed(1))
  const khatamPercent = Math.min(100, Math.round((displayPages / TOTAL_MUSHAF_PAGES) * 100))
  const pagesToKhatam = TOTAL_MUSHAF_PAGES - displayPages
  const daysToKhatam = dailyTarget > 0 ? Math.ceil(pagesToKhatam / dailyTarget) : null

  const juzSegments = useMemo(
    () =>
      Array.from({ length: TOTAL_JUZ }, (_, i) => {
        const start = JUZ_START_PAGES[i]
        const end = juzEndPage(i + 1)
        const fill = (Math.min(end, displayPages) - (start - 1)) / (end - start + 1)
        return Math.max(0, Math.min(1, fill))
      }),
    [displayPages]
  )

  // ---------- Tilawah hari ini ----------
  const todayPercent =
    dailyTarget > 0 ? Math.min(100, Math.round((pagesReadToday / dailyTarget) * 100)) : 0
  const reachedTargetToday = pagesReadToday >= dailyTarget
  const perPrayer = dailyTarget >= 5 ? Math.ceil(dailyTarget / 5) : null

  const [editingPages, setEditingPages] = useState(false)
  const [pagesDraft, setPagesDraft] = useState('')

  const startEditPages = () => {
    setPagesDraft(String(pagesReadToday))
    setEditingPages(true)
  }

  const commitPages = () => {
    const num = Number(pagesDraft)
    if (pagesDraft !== '' && Number.isFinite(num)) {
      onChangePagesToday(clampInt(num, 0, TOTAL_MUSHAF_PAGES))
    }
    setEditingPages(false)
  }

  const isCustomTarget = !TARGET_PRESETS.includes(dailyTarget)
  const [editingTarget, setEditingTarget] = useState(false)
  const [targetDraft, setTargetDraft] = useState('')

  const commitTarget = () => {
    const num = Number(targetDraft)
    if (onChangeDailyTarget && targetDraft !== '' && num >= 1) {
      onChangeDailyTarget(clampInt(num, 1, TOTAL_MUSHAF_PAGES))
    }
    setEditingTarget(false)
  }

  // ---------- 7 hari terakhir ----------
  const weekTotal = (last7Pages ?? []).reduce((sum, d) => sum + d.pages, 0)
  const weekMax = Math.max(dailyTarget, ...(last7Pages ?? []).map((d) => d.pages), 1)

  return (
    <div className="space-y-4 pb-28">
      {/* Page Title */}
      <div className="flex items-baseline justify-between gap-2 px-0.5">
        <div>
          <h1 className="text-xl font-extrabold text-[#101828] tracking-tight">
            Qur&apos;an &amp; Tilawah
          </h1>
          <p className="text-xs text-[#475467] mt-0.5">
            Pantau bacaan harian dan progres khatam
          </p>
        </div>
        {hijriDateLabel && (
          <span className="text-xs font-semibold text-[#0F50BD] shrink-0">{hijriDateLabel}</span>
        )}
      </div>

      {/* Rich Tazkirah Blue Khatam Progress Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0F50BD] to-[#1941B5] text-white p-5 rounded-[22px] shadow-[0_8px_24px_rgba(25,65,181,0.2)]">
        <div className="absolute inset-x-0 bottom-0 pointer-events-none opacity-20">
          <MosqueSkyline className="w-full h-auto max-h-[84px]" />
        </div>

        <div className="relative z-10">
          <div className="flex items-baseline justify-between gap-2">
            <div className="text-3xl font-extrabold text-white tabular-nums tracking-tight">
              {completedJuz}{' '}
              <span className="text-base font-semibold text-[#DBEAFE]">/ 30 Juz</span>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-white/18 border border-white/25 text-white text-xs font-bold tabular-nums">
              {khatamCycle > 1 ? `Khatam ke-${khatamCycle} · ` : ''}
              {khatamPercent}%
            </span>
          </div>

          <p className="text-xs text-[#DBEAFE] font-medium mt-1 tabular-nums">
            {displayPages} dari {TOTAL_MUSHAF_PAGES} halaman Mushaf
          </p>

          {/* 30-segment Juz map */}
          <div
            className="grid grid-cols-[repeat(30,minmax(0,1fr))] gap-[3px] mt-3.5"
            role="img"
            aria-label={`Peta Juz: ${Math.floor(completedJuz)} Juz selesai dari 30`}
          >
            {juzSegments.map((fill, i) => (
              <div key={i} className="h-2.5 rounded-[3px] bg-white/20 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#5EEAD4] to-[#14B8A6] transition-all duration-300"
                  style={{ width: `${fill * 100}%` }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[11px] font-semibold text-[#DBEAFE] mt-1.5 tabular-nums">
            <span>Juz 1</span>
            <span>Juz 15</span>
            <span>Juz 30</span>
          </div>

          {/* Position & khatam estimate */}
          <div className="grid grid-cols-2 gap-2.5 mt-3.5">
            <div className="rounded-2xl bg-white/12 border border-white/15 px-3 py-2.5">
              <div className="text-[11px] font-semibold text-[#DBEAFE]">Posisi sekarang</div>
              <div className="text-sm font-bold text-white mt-0.5 tabular-nums">
                {cycleComplete ? 'Khatam!' : `Juz ${currentJuz}`}
              </div>
              <div className="text-[11px] font-medium text-[#DBEAFE] mt-0.5 tabular-nums">
                {cycleComplete
                  ? 'Alhamdulillah, lanjut putaran baru'
                  : currentJuz < TOTAL_JUZ
                    ? `${pagesLeftInJuz} hal lagi ke Juz ${currentJuz + 1}`
                    : `${pagesLeftInJuz} hal lagi menuju khatam`}
              </div>
            </div>
            <div className="rounded-2xl bg-white/12 border border-white/15 px-3 py-2.5">
              <div className="text-[11px] font-semibold text-[#DBEAFE]">Perkiraan khatam</div>
              <div className="text-sm font-bold text-white mt-0.5 tabular-nums">
                {cycleComplete ? 'Selesai' : daysToKhatam !== null ? `± ${daysToKhatam} hari lagi` : '–'}
              </div>
              <div className="text-[11px] font-medium text-[#DBEAFE] mt-0.5 tabular-nums">
                {cycleComplete ? `${TOTAL_MUSHAF_PAGES} halaman tuntas` : `dengan ${dailyTarget} hal/hari`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Tilawah Stepper */}
      <div className="glass-card p-5">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-base font-bold text-[#101828]">Tilawah Hari Ini</h2>
          <span className="text-xs font-semibold text-[#475467] tabular-nums">
            Target <span className="text-[#0F50BD] font-bold">{dailyTarget} hal</span> ({todayPercent}%)
          </span>
        </div>

        <div
          className="w-full h-2 rounded-full bg-[#EEF2F6] overflow-hidden mt-3"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={todayPercent}
          aria-label="Progres target tilawah hari ini"
        >
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              reachedTargetToday
                ? 'bg-gradient-to-r from-[#2DD4BF] to-[#0F766E]'
                : 'bg-gradient-to-r from-[#3B82F6] to-[#0F50BD]'
            }`}
            style={{ width: `${todayPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-center gap-6 pt-5 pb-3">
          <button
            type="button"
            onClick={() => onChangePagesToday(Math.max(0, pagesReadToday - 1))}
            disabled={pagesReadToday <= 0}
            className="w-12 h-12 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-center text-[#334155] hover:bg-[#EEF2F6] disabled:opacity-35 active:scale-95 transition-all cursor-pointer"
            aria-label="Kurangi 1 halaman"
          >
            <Minus size={20} strokeWidth={2.5} />
          </button>

          <div className="text-center min-w-[110px]">
            {editingPages ? (
              <input
                type="text"
                inputMode="numeric"
                autoFocus
                value={pagesDraft}
                onChange={(e) => setPagesDraft(e.target.value.replace(/\D/g, '').slice(0, 3))}
                onBlur={commitPages}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitPages()
                  if (e.key === 'Escape') setEditingPages(false)
                }}
                aria-label="Jumlah halaman dibaca hari ini"
                className="w-[96px] text-4xl font-extrabold text-[#0F50BD] tabular-nums leading-none text-center bg-[#EFF6FF] rounded-xl py-1 border border-[#BFDBFE] focus:outline-none focus:ring-2 focus:ring-[#0F50BD]/30"
              />
            ) : (
              <button
                type="button"
                onClick={startEditPages}
                className="text-4xl font-extrabold text-[#0F50BD] tabular-nums leading-none px-3 py-1 rounded-xl hover:bg-[#EFF6FF] cursor-text transition-colors"
                aria-label={`${pagesReadToday} halaman selesai. Ketuk untuk mengetik jumlah halaman`}
              >
                {pagesReadToday}
              </button>
            )}
            <div className="text-xs font-medium text-[#475467] mt-1.5">
              {editingPages ? 'ketik lalu Enter' : 'halaman selesai'}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onChangePagesToday(pagesReadToday + 1)}
            className="w-12 h-12 rounded-2xl bg-[#0F50BD] text-white shadow-[0_4px_12px_rgba(15,80,189,0.28)] flex items-center justify-center hover:bg-[#1941B5] active:scale-95 transition-all cursor-pointer"
            aria-label="Tambah 1 halaman"
          >
            <Plus size={20} strokeWidth={2.5} />
          </button>
        </div>

        <p
          className={`text-center text-xs font-medium pb-4 ${
            reachedTargetToday ? 'text-[#0F766E]' : 'text-[#475467]'
          }`}
        >
          {reachedTargetToday
            ? 'Alhamdulillah, target hari ini tercapai'
            : perPrayer
              ? `Tips: cukup ± ${perPrayer} hal tiap selesai sholat fardhu`
              : `Kurang ${dailyTarget - pagesReadToday} hal lagi`}
        </p>

        {/* Quick increment & safe target button */}
        <div className="grid grid-cols-3 gap-2 pt-3.5 border-t border-[#EEF2F6]">
          <button
            type="button"
            onClick={() => onChangePagesToday(pagesReadToday + 2)}
            className="min-h-[40px] py-2 rounded-xl bg-[#F1F5F9] text-xs font-bold text-[#334155] hover:bg-[#E2E8F0] cursor-pointer transition-colors"
          >
            +2 Hal
          </button>
          <button
            type="button"
            onClick={() => onChangePagesToday(pagesReadToday + 4)}
            className="min-h-[40px] py-2 rounded-xl bg-[#F1F5F9] text-xs font-bold text-[#334155] hover:bg-[#E2E8F0] cursor-pointer transition-colors"
          >
            +4 Hal
          </button>
          <button
            type="button"
            onClick={() => onChangePagesToday(Math.max(pagesReadToday, dailyTarget))}
            disabled={reachedTargetToday}
            className={`min-h-[40px] py-2 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1 transition-colors cursor-pointer ${
              reachedTargetToday
                ? 'bg-[#ECFDF5] text-[#0F766E] cursor-default'
                : 'bg-[#EFF6FF] text-[#0F50BD] hover:bg-[#DBEAFE]'
            }`}
          >
            {reachedTargetToday && <Check size={14} strokeWidth={2.8} aria-hidden="true" />}
            <span>{reachedTargetToday ? 'Tercapai' : 'Capai Target'}</span>
          </button>
        </div>

        {/* Inline daily target selector */}
        {onChangeDailyTarget && (
          <div className="mt-3.5 pt-3.5 border-t border-[#EEF2F6] flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#475467] shrink-0">Target harian</span>
            <div className="flex items-center gap-1.5">
              {TARGET_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onChangeDailyTarget(preset)}
                  aria-pressed={dailyTarget === preset}
                  className={`min-h-[32px] px-2.5 py-1 rounded-lg text-xs font-bold tabular-nums whitespace-nowrap cursor-pointer transition-colors ${
                    dailyTarget === preset
                      ? 'bg-[#0F50BD] text-white'
                      : 'bg-[#F1F5F9] text-[#334155] hover:bg-[#E2E8F0]'
                  }`}
                >
                  {preset} hal
                </button>
              ))}
              {editingTarget ? (
                <input
                  type="text"
                  inputMode="numeric"
                  autoFocus
                  value={targetDraft}
                  onChange={(e) => setTargetDraft(e.target.value.replace(/\D/g, '').slice(0, 3))}
                  onBlur={commitTarget}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitTarget()
                    if (e.key === 'Escape') setEditingTarget(false)
                  }}
                  placeholder="hal"
                  aria-label="Target harian khusus (halaman)"
                  className="w-[56px] min-h-[32px] px-2 py-1 rounded-lg text-xs font-bold tabular-nums text-center text-[#0F50BD] bg-[#EFF6FF] border border-[#BFDBFE] focus:outline-none focus:ring-2 focus:ring-[#0F50BD]/30"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setTargetDraft(isCustomTarget ? String(dailyTarget) : '')
                    setEditingTarget(true)
                  }}
                  aria-pressed={isCustomTarget}
                  aria-label="Atur target harian sendiri"
                  className={`min-h-[32px] px-2.5 py-1 rounded-lg text-xs font-bold tabular-nums whitespace-nowrap cursor-pointer transition-colors ${
                    isCustomTarget
                      ? 'bg-[#0F50BD] text-white'
                      : 'bg-[#F1F5F9] text-[#334155] hover:bg-[#E2E8F0]'
                  }`}
                >
                  {isCustomTarget ? `${dailyTarget} hal` : 'Lain'}
                </button>
              )}
            </div>
          </div>
        )}
        {/* Ramadan 30-day Khatam Pace Calculator */}
        {ramadan?.isActive && onChangeDailyTarget && (
          <div className="mt-3.5 pt-3.5 border-t border-[#EEF2F6] space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F50BD]">
                <Moon size={13} aria-hidden="true" />
                <span>Target Khatam Ramadan</span>
              </div>
              <span className="text-[11px] font-semibold text-[#475467] tabular-nums">
                Sisa {ramadan.daysRemaining} hari
              </span>
            </div>

            {(() => {
              const remainingForKhatam = cycleComplete ? TOTAL_MUSHAF_PAGES : pagesToKhatam
              const chaseTarget = computeKhatamPagesPerDay(remainingForKhatam, ramadan.daysRemaining)
              const ramadanPlans = [
                {
                  key: 'chase',
                  label: 'Sesuai sisa hari',
                  pages: chaseTarget,
                },
                {
                  key: '1x',
                  label: '1× Khatam',
                  pages: 20,
                },
                {
                  key: '2x',
                  label: '2× Khatam',
                  pages: 40,
                },
              ]
              return (
                <div className="grid grid-cols-3 gap-1.5">
                  {ramadanPlans.map((plan) => {
                    const active = dailyTarget === plan.pages
                    return (
                      <button
                        key={plan.key}
                        type="button"
                        onClick={() => onChangeDailyTarget(plan.pages)}
                        aria-pressed={active}
                        className={`min-h-[48px] px-2 py-2 rounded-xl border text-center flex flex-col items-center justify-center transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#0F50BD] border-[#0F50BD] text-white'
                            : 'bg-[#F5F9FF] border-[#DBEAFE] text-[#101828] hover:bg-[#EFF6FF]'
                        }`}
                      >
                        <span className="text-[11px] font-semibold leading-tight">{plan.label}</span>
                        <span
                          className={`text-xs font-extrabold tabular-nums mt-0.5 ${
                            active ? 'text-[#5EEAD4]' : 'text-[#0F50BD]'
                          }`}
                        >
                          {plan.pages} hal/hr
                        </span>
                      </button>
                    )
                  })}
                </div>
              )
            })()}
          </div>
        )}
      </div>

      {/* Penanda Terakhir Dibaca */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#0F50BD] flex items-center justify-center shrink-0">
            <Bookmark size={20} aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-[#101828]">Terakhir Dibaca</h2>
            <p className="text-xs text-[#475467] mt-0.5 truncate">
              {lastReadMeta
                ? `${lastReadMeta.meaning} · ${lastReadMeta.ayahCount} ayat · ${lastReadMeta.place}`
                : 'Tandai surat & ayat terakhir yang kamu baca'}
            </p>
          </div>
          {lastReadLocation && (
            <span className="px-2.5 py-1 rounded-full bg-[#EFF6FF] text-[#0F50BD] text-[11px] font-bold tabular-nums shrink-0">
              Hal. {lastReadLocation.page} · Juz {lastReadLocation.juz}
            </span>
          )}
        </div>

        <div className="flex items-end gap-2.5 mt-4">
          <div className="flex-1 min-w-0">
            <label htmlFor="last-read-surah" className="text-[11px] font-semibold text-[#475467] block mb-1">
              Surat
            </label>
            <select
              id="last-read-surah"
              value={lastRead?.surah ?? ''}
              onChange={(e) => handleSelectSurah(e.target.value)}
              className="w-full min-h-[44px] px-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-sm font-bold text-[#101828] focus:outline-none focus:border-[#0F50BD] focus:ring-2 focus:ring-[#0F50BD]/20 cursor-pointer"
            >
              <option value="" disabled>
                Pilih surat…
              </option>
              {SURAHS.map((s) => (
                <option key={s.number} value={s.number}>
                  {s.number}. {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="w-[84px] shrink-0">
            <label htmlFor="last-read-ayah" className="text-[11px] font-semibold text-[#475467] block mb-1">
              Ayat
            </label>
            <input
              id="last-read-ayah"
              type="text"
              inputMode="numeric"
              value={ayahInput}
              onChange={(e) => handleAyahChange(e.target.value)}
              onBlur={handleAyahBlur}
              disabled={!lastRead}
              placeholder="–"
              aria-describedby="last-read-ayah-range"
              className="w-full min-h-[44px] px-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-sm font-bold text-[#101828] text-center tabular-nums focus:outline-none focus:border-[#0F50BD] focus:ring-2 focus:ring-[#0F50BD]/20 disabled:opacity-50"
            />
          </div>
        </div>
        <p id="last-read-ayah-range" className="text-[11px] text-[#475467] mt-1.5 text-right tabular-nums">
          {lastReadMeta ? `Ayat 1–${lastReadMeta.ayahCount}` : ''}
        </p>

        {legacyNote && !lastRead && (
          <p className="text-xs text-[#475467] mt-1">
            Catatan lama: <span className="font-semibold text-[#334155]">{legacyNote}</span>
          </p>
        )}

        {lastRead ? (
          <a
            href={kemenagReaderUrl(lastRead.surah, lastRead.ayah)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 w-full min-h-[46px] rounded-2xl bg-[#0F50BD] text-white text-sm font-bold inline-flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(15,80,189,0.28)] hover:bg-[#1941B5] active:scale-[0.98] transition-all"
          >
            Lanjut Baca · {lastReadMeta?.name} {lastRead.ayah}
            <ExternalLink size={16} strokeWidth={2.4} aria-hidden="true" />
            <span className="sr-only">(membuka Qur&apos;an Kemenag di tab baru)</span>
          </a>
        ) : (
          <a
            href="https://quran.kemenag.go.id/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 w-full min-h-[46px] rounded-2xl bg-[#EFF6FF] text-[#0F50BD] text-sm font-bold inline-flex items-center justify-center gap-2 hover:bg-[#DBEAFE] transition-colors"
          >
            Buka Qur&apos;an Kemenag
            <ExternalLink size={16} strokeWidth={2.4} aria-hidden="true" />
            <span className="sr-only">(tab baru)</span>
          </a>
        )}
        <p className="text-[11px] text-[#475467] text-center mt-2">
          Bacaan dibuka di Qur&apos;an Kemenag, mushaf resmi Kementerian Agama RI
        </p>
      </div>

      {/* 7 hari terakhir + checklist link status */}
      {last7Pages && last7Pages.length > 0 && (
        <div className="glass-card p-5">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-base font-bold text-[#101828]">7 Hari Terakhir</h2>
            <span className="text-xs font-semibold text-[#475467] tabular-nums">
              Total <span className="text-[#0F50BD] font-bold">{weekTotal} hal</span>
            </span>
          </div>

          <div className="grid grid-cols-7 gap-2 mt-4" role="list" aria-label="Halaman dibaca 7 hari terakhir">
            {last7Pages.map((day, i) => {
              const isToday = i === last7Pages.length - 1
              const reached = day.pages >= dailyTarget && day.pages > 0
              const height = day.pages > 0 ? Math.max(10, Math.round((day.pages / weekMax) * 100)) : 0
              const [y, m, d] = day.iso.split('-').map(Number)
              const label = DAY_LABELS[new Date(y, m - 1, d).getDay()]
              return (
                <div
                  key={day.iso}
                  role="listitem"
                  aria-label={`${isToday ? 'Hari ini' : label}: ${day.pages} halaman`}
                  className="flex flex-col items-center gap-1.5"
                >
                  <span
                    className={`text-[11px] font-bold tabular-nums ${
                      day.pages > 0 ? 'text-[#334155]' : 'text-[#667085]'
                    }`}
                    aria-hidden="true"
                  >
                    {day.pages}
                  </span>
                  <div className="w-full h-16 rounded-lg bg-[#F1F5F9] flex items-end overflow-hidden" aria-hidden="true">
                    <div
                      className={`w-full rounded-lg transition-all duration-300 ${
                        reached
                          ? 'bg-gradient-to-t from-[#0F766E] to-[#2DD4BF]'
                          : 'bg-gradient-to-t from-[#0F50BD] to-[#60A5FA]'
                      }`}
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <span
                    className={`text-[11px] font-semibold ${
                      isToday ? 'text-[#0F50BD] font-bold' : 'text-[#475467]'
                    }`}
                    aria-hidden="true"
                  >
                    {isToday ? 'Ini' : label}
                  </span>
                </div>
              )
            })}
          </div>

          <div className="mt-4 pt-3.5 border-t border-[#EEF2F6]">
            {linkedAmalName ? (
              <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-[#0F766E]">
                <Link2 size={14} className="shrink-0" aria-hidden="true" />
                <span>
                  Tercatat otomatis ke checklist: <b>{linkedAmalName}</b>
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-[#475467] leading-relaxed">
                  Bacaan otomatis masuk progres khatam &amp; streak. Tampilkan juga di Checklist Beranda?
                </p>
                {onAddToChecklist && (
                  <button
                    type="button"
                    onClick={onAddToChecklist}
                    className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#EFF6FF] text-[#0F50BD] text-xs font-bold hover:bg-[#DBEAFE] shrink-0 cursor-pointer transition-colors"
                  >
                    + Checklist
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
