import React, { useEffect, useRef } from 'react'
import { Sunrise, Sun, Sunset, Moon, SunDim } from 'lucide-react'

interface PrayerItem {
  id: string
  name: string
  time: string
  isNext?: boolean
  isPassed?: boolean
}

interface PrayerRowProps {
  prayers?: PrayerItem[]
  city?: string
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

  const getIcon = (id: string, isNext?: boolean) => {
    const cls = isNext ? 'text-[#FDE68A]' : 'text-[#D97706]'
    switch (id) {
      case 'subuh':
        return <Sunrise size={20} className={cls} aria-hidden="true" />
      case 'terbit':
        return <SunDim size={20} className={cls} aria-hidden="true" />
      case 'dzuhur':
      case 'ashar':
        return <Sun size={20} className={cls} aria-hidden="true" />
      case 'maghrib':
        return <Sunset size={20} className={cls} aria-hidden="true" />
      case 'isya':
      default:
        return <Moon size={20} className={cls} aria-hidden="true" />
    }
  }

  return (
    <section aria-label="Jadwal sholat hari ini">
      <div className="flex items-center justify-between mb-2.5 px-1">
        <h2 className="text-base font-bold text-[#101828]">Jadwal Sholat</h2>
        {city && <span className="text-xs font-medium text-[#475467]">{city}</span>}
      </div>

      <div
        ref={scrollContainerRef}
        className="flex gap-2.5 overflow-x-auto pt-1 pb-2 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0"
      >
        {prayers.map((p) => (
          <button
            key={p.id}
            ref={(el) => {
              itemRefs.current[p.id] = el
            }}
            type="button"
            onClick={() => onSelectPrayer?.(p)}
            className={`flex-1 min-w-[78px] p-3 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 cursor-pointer active:scale-95 ${
              p.isNext
                ? 'bg-[#0F50BD] text-white shadow-[0_6px_18px_rgba(15,80,189,0.3)] ring-2 ring-[#0F50BD]/25 scale-[1.03]'
                : 'glass-card text-[#101828] hover:border-[#0F50BD]/25'
            }`}
          >
            <div className="mb-1.5">{getIcon(p.id, p.isNext)}</div>
            <span
              className={`text-xs font-semibold ${
                p.isNext ? 'text-[#DBEAFE]' : 'text-[#475467]'
              }`}
            >
              {p.name}
            </span>
            <span
              className={`text-sm font-bold tabular-nums mt-0.5 ${
                p.isNext ? 'text-white' : 'text-[#101828]'
              }`}
            >
              {p.time}
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}
