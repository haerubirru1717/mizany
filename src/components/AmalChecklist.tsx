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
  Sparkles,
  BookOpen,
  Gift,
  Utensils,
  Heart,
  Lock,
  ChevronLeft,
  ChevronRight,
  History,
} from 'lucide-react'

interface AmalChecklistProps {
  items: AmalItem[]
  selectedDateIso: string
  todayIso: string
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
  onChangeDate,
  onTogglePrayer,
  onToggleCheck,
  onIncrementCounter,
  onUpdateValue,
  onOpenAddAmal,
}) => {
  const [expandedTargetId, setExpandedTargetId] = useState<string | null>(null)

  const completedCount = items.filter(isItemComplete).length
  const totalCount = items.length
  const progressPercent =
    totalCount > 0
      ? Math.round((items.reduce((sum, item) => sum + getItemFraction(item), 0) / totalCount) * 100)
      : 0

  const dateMeta = formatChecklistDateTitle(selectedDateIso, todayIso)
  const daysBack = diffIsoDays(selectedDateIso, todayIso)
  const canGoBack = daysBack < MAX_BACKFILL_DAYS
  const canGoForward = daysBack > 0

  const handleShiftDay = (delta: number) => {
    const nextIso = shiftIsoDate(selectedDateIso, delta)
    if (nextIso > todayIso) return
    if (diffIsoDays(nextIso, todayIso) > MAX_BACKFILL_DAYS) return
    setExpandedTargetId(null)
    onChangeDate(nextIso)
  }

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'sun':
        return <Sun size={19} className="text-[#F59E0B]" />
      case 'moon':
        return <Moon size={19} className="text-[#8BA0F3]" />
      case 'star':
        return <Sparkles size={19} className="text-[#F59E0B]" />
      case 'book':
        return <BookOpen size={19} className="text-[#0F50BD]" />
      case 'gift':
        return <Gift size={19} className="text-[#14B8A6]" />
      case 'bowl':
        return <Utensils size={19} className="text-[#F59E0B]" />
      case 'dome':
      case 'beads':
      default:
        return <Heart size={19} className="text-[#0F50BD]" />
    }
  }

  return (
    <div id="checklist-section" className="glass-card p-4 sm:p-5 mt-5">
      {/* Header with compact date navigation & progress */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="inline-flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              onClick={() => handleShiftDay(-1)}
              disabled={!canGoBack}
              className="w-6 h-6 rounded-lg bg-black/[0.04] hover:bg-black/[0.08] disabled:opacity-25 flex items-center justify-center text-[#101828] cursor-pointer active:scale-95 transition-all"
              aria-label="Lihat hari sebelumnya"
              title="Hari sebelumnya"
            >
              <ChevronLeft size={14} strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={() => handleShiftDay(1)}
              disabled={!canGoForward}
              className="w-6 h-6 rounded-lg bg-black/[0.04] hover:bg-black/[0.08] disabled:opacity-25 flex items-center justify-center text-[#101828] cursor-pointer active:scale-95 transition-all"
              aria-label="Lihat hari berikutnya"
              title="Hari berikutnya"
            >
              <ChevronRight size={14} strokeWidth={2.5} />
            </button>
          </div>
          <h3 className="text-base font-bold text-[#101828] truncate">{dateMeta.title}</h3>
        </div>

        <span className="text-xs font-semibold text-[#525252] shrink-0 tabular-nums">
          <span className="text-[#0F50BD] font-bold">{completedCount}</span> dari {totalCount} selesai
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 rounded-full bg-black/[0.06] overflow-hidden mb-3.5">
        <div
          className="h-full bg-gradient-to-r from-[#0F50BD] to-[#14B8A6] rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Calm indicator strip when editing a past date */}
      {dateMeta.isPast && (
        <div className="mb-3.5 px-3 py-2 rounded-xl bg-amber-50/80 border border-amber-200/70 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-amber-800 min-w-0">
            <History size={13} className="shrink-0 text-[#F59E0B]" />
            <span className="truncate">
              Koreksi riwayat · <b>{dateMeta.subtitle}</b>
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setExpandedTargetId(null)
              onChangeDate(todayIso)
            }}
            className="px-2.5 py-1 rounded-full bg-[#0F50BD] text-white text-[10.5px] font-bold hover:bg-[#1941B5] cursor-pointer shrink-0 transition-colors"
          >
            Ke Hari Ini
          </button>
        </div>
      )}

      {/* List of Deeds */}
      <div className="space-y-2.5">
        {items.map((item) => {
          const isDone = isItemComplete(item)

          // Mandatory 5-Prayer Card (Locked)
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
                className={`p-3.5 rounded-2xl border transition-all duration-200 ${
                  isDone
                    ? 'bg-blue-50/50 border-[#0F50BD]/25 shadow-sm'
                    : 'bg-white/85 border-black/[0.06]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#0F50BD]/10 flex items-center justify-center shrink-0">
                    {renderIcon(item.icon)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[14px] font-bold leading-tight ${
                          isDone ? 'text-[#0F50BD]' : 'text-[#101828]'
                        }`}
                      >
                        {item.name}
                      </span>
                      <span className="inline-flex items-center gap-0.5 text-[9.5px] font-bold px-1.5 py-0.5 rounded-md bg-[#0F50BD]/10 text-[#0F50BD]">
                        <Lock size={9} />
                        Wajib
                      </span>
                    </div>
                    {item.note && (
                      <p className="text-[11.5px] text-[#525252] truncate mt-0.5">{item.note}</p>
                    )}
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${
                      isDone
                        ? 'bg-[#0F50BD] text-white'
                        : 'bg-black/[0.05] text-[#525252]'
                    }`}
                  >
                    {prayersDoneCount}/5
                  </span>
                </div>

                {/* 5 individual prayer pills */}
                <div className="grid grid-cols-5 gap-1.5 mt-3">
                  {MANDATORY_PRAYERS.map((p) => {
                    const checked = Boolean(checks[p.key])
                    return (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => onTogglePrayer(p.key)}
                        aria-pressed={checked}
                        className={`py-2 px-1 rounded-xl border text-center flex flex-col items-center justify-center gap-1 transition-all duration-150 cursor-pointer active:scale-95 ${
                          checked
                            ? 'bg-[#0F50BD] border-[#0F50BD] text-white shadow-[0_2px_8px_rgba(15,80,189,0.28)]'
                            : 'bg-white border-black/10 text-[#525252] hover:border-[#0F50BD]/40 hover:text-[#101828]'
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded-full flex items-center justify-center ${
                            checked
                              ? 'bg-white/25 text-white'
                              : 'border border-black/20'
                          }`}
                        >
                          {checked && <Check size={11} strokeWidth={3.2} />}
                        </span>
                        <span className="text-[10.5px] font-bold leading-none">{p.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          }

          const targetVal = item.target || 1
          const currentVal = item.value || 0
          const isTargetExpanded = item.type === 'target' && expandedTargetId === item.id && targetVal > 1
          const showTargetMiniBar = item.type === 'target' && targetVal > 1 && currentVal > 0 && !isDone

          return (
            <div
              key={item.id}
              className={`p-3.5 rounded-2xl border transition-all duration-200 ${
                isDone
                  ? 'bg-blue-50/50 border-[#0F50BD]/25 shadow-sm'
                  : 'bg-white/80 border-black/[0.05] hover:border-black/[0.1]'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Icon */}
                <div className="w-9 h-9 rounded-xl bg-black/[0.04] flex items-center justify-center shrink-0">
                  {renderIcon(item.icon)}
                </div>

                {/* Title & Notes */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[14px] font-bold leading-tight truncate ${
                        isDone ? 'text-[#0F50BD]' : 'text-[#101828]'
                      }`}
                    >
                      {item.name}
                    </span>
                    {item.isLocked && (
                      <span className="inline-flex items-center gap-0.5 text-[9.5px] font-bold px-1.5 py-0.5 rounded-md bg-[#0F50BD]/10 text-[#0F50BD] shrink-0">
                        <Lock size={9} />
                        Wajib
                      </span>
                    )}
                  </div>
                  {item.note && (
                    <p className="text-[11.5px] text-[#525252] truncate mt-0.5">{item.note}</p>
                  )}
                </div>

                {/* Control based on type */}
                {item.type === 'checklist' && (
                  <button
                    type="button"
                    onClick={() => onToggleCheck(item.id)}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                      item.done
                        ? 'bg-[#0F50BD] text-white shadow-[0_2px_8px_rgba(15,80,189,0.3)]'
                        : 'border-2 border-black/20 hover:border-[#0F50BD]'
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
                      className="w-7 h-7 rounded-lg border border-black/10 flex items-center justify-center text-[#525252] hover:bg-black/5 disabled:opacity-30 cursor-pointer"
                      aria-label={`Kurangi ${item.name}`}
                    >
                      <Minus size={14} strokeWidth={2.5} />
                    </button>
                    <span className="text-xs font-bold min-w-[28px] text-center text-[#101828] tabular-nums">
                      {currentVal}
                      {item.unit ? (
                        <span className="text-[10px] text-[#525252] font-normal ml-0.5">
                          {item.unit}
                        </span>
                      ) : null}
                    </span>
                    <button
                      type="button"
                      onClick={() => onIncrementCounter(item.id, 1)}
                      className="w-7 h-7 rounded-lg bg-[#0F50BD] text-white flex items-center justify-center shadow-sm hover:bg-[#1941B5] cursor-pointer"
                      aria-label={`Tambah ${item.name}`}
                    >
                      <Plus size={14} strokeWidth={2.5} />
                    </button>
                  </div>
                )}

                {item.type === 'target' && (
                  <div className="flex items-center gap-2 shrink-0">
                    {targetVal > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedTargetId((prev) => (prev === item.id ? null : item.id))
                        }
                        aria-expanded={isTargetExpanded}
                        aria-label={`Isi progres ${item.name} (${currentVal} dari ${targetVal})`}
                        className={`px-2.5 py-1 rounded-lg border text-xs font-bold tabular-nums transition-colors cursor-pointer ${
                          isTargetExpanded
                            ? 'bg-[#0F50BD]/10 border-[#0F50BD] text-[#0F50BD]'
                            : isDone
                            ? 'bg-white border-[#0F50BD]/25 text-[#0F50BD]'
                            : currentVal > 0
                            ? 'bg-[#0F50BD]/5 border-[#0F50BD]/30 text-[#0F50BD]'
                            : 'bg-white border-black/15 text-[#525252] hover:border-[#0F50BD]/40'
                        }`}
                      >
                        {currentVal}/{targetVal}
                      </button>
                    )}

                    {/* 1-tap complete / undo button */}
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateValue(item.id, isDone ? 0 : targetVal)
                        setExpandedTargetId(null)
                      }}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-95 ${
                        isDone
                          ? 'bg-[#0F50BD] text-white shadow-[0_2px_8px_rgba(15,80,189,0.3)]'
                          : 'border-2 border-black/20 hover:border-[#0F50BD]'
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
                    <span className="text-xs font-bold text-[#101828] tabular-nums">
                      Rp {currentVal.toLocaleString('id-ID')}
                    </span>
                    {currentVal > 0 && (
                      <button
                        type="button"
                        onClick={() => onUpdateValue(item.id, Math.max(0, currentVal - 10000))}
                        className="w-6 h-6 rounded-lg border border-black/10 text-[#525252] flex items-center justify-center hover:bg-black/5 cursor-pointer"
                        aria-label={`Kurangi nominal ${item.name}`}
                      >
                        <Minus size={12} strokeWidth={2.5} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onUpdateValue(item.id, currentVal + 10000)}
                      className="px-2 py-1 rounded-lg bg-[#0F50BD]/10 text-[#0F50BD] text-xs font-bold hover:bg-[#0F50BD]/20 cursor-pointer"
                    >
                      +10rb
                    </button>
                  </div>
                )}
              </div>

              {/* Mini progress bar when target is partially completed */}
              {showTargetMiniBar && (
                <div className="mt-2.5 w-full h-1.5 rounded-full bg-black/[0.06] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#0F50BD] to-[#14B8A6] rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.round((currentVal / targetVal) * 100))}%` }}
                  />
                </div>
              )}

              {/* Inline quick-input drawer for partial/custom target values */}
              {isTargetExpanded && (
                <div className="mt-2.5 pt-2.5 border-t border-black/[0.06] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
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
                        if (e.key === 'Enter') setExpandedTargetId(null)
                      }}
                      aria-label={`Jumlah ${item.name}`}
                      className="w-16 px-2 py-1.5 rounded-lg border border-black/15 bg-white text-center text-xs font-bold text-[#101828] tabular-nums focus:outline-none focus:ring-2 focus:ring-[#0F50BD]/30 focus:border-[#0F50BD]"
                    />
                    <span className="text-[11px] font-medium text-[#525252]">
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
                        className="px-2 py-1 rounded-lg bg-[#0F50BD]/10 text-[#0F50BD] text-[11px] font-bold hover:bg-[#0F50BD]/20 active:scale-95 transition-all cursor-pointer"
                      >
                        +{step}
                      </button>
                    ))}
                    {currentVal > 0 && (
                      <button
                        type="button"
                        onClick={() => onUpdateValue(item.id, 0)}
                        className="px-2 py-1 rounded-lg border border-black/10 bg-white text-[#525252] text-[11px] font-semibold hover:bg-black/5 cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                    {!isDone && (
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateValue(item.id, targetVal)
                          setExpandedTargetId(null)
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#0F50BD] text-white text-[11px] font-bold hover:bg-[#1941B5] active:scale-95 transition-all cursor-pointer"
                      >
                        Penuh
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Add Custom Deed button */}
      <button
        type="button"
        onClick={onOpenAddAmal}
        className="w-full mt-3.5 py-2.5 rounded-xl border border-dashed border-[#0F50BD]/35 text-[#0F50BD] text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-blue-50/60 active:scale-[0.99] cursor-pointer transition-all"
      >
        <Plus size={15} strokeWidth={2.5} />
        <span>Tambah Amal</span>
      </button>
    </div>
  )
}
