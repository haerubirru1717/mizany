import React from 'react'
import { AmalItem, MandatoryPrayerKey } from '../types'
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
  Pencil,
  Lock,
} from 'lucide-react'

interface AmalChecklistProps {
  items: AmalItem[]
  onTogglePrayer: (prayer: MandatoryPrayerKey) => void
  onToggleCheck: (id: string) => void
  onIncrementCounter: (id: string, delta: number) => void
  onUpdateValue: (id: string, value: number) => void
  onOpenAddAmal: () => void
  onEditAmal: (item: AmalItem) => void
}

const MANDATORY_PRAYERS: { key: MandatoryPrayerKey; label: string }[] = [
  { key: 'subuh', label: 'Subuh' },
  { key: 'dzuhur', label: 'Dzuhur' },
  { key: 'ashar', label: 'Ashar' },
  { key: 'maghrib', label: 'Maghrib' },
  { key: 'isya', label: 'Isya' },
]

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
  onTogglePrayer,
  onToggleCheck,
  onIncrementCounter,
  onUpdateValue,
  onOpenAddAmal,
  onEditAmal,
}) => {
  const completedCount = items.filter(isItemComplete).length
  const totalCount = items.length
  const progressPercent =
    totalCount > 0
      ? Math.round((items.reduce((sum, item) => sum + getItemFraction(item), 0) / totalCount) * 100)
      : 0

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
      {/* Header with progress */}
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="text-base font-bold text-[#101828]">Checklist Hari Ini</h3>
        <span className="text-xs font-semibold text-[#525252]">
          <span className="text-[#0F50BD] font-bold">{completedCount}</span> dari {totalCount} selesai
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 rounded-full bg-black/[0.06] overflow-hidden mb-4">
        <div
          className="h-full bg-gradient-to-r from-[#0F50BD] to-[#14B8A6] rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

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

          return (
            <div
              key={item.id}
              className={`p-3.5 rounded-2xl border transition-all duration-200 flex items-center gap-3 ${
                isDone
                  ? 'bg-blue-50/50 border-[#0F50BD]/25 shadow-sm'
                  : 'bg-white/80 border-black/[0.05] hover:border-black/[0.1]'
              }`}
            >
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
                  {item.isLocked ? (
                    <span className="inline-flex items-center gap-0.5 text-[9.5px] font-bold px-1.5 py-0.5 rounded-md bg-[#0F50BD]/10 text-[#0F50BD] shrink-0">
                      <Lock size={9} />
                      Wajib
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onEditAmal(item)}
                      className="p-1 rounded-lg text-[#525252]/70 hover:text-[#0F50BD] hover:bg-[#0F50BD]/10 cursor-pointer transition-colors shrink-0"
                      aria-label={`Edit ${item.name}`}
                      title="Edit amal"
                    >
                      <Pencil size={12} />
                    </button>
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
                    disabled={(item.value || 0) <= 0}
                    className="w-7 h-7 rounded-lg border border-black/10 flex items-center justify-center text-[#525252] hover:bg-black/5 disabled:opacity-30 cursor-pointer"
                    aria-label={`Kurangi ${item.name}`}
                  >
                    <Minus size={14} strokeWidth={2.5} />
                  </button>
                  <span className="text-xs font-bold min-w-[28px] text-center text-[#101828]">
                    {item.value || 0}
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
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onIncrementCounter(item.id, -1)}
                    disabled={(item.value || 0) <= 0}
                    className="w-7 h-7 rounded-lg border border-black/10 flex items-center justify-center text-[#525252] hover:bg-black/5 disabled:opacity-30 cursor-pointer"
                    aria-label={`Kurangi ${item.name}`}
                  >
                    <Minus size={14} strokeWidth={2.5} />
                  </button>
                  <span className="text-xs font-bold text-[#101828] whitespace-nowrap">
                    {item.value || 0}/{item.target || 1}
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

              {item.type === 'amount' && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs font-bold text-[#101828]">
                    Rp {(item.value || 0).toLocaleString('id-ID')}
                  </span>
                  {(item.value || 0) > 0 && (
                    <button
                      type="button"
                      onClick={() => onUpdateValue(item.id, Math.max(0, (item.value || 0) - 10000))}
                      className="w-6 h-6 rounded-lg border border-black/10 text-[#525252] flex items-center justify-center hover:bg-black/5 cursor-pointer"
                      aria-label={`Kurangi nominal ${item.name}`}
                    >
                      <Minus size={12} strokeWidth={2.5} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onUpdateValue(item.id, (item.value || 0) + 10000)}
                    className="px-2 py-1 rounded-lg bg-[#0F50BD]/10 text-[#0F50BD] text-xs font-bold hover:bg-[#0F50BD]/20 cursor-pointer"
                  >
                    +10rb
                  </button>
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
