import React, { useState, useEffect, useRef } from 'react'
import {
  ArrowLeft,
  ChevronDown,
  RotateCcw,
  Plus,
  Trash2,
  Vibrate,
  Check,
  X,
  EyeOff,
} from 'lucide-react'

interface DhikrItem {
  id: string
  arabic: string
  latin: string
  meaning: string
  defaultTarget?: number
  isCustom?: boolean
}

interface TasbihViewProps {
  onBack: () => void
}

interface TouchRipple {
  id: number
  x: number
  y: number
}

const DEFAULT_DHIKR_LIST: DhikrItem[] = [
  { id: 'subhanallah', arabic: 'سُبْحَانَ اللَّهِ', latin: 'Subhanallah', meaning: 'Maha Suci Allah', defaultTarget: 33 },
  { id: 'alhamdulillah', arabic: 'الْحَمْدُ لِلَّهِ', latin: 'Alhamdulillah', meaning: 'Segala Puji Bagi Allah', defaultTarget: 33 },
  { id: 'allahuakbar', arabic: 'اللَّهُ أَكْبَرُ', latin: 'Allahu Akbar', meaning: 'Allah Maha Besar', defaultTarget: 33 },
  { id: 'tahlil', arabic: 'لَا إِلَهَ إِلَّا اللَّهُ', latin: 'Laa ilaaha illallah', meaning: 'Tiada Tuhan Selain Allah', defaultTarget: 100 },
  { id: 'istighfar', arabic: 'أَسْتَغْفِرُ اللَّهَ', latin: 'Astaghfirullah', meaning: 'Aku memohon ampun kepada Allah', defaultTarget: 100 },
]

const PRESET_TARGETS = [33, 99, 100]
const CUSTOM_DHIKR_KEY = 'mizany_tasbih_custom_dhikr_v1'
const TASBIH_STATE_KEY = 'mizany_tasbih_state_v1'
const HOLD_HINT_DELAY_MS = 120
const LONG_PRESS_DURATION_MS = 520
const MOVE_CANCEL_PX = 18

function vibrateDevice(pattern: number | number[]) {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(pattern)
    } catch {}
  }
}

const stopSurfaceEvents = {
  onPointerDown: (e: React.PointerEvent) => e.stopPropagation(),
  onPointerUp: (e: React.PointerEvent) => e.stopPropagation(),
  onClick: (e: React.MouseEvent) => e.stopPropagation(),
}

export const TasbihView: React.FC<TasbihViewProps> = ({ onBack }) => {
  const [customDhikr, setCustomDhikr] = useState<DhikrItem[]>([])
  const [selectedId, setSelectedId] = useState<string>('subhanallah')
  const [count, setCount] = useState<number>(0)
  const [target, setTarget] = useState<number>(33)
  const [rounds, setRounds] = useState<number>(1)
  const [hapticEnabled, setHapticEnabled] = useState<boolean>(true)

  // Minimalist inline controls visibility (toggled by pressing & holding anywhere on screen)
  const [showControls, setShowControls] = useState<boolean>(false)
  const [isDhikrOpen, setIsDhikrOpen] = useState<boolean>(false)
  const [showAddForm, setShowAddForm] = useState<boolean>(false)
  const [showCustomTarget, setShowCustomTarget] = useState<boolean>(false)
  const [customTargetInput, setCustomTargetInput] = useState<string>('33')

  // Full-screen touch & long-press visual feedback state
  const [isPressed, setIsPressed] = useState<boolean>(false)
  const [isHolding, setIsHolding] = useState<boolean>(false)
  const [ripple, setRipple] = useState<TouchRipple | null>(null)
  const [confirmReset, setConfirmReset] = useState<boolean>(false)

  const supportsVibrate = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function'

  // Add custom dhikr form fields
  const [newLatin, setNewLatin] = useState('')
  const [newArabic, setNewArabic] = useState('')
  const [newMeaning, setNewMeaning] = useState('')
  const [newTarget, setNewTarget] = useState('33')

  // Gesture tracking refs for crisp short-tap vs long-press separation
  const gestureRef = useRef({
    active: false,
    pointerId: -1,
    startX: 0,
    startY: 0,
    longPressed: false,
    cancelled: false,
  })
  const holdHintTimerRef = useRef<number | null>(null)
  const longPressTimerRef = useRef<number | null>(null)
  const rippleCounterRef = useRef<number>(0)

  const clearHoldTimers = () => {
    if (holdHintTimerRef.current !== null) {
      window.clearTimeout(holdHintTimerRef.current)
      holdHintTimerRef.current = null
    }
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  useEffect(() => {
    return () => clearHoldTimers()
  }, [])

  // Load saved custom dhikr & tasbih state
  useEffect(() => {
    try {
      const savedCustom = localStorage.getItem(CUSTOM_DHIKR_KEY)
      if (savedCustom) setCustomDhikr(JSON.parse(savedCustom))

      const savedState = localStorage.getItem(TASBIH_STATE_KEY)
      if (savedState) {
        const parsed = JSON.parse(savedState)
        if (parsed.selectedId) setSelectedId(parsed.selectedId)
        if (typeof parsed.count === 'number') setCount(parsed.count)
        if (typeof parsed.target === 'number' && parsed.target >= 1) {
          setTarget(parsed.target)
          setCustomTargetInput(String(parsed.target))
        }
        if (typeof parsed.rounds === 'number' && parsed.rounds >= 1) setRounds(parsed.rounds)
        if (typeof parsed.hapticEnabled === 'boolean') setHapticEnabled(parsed.hapticEnabled)
      }
    } catch {}
  }, [])

  // Persist tasbih state on change
  useEffect(() => {
    try {
      localStorage.setItem(
        TASBIH_STATE_KEY,
        JSON.stringify({ selectedId, count, target, rounds, hapticEnabled })
      )
    } catch {}
  }, [selectedId, count, target, rounds, hapticEnabled])

  const allDhikr = [...DEFAULT_DHIKR_LIST, ...customDhikr]
  const activeDhikr = allDhikr.find((d) => d.id === selectedId) || DEFAULT_DHIKR_LIST[0]

  const progressPercent = target > 0 ? Math.min(100, (count / target) * 100) : 0
  const radius = 96
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference

  const closeSubPopovers = () => {
    setIsDhikrOpen(false)
    setShowAddForm(false)
    setShowCustomTarget(false)
  }

  const incrementCount = (tapX?: number, tapY?: number) => {
    if (typeof tapX === 'number' && typeof tapY === 'number') {
      rippleCounterRef.current += 1
      setRipple({ id: rippleCounterRef.current, x: tapX, y: tapY })
    }

    const nextCount = count + 1
    const isMilestone = nextCount >= target
    if (isMilestone) {
      setCount(0)
      setRounds((r) => r + 1)
    } else {
      setCount(nextCount)
    }

    if (hapticEnabled) {
      vibrateDevice(isMilestone ? [80, 50, 140] : 55)
    }
  }

  const handleSurfacePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return

    // If a dropdown or custom-target input is open, tapping outside simply dismisses it without counting
    if (isDhikrOpen || showCustomTarget) {
      closeSubPopovers()
      return
    }

    clearHoldTimers()
    gestureRef.current = {
      active: true,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      longPressed: false,
      cancelled: false,
    }
    setIsPressed(true)
    setIsHolding(false)

    // Subtle hold bar appears only if user holds past quick-tap threshold
    holdHintTimerRef.current = window.setTimeout(() => {
      if (gestureRef.current.active && !gestureRef.current.cancelled) {
        setIsHolding(true)
      }
    }, HOLD_HINT_DELAY_MS)

    // Press & hold (~520ms) toggles the minimalist controls directly on screen without counting
    longPressTimerRef.current = window.setTimeout(() => {
      if (gestureRef.current.active && !gestureRef.current.cancelled) {
        gestureRef.current.longPressed = true
        gestureRef.current.active = false
        setIsPressed(false)
        setIsHolding(false)
        if (hapticEnabled) vibrateDevice([25, 35, 45])
        setShowControls((prev) => {
          const next = !prev
          if (!next) closeSubPopovers()
          return next
        })
      }
    }, LONG_PRESS_DURATION_MS)
  }

  const handleSurfacePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const g = gestureRef.current
    if (!g.active || g.pointerId !== e.pointerId) return

    const dx = e.clientX - g.startX
    const dy = e.clientY - g.startY
    if (Math.hypot(dx, dy) > MOVE_CANCEL_PX) {
      g.cancelled = true
      g.active = false
      clearHoldTimers()
      setIsPressed(false)
      setIsHolding(false)
    }
  }

  const handleSurfacePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const g = gestureRef.current
    if (g.pointerId !== e.pointerId) return

    clearHoldTimers()
    setIsPressed(false)
    setIsHolding(false)

    const shouldIncrement = g.active && !g.longPressed && !g.cancelled
    g.active = false

    if (shouldIncrement) {
      incrementCount(e.clientX, e.clientY)
    }
  }

  const handleSurfacePointerCancel = () => {
    clearHoldTimers()
    gestureRef.current.active = false
    gestureRef.current.cancelled = true
    setIsPressed(false)
    setIsHolding(false)
  }

  const handleSurfaceKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape' && showControls) {
      e.preventDefault()
      setShowControls(false)
      setConfirmReset(false)
      closeSubPopovers()
      return
    }
    if (isDhikrOpen || showCustomTarget) return
    if (e.key === 'm' || e.key === 'M') {
      e.preventDefault()
      setShowControls((prev) => {
        if (prev) {
          closeSubPopovers()
          setConfirmReset(false)
        }
        return !prev
      })
      return
    }
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      incrementCount()
    }
  }

  const handleReset = () => {
    if (count === 0 && rounds === 1) return
    if (!confirmReset) {
      setConfirmReset(true)
      return
    }
    setCount(0)
    setRounds(1)
    setConfirmReset(false)
    if (hapticEnabled) vibrateDevice(40)
  }

  const handleSelectDhikr = (item: DhikrItem) => {
    setSelectedId(item.id)
    setCount(0)
    setRounds(1)
    setConfirmReset(false)
    if (item.defaultTarget && item.defaultTarget >= 1) {
      setTarget(item.defaultTarget)
      setCustomTargetInput(String(item.defaultTarget))
    }
    setIsDhikrOpen(false)
    setShowAddForm(false)
  }

  const handleAddCustomDhikr = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLatin.trim() && !newArabic.trim()) return

    const parsedTarget = Math.max(1, Math.min(100000, Number(newTarget) || 33))
    const newItem: DhikrItem = {
      id: `custom_dhikr_${Date.now()}`,
      latin: newLatin.trim() || newArabic.trim(),
      arabic: newArabic.trim(),
      meaning: newMeaning.trim() || 'Dzikir pilihan sendiri',
      defaultTarget: parsedTarget,
      isCustom: true,
    }

    const updated = [...customDhikr, newItem]
    setCustomDhikr(updated)
    try {
      localStorage.setItem(CUSTOM_DHIKR_KEY, JSON.stringify(updated))
    } catch {}

    setSelectedId(newItem.id)
    setTarget(parsedTarget)
    setCustomTargetInput(String(parsedTarget))
    setCount(0)
    setRounds(1)
    setConfirmReset(false)
    setNewLatin('')
    setNewArabic('')
    setNewMeaning('')
    setNewTarget('33')
    setShowAddForm(false)
    setIsDhikrOpen(false)
  }

  const handleDeleteCustomDhikr = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    const updated = customDhikr.filter((d) => d.id !== id)
    setCustomDhikr(updated)
    try {
      localStorage.setItem(CUSTOM_DHIKR_KEY, JSON.stringify(updated))
    } catch {}
    if (selectedId === id) {
      setSelectedId(DEFAULT_DHIKR_LIST[0].id)
      setCount(0)
      setRounds(1)
    }
  }

  const handleApplyCustomTarget = (e: React.FormEvent) => {
    e.preventDefault()
    const parsed = Math.max(1, Math.min(100000, Math.floor(Number(customTargetInput) || 33)))
    setTarget(parsed)
    setCustomTargetInput(String(parsed))
    if (count >= parsed) setCount(0)
    setShowCustomTarget(false)
  }

  const isPresetTarget = PRESET_TARGETS.includes(target)

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Tasbih layar penuh ${activeDhikr.latin}, hitungan ${count} dari ${target}. Ketuk di mana saja untuk hitung, tekan dan tahan layar (atau tombol M) untuk konfigurasi.`}
      onPointerDown={handleSurfacePointerDown}
      onPointerMove={handleSurfacePointerMove}
      onPointerUp={handleSurfacePointerUp}
      onPointerCancel={handleSurfacePointerCancel}
      onPointerLeave={(e) => {
        if (e.pointerType === 'mouse' && gestureRef.current.active) {
          handleSurfacePointerCancel()
        }
      }}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={handleSurfaceKeyDown}
      style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }}
      className="fixed inset-0 z-30 flex flex-col justify-between overflow-hidden select-none touch-none cursor-pointer bg-gradient-to-b from-[#F2F6FF] via-white to-[#F4F8FF]"
    >
      {/* Touch-point ripple feedback */}
      {ripple && (
        <span
          key={ripple.id}
          style={{ left: ripple.x, top: ripple.y }}
          className="tasbih-touch-ripple pointer-events-none fixed z-10 w-28 h-28 rounded-full border-2 border-[#0F50BD]/25 bg-[#0F50BD]/8"
        />
      )}

      {/* ================= TOP AREA: BACK BUTTON + REVEALED MINIMALIST CONTROLS ================= */}
      <div className="relative z-20 max-w-md w-full mx-auto px-4 pt-[calc(14px+env(safe-area-inset-top))] space-y-3">
        {/* Top Row: Back + Round / Hide button */}
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            {...stopSurfaceEvents}
            onClick={(e) => {
              e.stopPropagation()
              onBack()
            }}
            className="w-10 h-10 rounded-xl glass-card flex items-center justify-center text-[#101828] hover:border-[#CBD5E1] active:scale-95 transition-all cursor-pointer"
            aria-label="Kembali ke Beranda"
          >
            <ArrowLeft size={19} />
          </button>

          <div className="flex items-center gap-2">
            <div className="pointer-events-none px-3 py-1.5 rounded-full bg-[#EFF6FF] border border-[#DBEAFE] text-xs font-bold text-[#0F50BD] tabular-nums">
              Putaran ke-{rounds}
            </div>

            {showControls && (
              <button
                type="button"
                {...stopSurfaceEvents}
                onClick={(e) => {
                  e.stopPropagation()
                  setShowControls(false)
                  setConfirmReset(false)
                  closeSubPopovers()
                }}
                className="min-h-[36px] px-3 py-1.5 rounded-full glass-card text-xs font-bold text-[#334155] hover:text-[#101828] inline-flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
                aria-label="Sembunyikan konfigurasi"
              >
                <EyeOff size={14} aria-hidden="true" />
                <span>Sembunyikan</span>
              </button>
            )}
          </div>
        </div>

        {/* Minimalist Top Config (revealed in-place via press & hold) */}
        {showControls && (
          <div {...stopSurfaceEvents} className="space-y-2.5 view-enter">
            {/* Selector Lafadz Dzikir */}
            <div className="relative max-w-sm mx-auto">
              <button
                type="button"
                onClick={() => {
                  setIsDhikrOpen((v) => !v)
                  setShowAddForm(false)
                  setShowCustomTarget(false)
                }}
                className="w-full glass-card px-4 py-3 flex items-center justify-between text-left cursor-pointer hover:border-[#CBD5E1] transition-all"
              >
                <div className="min-w-0 pr-2">
                  {activeDhikr.arabic && (
                    <div className="font-arabic text-lg font-bold text-[#0F50BD] leading-snug">
                      {activeDhikr.arabic}
                    </div>
                  )}
                  <div className="text-xs font-bold text-[#101828] mt-0.5 truncate">
                    {activeDhikr.latin}
                  </div>
                  <div className="text-xs text-[#475467] truncate">{activeDhikr.meaning}</div>
                </div>
                <ChevronDown
                  size={18}
                  className={`text-[#0F50BD] shrink-0 transition-transform duration-200 ${
                    isDhikrOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isDhikrOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 z-30 bg-white border border-[#E2E8F0] rounded-[18px] p-2.5 shadow-floating space-y-1 text-left max-h-[320px] overflow-y-auto touch-pan-y select-text">
                  {!showAddForm ? (
                    <>
                      {allDhikr.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleSelectDhikr(item)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') handleSelectDhikr(item)
                          }}
                          className={`w-full p-2.5 rounded-xl flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                            item.id === activeDhikr.id
                              ? 'bg-[#EFF6FF] text-[#0F50BD]'
                              : 'hover:bg-[#F8FAFC]'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-[#101828] truncate flex items-center gap-1.5">
                              <span>{item.latin}</span>
                              {item.isCustom && (
                                <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-[#EFF6FF] text-[#0F50BD]">
                                  Khusus
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-[#475467] truncate">{item.meaning}</div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {item.arabic && (
                              <span className="font-arabic text-base font-bold text-[#0F50BD]">
                                {item.arabic}
                              </span>
                            )}
                            {item.isCustom && (
                              <button
                                type="button"
                                onClick={(e) => handleDeleteCustomDhikr(e, item.id)}
                                className="w-8 h-8 rounded-lg text-red-700 hover:bg-red-50 flex items-center justify-center cursor-pointer"
                                aria-label={`Hapus ${item.latin}`}
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => setShowAddForm(true)}
                        className="w-full min-h-[40px] mt-1.5 py-2 px-3 rounded-xl border border-dashed border-[#0F50BD]/35 text-[#0F50BD] text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-[#EFF6FF] cursor-pointer transition-colors"
                      >
                        <Plus size={15} strokeWidth={2.5} aria-hidden="true" />
                        <span>Tambah Bacaan Sendiri</span>
                      </button>
                    </>
                  ) : (
                    <form onSubmit={handleAddCustomDhikr} className="p-1.5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#101828]">Bacaan Dzikir Sendiri</span>
                        <button
                          type="button"
                          onClick={() => setShowAddForm(false)}
                          className="w-8 h-8 rounded-lg text-[#475467] hover:bg-[#F1F5F9] flex items-center justify-center cursor-pointer"
                          aria-label="Batal"
                        >
                          <X size={15} />
                        </button>
                      </div>

                      <input
                        type="text"
                        required
                        maxLength={80}
                        value={newLatin}
                        onChange={(e) => setNewLatin(e.target.value)}
                        placeholder="Bacaan latin, mis. Sholawat Nabi"
                        className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] bg-white text-xs select-text focus:outline-none focus:border-[#0F50BD]"
                      />

                      <input
                        type="text"
                        maxLength={120}
                        dir="auto"
                        value={newArabic}
                        onChange={(e) => setNewArabic(e.target.value)}
                        placeholder="Teks Arab (opsional)"
                        className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] bg-white text-xs font-arabic select-text focus:outline-none focus:border-[#0F50BD]"
                      />

                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          maxLength={80}
                          value={newMeaning}
                          onChange={(e) => setNewMeaning(e.target.value)}
                          placeholder="Arti / catatan"
                          className="col-span-2 px-3 py-2 rounded-xl border border-[#CBD5E1] bg-white text-xs select-text focus:outline-none focus:border-[#0F50BD]"
                        />
                        <input
                          type="number"
                          min={1}
                          max={100000}
                          inputMode="numeric"
                          value={newTarget}
                          onChange={(e) => setNewTarget(e.target.value)}
                          placeholder="Jumlah"
                          aria-label="Target jumlah dzikir"
                          className="px-3 py-2 rounded-xl border border-[#CBD5E1] bg-white text-xs font-semibold text-center tabular-nums select-text focus:outline-none focus:border-[#0F50BD]"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full min-h-[40px] py-2 rounded-xl bg-[#0F50BD] text-white text-xs font-bold hover:bg-[#1941B5] cursor-pointer transition-colors"
                      >
                        Simpan &amp; Pakai Bacaan
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>

            {/* Minimalist Target Pill Bar */}
            <div className="flex items-center justify-center">
              <div className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white border border-[#E2E8F0] text-xs font-semibold text-[#475467]">
                <span className="pr-1">Target:</span>
                {PRESET_TARGETS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setTarget(t)
                      setCustomTargetInput(String(t))
                      setShowCustomTarget(false)
                      if (count >= t) setCount(0)
                    }}
                    className={`min-h-[30px] px-2.5 py-0.5 rounded-full tabular-nums cursor-pointer transition-colors ${
                      target === t && !showCustomTarget
                        ? 'bg-[#0F50BD] text-white font-bold'
                        : 'hover:text-[#101828]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setCustomTargetInput(String(target))
                    setShowCustomTarget((v) => !v)
                    setIsDhikrOpen(false)
                  }}
                  className={`min-h-[30px] px-2.5 py-0.5 rounded-full cursor-pointer transition-colors ${
                    !isPresetTarget || showCustomTarget
                      ? 'bg-[#0F50BD] text-white font-bold'
                      : 'hover:text-[#101828]'
                  }`}
                >
                  {!isPresetTarget ? `${target}` : 'Khusus'}
                </button>
              </div>
            </div>

            {/* Inline Custom Target Input */}
            {showCustomTarget && (
              <form
                onSubmit={handleApplyCustomTarget}
                className="max-w-xs mx-auto glass-card p-2 flex items-center gap-2"
              >
                <input
                  type="number"
                  min={1}
                  max={100000}
                  inputMode="numeric"
                  autoFocus
                  value={customTargetInput}
                  onChange={(e) => setCustomTargetInput(e.target.value)}
                  placeholder="Jumlah target, mis. 500"
                  aria-label="Target jumlah khusus"
                  className="flex-1 px-3 py-2 rounded-xl border border-[#CBD5E1] bg-white text-sm font-bold text-[#101828] tabular-nums select-text focus:outline-none focus:border-[#0F50BD]"
                />
                <button
                  type="submit"
                  className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#0F50BD] text-white text-xs font-bold flex items-center gap-1 hover:bg-[#1941B5] cursor-pointer"
                >
                  <Check size={14} strokeWidth={2.5} aria-hidden="true" />
                  <span>Atur</span>
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* ================= CENTER AREA: SERENE DHIKR & PROGRESS RING ================= */}
      <div className="relative z-10 max-w-md w-full mx-auto px-6 flex-1 flex flex-col items-center justify-center text-center pointer-events-none">
        {!showControls && (
          <div className="mb-6 max-w-xs">
            {activeDhikr.arabic && (
              <div className="font-arabic text-3xl font-bold text-[#0F50BD] leading-relaxed">
                {activeDhikr.arabic}
              </div>
            )}
            <div className="text-base font-bold text-[#101828] mt-1">{activeDhikr.latin}</div>
            <div className="text-xs text-[#475467] mt-0.5">{activeDhikr.meaning}</div>
          </div>
        )}

        {/* Circular Progress Counter */}
        <div
          className={`relative rounded-full flex items-center justify-center transition-all duration-150 ${
            showControls ? 'w-56 h-56' : 'w-64 h-64'
          } ${isPressed ? 'scale-[0.95]' : 'scale-100'}`}
        >
          <svg
            className="w-full h-full -rotate-90 drop-shadow-[0_10px_28px_rgba(15,80,189,0.12)]"
            viewBox="0 0 240 240"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="tasbihGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0F50BD" />
                <stop offset="100%" stopColor="#14B8A6" />
              </linearGradient>
            </defs>
            <circle
              cx="120"
              cy="120"
              r={radius}
              stroke="#E2EBFA"
              strokeWidth="12"
              fill="#FFFFFF"
            />
            <circle
              cx="120"
              cy="120"
              r={radius}
              stroke="url(#tasbihGrad)"
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-[stroke-dashoffset] duration-150 ease-out"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-6xl font-extrabold text-[#0F50BD] tracking-tight tabular-nums leading-none">
              {count}
            </span>
            <span className="text-sm font-bold text-[#475467] mt-2 tabular-nums">
              / {target}
            </span>
          </div>
        </div>
      </div>

      {/* ================= BOTTOM AREA: REVEALED CONTROLS OR WHISPER HINT ================= */}
      <div className="relative z-20 max-w-md w-full mx-auto px-6 pb-[calc(24px+env(safe-area-inset-bottom))] flex flex-col items-center gap-3">
        {isHolding ? (
          <div className="pointer-events-none w-52 px-3.5 py-2.5 rounded-2xl bg-white border border-[#E2E8F0] shadow-glass text-center">
            <div className="text-xs font-bold text-[#0F50BD]">
              {showControls ? 'Menyembunyikan menu...' : 'Menampilkan konfigurasi...'}
            </div>
            <div className="mt-1.5 h-1.5 w-full rounded-full bg-[#EFF6FF] overflow-hidden">
              <div className="tasbih-hold-bar h-full w-full rounded-full bg-[#0F50BD]" />
            </div>
          </div>
        ) : showControls ? (
          <div {...stopSurfaceEvents} className="flex flex-col items-center gap-2.5 view-enter">
            <div className="flex items-center justify-center gap-2.5">
              {supportsVibrate && (
                <button
                  type="button"
                  onClick={() => {
                    const next = !hapticEnabled
                    setHapticEnabled(next)
                    if (next) vibrateDevice(60)
                  }}
                  className={`min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold cursor-pointer active:scale-95 transition-colors touch-manipulation ${
                    hapticEnabled
                      ? 'bg-[#EFF6FF] text-[#0F50BD] border border-[#BFDBFE]'
                      : 'glass-card text-[#334155]'
                  }`}
                  aria-pressed={hapticEnabled}
                >
                  <Vibrate size={14} aria-hidden="true" />
                  <span>Getar: {hapticEnabled ? 'Aktif' : 'Mati'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleReset}
                className={`min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold cursor-pointer active:scale-95 transition-colors touch-manipulation ${
                  confirmReset
                    ? 'bg-red-600 text-white border border-red-600'
                    : 'glass-card text-[#334155] hover:text-[#101828]'
                }`}
              >
                <RotateCcw size={14} aria-hidden="true" />
                <span>{confirmReset ? 'Ketuk lagi: Reset ke 0?' : 'Mulai dari 0'}</span>
              </button>
            </div>
            <p className="pointer-events-none text-xs text-[#475467]">
              Tahan layar lagi untuk menyembunyikan
            </p>
          </div>
        ) : (
          <div className="pointer-events-none text-center space-y-1">
            <p className="text-xs font-semibold text-[#334155]">
              Ketuk di mana saja untuk hitung
            </p>
            <p className="text-xs text-[#475467]">
              Tekan &amp; tahan layar untuk tampilkan konfigurasi
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
