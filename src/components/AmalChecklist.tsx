import React, { useState } from 'react'
import { AmalItem, MandatoryPrayerKey } from '../types'
import {
  diffIsoDays,
  formatChecklistDateTitle,
  shiftIsoDate,
} from '../utils/recapStats'
import {
  Check,
  Plus,
  Minus,
  Sun,
  Moon,
  BookOpen,
  Gift,
  Utensils,
  Heart,
  Lock,
  ChevronLeft,
  ChevronRight,
  History,
  CircleDot,
  Star,
} from 'lucide-react'

import type { RamadanAmalSuggestion, RamadanContext } from '../utils/ramadan'

interface AmalChecklistProps {
  items: AmalItem[]
  selectedDateIso: string
  todayIso: string
  ramadan?: RamadanContext
  ramadanSuggestions?: RamadanAmalSuggestion[]
  onQuickAddRamadanAmal?: (suggestion: RamadanAmalSuggestion) => void
  onChangeDate: (nextIso: string) => void
  onTogglePrayer: (prayer: MandatoryPrayerKey) => void
  onToggleCheck: (id: string) => void
  onIncrementCounter: (id: string, delta: number) => void
  onUpdateValue: (id: string, value: number) => void
  onOpenAddAmal: () => void
}

const MAX_BACKFILL_DAYS = 30

const MANDATORY_PRAYERS: { key: MandatoryPrayerKey; label: string }[] = [
  { key: 'subuh', label: 'Subuh' },
  { key: 'dzuhur', label: 'Dzuhur' },
  { key: 'ashar', label: 'Ashar' },
  { key: 'maghrib', label: 'Maghrib' },
  { key: 'isya', label: 'Isya' },
]

function PrayerDomeIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-[#0F50BD]"
      aria-hidden="true"
    >
      <path d="M12 3c-3.5 2.5-6 5.2-6 8.5V19h12v-7.5C18 8.2 15.5 5.5 12 3Z" />
      <path d="M4 19h16" />
      <path d="M10 19v-3a2 2 0 0 1 4 0v3" />
    </svg>
  )
}

function getTargetStepChips(target: number, unit?: string): number[] {
  const u = (unit || '').toLowerCase()
  if (u.includes('rakaat')) {
    const steps = [2, 4].filter((s) => s < target)
    return steps.length > 0 ? steps : [1]
  }
  if (target <= 5) return [1]
  if (target <= 15) return [1, 2, 5].filter((s) => s < target)
  if (target <= 50) return [1, 5, 10].filter((s) => s < target)
  if (target <= 200) return [10, 25, 50].filter((s) => s < target)
  return [10, 50, 100].filter((s) => s < target)
}

function isItemComplete(item: AmalItem): boolean {
  if (item.type === 'prayers') {
    const checks = item.prayerChecks
    if (!checks) return false
    return MANDATORY_PRAYERS.every((p) => checks[p.key])
  }
  if (item.type === 'checklist') return Boolean(item.done)
  if (item.type === 'target') return (item.value || 0) >= (item.target || 1)
  if (item.type === 'counter' || item.type === 'amount') return (item.value || 0) > 0
  return false
}

function getItemFraction(item: AmalItem): number {
  if (item.type === 'prayers') {
    const checks = item.prayerChecks
    if (!checks) return 0
    const count = MANDATORY_PRAYERS.filter((p) => checks[p.key]).length
    return count / MANDATORY_PRAYERS.length
  }
  if (item.type === 'target') {
    const target = item.target || 1
    return Math.min(1, (item.value || 0) / target)
  }
  return isItemComplete(item) ? 1 : 0
}

export const AmalChecklist: React.FC<AmalChecklistProps> = ({
  items,
  selectedDateIso,
  todayIso,
  ramadan,
  ramadanSuggestions,
  onQuickAddRamadanAmal,
  onChangeDate,
  onTogglePrayer,
  onToggleCheck,
  onIncrementCounter,
  onUpdateValue,
  onOpenAddAmal,
}) => {
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null)

  const totalCount = items.length
  const progressPercent =
    totalCount > 0
      ? Math.round((items.reduce((sum, item) => sum + getItemFraction(item), 0) / totalCount) * 100)
      : 0

  const prayerItem = items.find((i) => i.type === 'prayers')
  const prayersDone = prayerItem?.prayerChecks
    ? MANDATORY_PRAYERS.filter((p) => prayerItem.prayerChecks?.[p.key]).length
    : 0

  const headerStatusText =
    totalCount === 1 && prayerItem
      ? `${prayersDone}/5 sholat`
      : `${progressPercent}% tercapai`

  const dateMeta = formatChecklistDateTitle(selectedDateIso, todayIso)
  const daysBack = diffIsoDays(selectedDateIso, todayIso)
  const canGoBack = daysBack < MAX_BACKFILL_DAYS
  const canGoForward = daysBack > 0

  const handleShiftDay = (delta: number) => {
    const nextIso = shiftIsoDate(selectedDateIso, delta)
    if (nextIso > todayIso) return
    if (diffIsoDays(nextIso, todayIso) > MAX_BACKFILL_DAYS) return
    setExpandedItemId(null)
    onChangeDate(nextIso)
  }

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'dome':
        return <PrayerDomeIcon />
      case 'sun':
        return <Sun size={18} className="text-[#B45309]" aria-hidden="true" />
      case 'moon':
        return <Moon size={18} className="text-[#0F50BD]" aria-hidden="true" />
      case 'star':
        return <Star size={18} className="text-[#B45309]" aria-hidden="true" />
      case 'book':
        return <BookOpen size={18} className="text-[#0F50BD]" aria-hidden="true" />
      case 'gift':
        return <Gift size={18} className="text-[#0F766E]" aria-hidden="true" />
      case 'bowl':
        return <Utensils size={18} className="text-[#B45309]" aria-hidden="true" />
      case 'beads':
        return <CircleDot size={18} className="text-[#0F50BD]" aria-hidden="true" />
      default:
        return <Heart size={18} className="text-[#0F50BD]" aria-hidden="true" />
    }
  }

  return (
    <section id="checklist-section" className="glass-card overflow-hidden">
      {/* Header with compact date switcher & honest progress */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="inline-flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => handleShiftDay(-1)}
                disabled={!canGoBack}
                className="w-9 h-9 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] disabled:opacity-30 flex items-center justify-center text-[#101828] cursor-pointer active:scale-95 transition-colors"
                aria-label="Lihat hari sebelumnya"
                title="Hari sebelumnya"
              >
                <ChevronLeft size={16} strokeWidth={2.4} />
              </button>
              <button
                type="button"
                onClick={() => handleShiftDay(1)}
                disabled={!canGoForward}
                className="w-9 h-9 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] disabled:opacity-30 flex items-center justify-center text-[#101828] cursor-pointer active:scale-95 transition-colors"
                aria-label="Lihat hari berikutnya"
                title="Hari berikutnya"
              >
                <ChevronRight size={16} strokeWidth={2.4} />
              </button>
            </div>
            <h2 className="text-[15px] font-bold text-[#101828] truncate ml-0.5">
              {dateMeta.title}
            </h2>
          </div>

          <span className="text-xs font-bold text-[#0F50BD] shrink-0 tabular-nums">
            {headerStatusText}
          </span>
        </div>

        {/* Plush Gradient Progress Bar */}
        <div className="w-full h-2 rounded-full bg-[#EEF2F6] overflow-hidden mt-3">
          <div
            className="h-full bg-gradient-to-r from-[#0F50BD] to-[#14B8A6] rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Calm indicator strip when editing a past date */}
        {dateMeta.isPast && (
          <div className="mt-3 px-3 py-2 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#92400E] min-w-0">
              <History size={14} className="shrink-0 text-[#B45309]" aria-hidden="true" />
              <span className="truncate">
                Koreksi riwayat · <b>{dateMeta.subtitle}</b>
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setExpandedItemId(null)
                onChangeDate(todayIso)
              }}
              className="px-3 py-1.5 rounded-full bg-[#0F50BD] text-white text-[11px] font-bold hover:bg-[#1941B5] cursor-pointer shrink-0 transition-colors"
            >
              Ke Hari Ini
            </button>
          </div>
        )}
      </div>

      {/* Flat divider-separated list of deeds (zero nested cards) */}
      <div className="divide-y divide-[#EEF2F6] border-t border-[#EEF2F6]">
        {items.map((item) => {
          const isDone = isItemComplete(item)

          // Mandatory 5-Prayer Row (Flat inside card, no outer bordered box)
          if (item.type === 'prayers') {
            const checks = item.prayerChecks || {
              subuh: false,
              dzuhur: false,
              ashar: false,
              maghrib: false,
              isya: false,
            }
            const prayersDoneCount = MANDATORY_PRAYERS.filter((p) => checks[p.key]).length

            return (
              <div
                key={item.id}
                className={`px-4 py-4 transition-colors ${isDone ? 'bg-[#F5F9FF]' : 'bg-white'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center shrink-0">
                    {renderIcon(item.icon)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[14.5px] font-bold leading-tight ${
                          isDone ? 'text-[#0F50BD]' : 'text-[#101828]'
                        }`}
                      >
                        {item.name}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded-md bg-[#EFF6FF] text-[#0F50BD]">
                        <Lock size={10} aria-hidden="true" />
                        Wajib
                      </span>
                    </div>
                    {item.note && (
                      <p className="text-xs text-[#475467] truncate mt-0.5">{item.note}</p>
                    )}
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 tabular-nums ${
                      isDone
                        ? 'bg-[#0F50BD] text-white'
                        : 'bg-[#F1F5F9] text-[#475467]'
                    }`}
                  >
                    {prayersDoneCount}/5
                  </span>
                </div>

                {/* 5 individual prayer toggle buttons (>= 11px text, plush active shadow) */}
                <div className="grid grid-cols-5 gap-1.5 mt-3.5">
                  {MANDATORY_PRAYERS.map((p) => {
                    const checked = Boolean(checks[p.key])
                    return (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => onTogglePrayer(p.key)}
                        aria-pressed={checked}
                        className={`min-h-[54px] py-2 px-1 rounded-xl border text-center flex flex-col items-center justify-center gap-1.5 transition-all duration-150 cursor-pointer active:scale-95 ${
                          checked
                            ? 'bg-[#0F50BD] border-[#0F50BD] text-white shadow-[0_3px_10px_rgba(15,80,189,0.28)]'
                            : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#334155] hover:border-[#0F50BD]/40 hover:text-[#101828]'
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded-full flex items-center justify-center ${
                            checked
                              ? 'bg-white/25 text-white'
                              : 'border border-[#CBD5E1] bg-white'
                          }`}
                        >
                          {checked && <Check size={11} strokeWidth={3.2} />}
                        </span>
                        <span className="text-[11px] font-bold leading-none">{p.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          }

          const targetVal = item.target || 1
          const currentVal = item.value || 0
          const isTargetExpanded =
            item.type === 'target' && expandedItemId === item.id && targetVal > 1
          const isAmountExpanded = item.type === 'amount' && expandedItemId === item.id
          const showTargetMiniBar =
            item.type === 'target' && targetVal > 1 && currentVal > 0 && !isDone

          return (
            <div
              key={item.id}
              className={`px-4 py-3.5 transition-colors ${isDone ? 'bg-[#F5F9FF]' : 'bg-white'}`}
            >
              <div className="flex items-center gap-3">
                {/* Icon */}
                <div className="w-9 h-9 rounded-xl bg-[#F1F5F9] flex items-center justify-center shrink-0">
                  {renderIcon(item.icon)}
                </div>

                {/* Title & Notes */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-sm font-bold leading-tight truncate ${
                        isDone ? 'text-[#0F50BD]' : 'text-[#101828]'
                      }`}
                    >
                      {item.name}
                    </span>
                    {item.isLocked && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded-md bg-[#EFF6FF] text-[#0F50BD] shrink-0">
                        <Lock size={10} aria-hidden="true" />
                        Wajib
                      </span>
                    )}
                  </div>
                  {item.note && (
                    <p className="text-xs text-[#475467] truncate mt-0.5">{item.note}</p>
                  )}
                </div>

                {/* Control based on type */}
                {item.type === 'checklist' && (
                  <button
                    type="button"
                    onClick={() => onToggleCheck(item.id)}
                    aria-pressed={Boolean(item.done)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-95 ${
                      item.done
                        ? 'bg-[#0F50BD] text-white'
                        : 'border-2 border-[#CBD5E1] bg-white hover:border-[#0F50BD]'
                    }`}
                    aria-label={`Centang ${item.name}`}
                  >
                    {item.done && <Check size={18} strokeWidth={3} />}
                  </button>
                )}

                {item.type === 'counter' && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onIncrementCounter(item.id, -1)}
                      disabled={currentVal <= 0}
                      className="w-9 h-9 rounded-xl border border-[#E2E8F0] bg-white flex items-center justify-center text-[#475467] hover:bg-[#F8FAFC] disabled:opacity-35 cursor-pointer"
                      aria-label={`Kurangi ${item.name}`}
                    >
                      <Minus size={15} strokeWidth={2.5} />
                    </button>
                    <span className="text-xs font-bold min-w-[34px] text-center text-[#101828] tabular-nums">
                      {currentVal}
                      {item.unit ? (
                        <span className="text-[11px] text-[#475467] font-medium ml-0.5">
                          {item.unit}
                        </span>
                      ) : null}
                    </span>
                    <button
                      type="button"
                      onClick={() => onIncrementCounter(item.id, 1)}
                      className="w-9 h-9 rounded-xl bg-[#0F50BD] text-white flex items-center justify-center hover:bg-[#1941B5] cursor-pointer"
                      aria-label={`Tambah ${item.name}`}
                    >
                      <Plus size={15} strokeWidth={2.5} />
                    </button>
                  </div>
                )}

                {item.type === 'target' && (
                  <div className="flex items-center gap-2 shrink-0">
                    {targetVal > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedItemId((prev) => (prev === item.id ? null : item.id))
                        }
                        aria-expanded={isTargetExpanded}
                        aria-label={`Isi progres ${item.name} (${currentVal} dari ${targetVal})`}
                        className={`min-h-[36px] px-2.5 py-1 rounded-xl border text-xs font-bold tabular-nums transition-colors cursor-pointer ${
                          isTargetExpanded
                            ? 'bg-[#EFF6FF] border-[#0F50BD] text-[#0F50BD]'
                            : isDone
                            ? 'bg-white border-[#BFDBFE] text-[#0F50BD]'
                            : currentVal > 0
                            ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#0F50BD]'
                            : 'bg-white border-[#CBD5E1] text-[#334155] hover:border-[#0F50BD]/50'
                        }`}
                      >
                        {currentVal}/{targetVal}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        onUpdateValue(item.id, isDone ? 0 : targetVal)
                        setExpandedItemId(null)
                      }}
                      aria-pressed={isDone}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-95 ${
                        isDone
                          ? 'bg-[#0F50BD] text-white'
                          : 'border-2 border-[#CBD5E1] bg-white hover:border-[#0F50BD]'
                      }`}
                      aria-label={
                        isDone
                          ? `Batalkan selesai ${item.name}`
                          : `Selesaikan target ${item.name} (${targetVal}${item.unit ? ` ${item.unit}` : ''})`
                      }
                    >
                      {isDone && <Check size={18} strokeWidth={3} />}
                    </button>
                  </div>
                )}

                {item.type === 'amount' && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedItemId((prev) => (prev === item.id ? null : item.id))
                      }
                      aria-expanded={isAmountExpanded}
                      className={`min-h-[36px] px-2.5 py-1 rounded-xl border text-xs font-bold tabular-nums cursor-pointer transition-colors ${
                        isAmountExpanded || currentVal > 0
                          ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#0F50BD]'
                          : 'bg-white border-[#CBD5E1] text-[#101828] hover:border-[#0F50BD]/50'
                      }`}
                    >
                      Rp {currentVal.toLocaleString('id-ID')}
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateValue(item.id, currentVal + 10000)}
                      className="min-h-[36px] px-2.5 py-1 rounded-xl bg-[#0F50BD] text-white text-xs font-bold hover:bg-[#1941B5] cursor-pointer active:scale-95 transition-all"
                      aria-label={`Tambah Rp 10.000 untuk ${item.name}`}
                    >
                      +10rb
                    </button>
                  </div>
                )}
              </div>

              {/* Mini progress bar when target is partially completed */}
              {showTargetMiniBar && (
                <div className="mt-2.5 w-full h-1.5 rounded-full bg-[#EEF2F6] overflow-hidden">
                  <div
                    className="h-full bg-[#0F50BD] rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.round((currentVal / targetVal) * 100))}%` }}
                  />
                </div>
              )}

              {/* Inline drawer for partial/custom target values */}
              {isTargetExpanded && (
                <div className="mt-3 pt-3 border-t border-[#EEF2F6] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={100000}
                      inputMode="numeric"
                      value={currentVal === 0 ? '' : currentVal}
                      placeholder="0"
                      onChange={(e) => {
                        const raw = e.target.value.trim()
                        if (raw === '') {
                          onUpdateValue(item.id, 0)
                          return
                        }
                        const parsed = Math.max(0, Math.min(100000, Math.floor(Number(raw) || 0)))
                        onUpdateValue(item.id, parsed)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') setExpandedItemId(null)
                      }}
                      aria-label={`Jumlah ${item.name}`}
                      className="w-16 px-2 py-2 rounded-xl border border-[#CBD5E1] bg-white text-center text-xs font-bold text-[#101828] tabular-nums focus:outline-none focus:border-[#0F50BD]"
                    />
                    <span className="text-xs font-medium text-[#475467]">
                      / {targetVal}
                      {item.unit ? ` ${item.unit}` : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {getTargetStepChips(targetVal, item.unit).map((step) => (
                      <button
                        key={step}
                        type="button"
                        onClick={() => onUpdateValue(item.id, currentVal + step)}
                        className="min-h-[34px] px-2.5 py-1 rounded-lg bg-[#EFF6FF] text-[#0F50BD] text-xs font-bold hover:bg-[#DBEAFE] active:scale-95 transition-all cursor-pointer"
                      >
                        +{step}
                      </button>
                    ))}
                    {currentVal > 0 && (
                      <button
                        type="button"
                        onClick={() => onUpdateValue(item.id, 0)}
                        className="min-h-[34px] px-2.5 py-1 rounded-lg border border-[#E2E8F0] bg-white text-[#475467] text-xs font-semibold hover:bg-[#F8FAFC] cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                    {!isDone && (
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateValue(item.id, targetVal)
                          setExpandedItemId(null)
                        }}
                        className="min-h-[34px] px-3 py-1 rounded-lg bg-[#0F50BD] text-white text-xs font-bold hover:bg-[#1941B5] active:scale-95 transition-all cursor-pointer"
                      >
                        Penuh
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Inline drawer for custom Rupiah amount */}
              {isAmountExpanded && (
                <div className="mt-3 pt-3 border-t border-[#EEF2F6] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-[#475467]">Rp</span>
                    <input
                      type="number"
                      min={0}
                      max={1000000000}
                      step={1000}
                      inputMode="numeric"
                      value={currentVal === 0 ? '' : currentVal}
                      placeholder="0"
                      onChange={(e) => {
                        const raw = e.target.value.trim()
                        if (raw === '') {
                          onUpdateValue(item.id, 0)
                          return
                        }
                        const parsed = Math.max(0, Math.min(1000000000, Math.floor(Number(raw) || 0)))
                        onUpdateValue(item.id, parsed)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') setExpandedItemId(null)
                      }}
                      aria-label={`Nominal ${item.name} dalam Rupiah`}
                      className="w-28 px-2.5 py-2 rounded-xl border border-[#CBD5E1] bg-white text-xs font-bold text-[#101828] tabular-nums focus:outline-none focus:border-[#0F50BD]"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[5000, 20000, 50000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => onUpdateValue(item.id, currentVal + amt)}
                        className="min-h-[34px] px-2.5 py-1 rounded-lg bg-[#EFF6FF] text-[#0F50BD] text-xs font-bold hover:bg-[#DBEAFE] cursor-pointer"
                      >
                        +{amt / 1000}rb
                      </button>
                    ))}
                    {currentVal > 0 && (
                      <button
                        type="button"
                        onClick={() => onUpdateValue(item.id, 0)}
                        className="min-h-[34px] px-2.5 py-1 rounded-lg border border-[#E2E8F0] bg-white text-[#475467] text-xs font-semibold hover:bg-[#F8FAFC] cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* One-tap Ramadan Amal Suggestions (only shown in Mode Ramadan when unadded suggestions remain) */}
      {ramadan?.isActive &&
        ramadanSuggestions &&
        ramadanSuggestions.length > 0 &&
        onQuickAddRamadanAmal && (
          <div className="px-4 py-3 border-t border-[#EEF2F6] bg-[#F5F9FF]/70">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F50BD]">
                <Moon size={13} aria-hidden="true" />
                <span>
                  {ramadan.isLastTenNights ? 'Amalan 10 Malam Terakhir' : 'Saran Amal Ramadan'}
                </span>
              </div>
              <span className="text-[11px] font-medium text-[#475467]">Ketuk untuk tambah</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ramadanSuggestions.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => onQuickAddRamadanAmal(s)}
                  className={`min-h-[34px] px-3 py-1.5 rounded-full border text-xs font-bold inline-flex items-center gap-1 active:scale-95 transition-all cursor-pointer ${
                    s.highlightLastTen && ramadan.isLastTenNights
                      ? 'bg-[#0F50BD] border-[#0F50BD] text-white hover:bg-[#1941B5]'
                      : 'bg-white border-[#BFDBFE] text-[#0F50BD] hover:bg-[#EFF6FF]'
                  }`}
                >
                  <Plus size={12} strokeWidth={2.8} aria-hidden="true" />
                  <span>{s.shortLabel}</span>
                </button>
              ))}
            </div>
          </div>
        )}

      {/* Add Custom Deed Footer Action */}
      <div className="px-4 py-3 border-t border-[#EEF2F6] bg-[#F8FAFC]">
        <button
          type="button"
          onClick={onOpenAddAmal}
          className="w-full min-h-[42px] py-2 rounded-xl border border-dashed border-[#0F50BD]/35 bg-white text-[#0F50BD] text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-[#EFF6FF] active:scale-[0.99] cursor-pointer transition-colors"
        >
          <Plus size={15} strokeWidth={2.5} aria-hidden="true" />
          <span>Tambah Amal Harian</span>
        </button>
      </div>
    </section>
  )
}
