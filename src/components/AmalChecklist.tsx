import React from 'react'
import { AmalItem } from '../types'
import { Check, Plus, Minus, Sun, Moon, Sparkles, BookOpen, Gift, Utensils, Heart } from 'lucide-react'

interface AmalChecklistProps {
  items: AmalItem[]
  onToggleCheck: (id: string) => void
  onIncrementCounter: (id: string, delta: number) => void
  onUpdateValue: (id: string, value: number) => void
  onOpenAddAmal?: () => void
}

export const AmalChecklist: React.FC<AmalChecklistProps> = ({
  items,
  onToggleCheck,
  onIncrementCounter,
  onUpdateValue,
  onOpenAddAmal,
}) => {
  // Calculate completed count
  const completedCount = items.filter((item) => {
    if (item.type === 'checklist') return item.done
    if (item.type === 'target') return (item.value || 0) >= (item.target || 1)
    if (item.type === 'counter' || item.type === 'amount') return (item.value || 0) > 0
    return false
  }).length

  const totalCount = items.length
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

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
          const isDone =
            item.type === 'checklist'
              ? item.done
              : item.type === 'target'
              ? (item.value || 0) >= (item.target || 1)
              : (item.value || 0) > 0

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
                <div className="flex items-center gap-2">
                  <span className={`text-[14px] font-bold leading-tight ${isDone ? 'text-[#0F50BD]' : 'text-[#101828]'}`}>
                    {item.name}
                  </span>
                  {item.isCustom && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-black/[0.05] text-[#525252]">
                      Custom
                    </span>
                  )}
                </div>
                {item.note && (
                  <p className="text-[12px] text-[#525252] truncate mt-0.5">{item.note}</p>
                )}
              </div>

              {/* Control based on type */}
              {item.type === 'checklist' && (
                <button
                  type="button"
                  onClick={() => onToggleCheck(item.id)}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
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
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onIncrementCounter(item.id, -1)}
                    disabled={(item.value || 0) <= 0}
                    className="w-7 h-7 rounded-lg border border-black/10 flex items-center justify-center text-[#525252] hover:bg-black/5 disabled:opacity-30 cursor-pointer"
                  >
                    <Minus size={14} strokeWidth={2.5} />
                  </button>
                  <span className="text-sm font-bold w-7 text-center">{item.value || 0}</span>
                  <button
                    type="button"
                    onClick={() => onIncrementCounter(item.id, 1)}
                    className="w-7 h-7 rounded-lg bg-[#0F50BD] text-white flex items-center justify-center shadow-sm hover:bg-[#1941B5] cursor-pointer"
                  >
                    <Plus size={14} strokeWidth={2.5} />
                  </button>
                </div>
              )}

              {item.type === 'target' && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onIncrementCounter(item.id, -5)}
                    disabled={(item.value || 0) <= 0}
                    className="w-7 h-7 rounded-lg border border-black/10 flex items-center justify-center text-[#525252] hover:bg-black/5 disabled:opacity-30 cursor-pointer"
                  >
                    <Minus size={14} strokeWidth={2.5} />
                  </button>
                  <span className="text-xs font-bold text-[#101828]">
                    {item.value || 0}/{item.target || 20} <span className="text-[10px] text-[#525252] font-normal">{item.unit}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => onIncrementCounter(item.id, 5)}
                    className="w-7 h-7 rounded-lg bg-[#0F50BD] text-white flex items-center justify-center shadow-sm hover:bg-[#1941B5] cursor-pointer"
                  >
                    <Plus size={14} strokeWidth={2.5} />
                  </button>
                </div>
              )}

              {item.type === 'amount' && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-[#101828]">
                    Rp {(item.value || 0).toLocaleString('id-ID')}
                  </span>
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
      {onOpenAddAmal && (
        <button
          type="button"
          onClick={onOpenAddAmal}
          className="w-full mt-3 py-2.5 rounded-xl border border-dashed border-[#0F50BD]/30 text-[#0F50BD] text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-blue-50/50 cursor-pointer transition-colors"
        >
          <Plus size={15} strokeWidth={2.5} />
          <span>Tambah Amal Kustom</span>
        </button>
      )}
    </div>
  )
}
