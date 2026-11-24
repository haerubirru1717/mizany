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
    const cls = isNext ? 'text-[#5EEAD4]' : 'text-[#0F50BD]'
    switch (id) {
      case 'subuh':
        return <Sunrise size={15} className={cls} aria-hidden="true" />
      case 'terbit':
        return <SunDim size={15} className={cls} aria-hidden="true" />
      case 'dzuhur':
      case 'ashar':
        return <Sun size={15} className={cls} aria-hidden="true" />
      case 'maghrib':
        return <Sunset size={15} className={cls} aria-hidden="true" />
      case 'isya':
      default:
        return <Moon size={15} className={cls} aria-hidden="true" />
    }
  }

  return (
    <div
      ref={scrollContainerRef}
      className="flex gap-2 overflow-x-auto py-0.5 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0"
      aria-label="Jadwal sholat hari ini"
    >
      {prayers.map((p) => (
        <button
          key={p.id}
          ref={(el) => {
            itemRefs.current[p.id] = el
          }}
          type="button"
          onClick={() => onSelectPrayer?.(p)}
          className={`flex-1 min-w-[70px] px-2.5 py-2 rounded-2xl border flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer active:scale-95 ${
            p.isNext
              ? 'bg-[#0F50BD] border-[#0F50BD] text-white shadow-sm'
              : 'bg-white border-[#E2E8F0] text-[#101828] hover:border-[#CBD5E1]'
          }`}
        >
          <div className="mb-0.5">{getIcon(p.id, p.isNext)}</div>
          <span
            className={`text-[11px] font-semibold leading-tight ${
              p.isNext ? 'text-[#DBEAFE]' : 'text-[#475467]'
            }`}
          >
            {p.name}
          </span>
          <span
            className={`text-[13px] font-bold tabular-nums leading-tight ${
              p.isNext ? 'text-white' : 'text-[#101828]'
            }`}
          >
            {p.time}
          </span>
        </button>
      ))}
    </div>
  )
}
