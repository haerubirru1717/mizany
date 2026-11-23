import React, { useEffect, useRef } from 'react'
import { Sunrise, Sun, Sunset, Moon, Sparkles } from 'lucide-react'

interface PrayerItem {
  id: string
  name: string
  time: string
  isNext?: boolean
  isPassed?: boolean
}

interface PrayerRowProps {
  prayers?: PrayerItem[]
  city: string
  onSelectPrayer?: (prayer: PrayerItem) => void
}

const LOADING_PRAYERS: PrayerItem[] = [
  { id: 'subuh', name: 'Subuh', time: '--:--' },
  { id: 'terbit', name: 'Terbit', time: '--:--' },
  { id: 'dzuhur', name: 'Dzuhur', time: '--:--' },
  { id: 'ashar', name: 'Ashar', time: '--:--' },
  { id: 'maghrib', name: 'Maghrib', time: '--:--' },
  { id: 'isya', name: 'Isya', time: '--:--' },
]

export const PrayerRow: React.FC<PrayerRowProps> = ({
  prayers = LOADING_PRAYERS,
  city,
  onSelectPrayer,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  const nextPrayerId = prayers.find((p) => p.isNext)?.id

  // Auto-center the active next-prayer card horizontally (never scrolls the page vertically,
  // and only re-runs when the active next prayer actually changes so manual swipes aren't fought)
  useEffect(() => {
    if (!nextPrayerId) return
    const container = scrollContainerRef.current
    const activeEl = itemRefs.current[nextPrayerId]
    if (!container || !activeEl) return

    const rafId = requestAnimationFrame(() => {
      const containerRect = container.getBoundingClientRect()
      const itemRect = activeEl.getBoundingClientRect()
      const itemCenter = itemRect.left - containerRect.left + itemRect.width / 2
      const desiredLeft = container.scrollLeft + itemCenter - containerRect.width / 2
      const maxLeft = Math.max(0, container.scrollWidth - container.clientWidth)
      const clampedLeft = Math.max(0, Math.min(maxLeft, desiredLeft))

      container.scrollTo({
        left: clampedLeft,
        behavior: 'smooth',
      })
    })

    return () => cancelAnimationFrame(rafId)
  }, [nextPrayerId])

  const getIcon = (id: string) => {
    switch (id) {
      case 'subuh':
        return <Sunrise size={20} className="text-[#F59E0B]" />
      case 'terbit':
        return <Sparkles size={19} className="text-[#F59E0B]" />
      case 'dzuhur':
        return <Sun size={20} className="text-[#F59E0B]" />
      case 'ashar':
        return <Sun size={20} className="text-[#F59E0B]" />
      case 'maghrib':
        return <Sunset size={20} className="text-[#F59E0B]" />
      case 'isya':
      default:
        return <Moon size={20} className="text-[#F59E0B]" />
    }
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-base font-bold text-[#101828]">Prayer Times</h3>
        <span className="text-xs font-medium text-[#525252] flex items-center gap-1">
          <span>{city}</span>
        </span>
      </div>

      {/* Horizontal scrollable row — auto-focuses active next prayer */}
      <div
        ref={scrollContainerRef}
        className="flex gap-2.5 overflow-x-auto pt-1 pb-2.5 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0"
      >
        {prayers.map((p) => {
          return (
            <button
              key={p.id}
              ref={(el) => {
                itemRefs.current[p.id] = el
              }}
              type="button"
              onClick={() => onSelectPrayer?.(p)}
              className={`flex-1 min-w-[76px] p-3 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 cursor-pointer ${
                p.isNext
                  ? 'bg-[#0F50BD] text-white shadow-[0_6px_18px_rgba(15,80,189,0.3)] ring-2 ring-[#0F50BD]/30 scale-[1.03]'
                  : 'glass-card text-[#101828] hover:bg-white'
              }`}
            >
              <div className="mb-1.5">{getIcon(p.id)}</div>
              <span
                className={`text-[12px] font-semibold ${
                  p.isNext ? 'text-white/90' : 'text-[#525252]'
                }`}
              >
                {p.name}
              </span>
              <span className={`text-[14px] font-bold ${p.isNext ? 'text-white' : 'text-[#101828]'}`}>
                {p.time}
              </span>
            </button>
          )
        })}
      </div>
      <p className="text-[11px] text-[#525252]/75 mt-1.5 px-1">
        Metode Kemenag RI · waktu berikutnya ditandai biru
      </p>
    </div>
  )
}
