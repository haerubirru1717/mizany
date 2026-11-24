import React, { useState, useEffect, useRef } from 'react'
import {
  ArrowLeft,
  RotateCcw,
  Plus,
  Trash2,
  Vibrate,
  Check,
  X,
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

export const TasbihView: React.FC<TasbihViewProps> = ({ onBack }) => {
  const [customDhikr, setCustomDhikr] = useState<DhikrItem[]>([])
  const [selectedId, setSelectedId] = useState<string>('subhanallah')
  const [count, setCount] = useState<number>(0)
  const [target, setTarget] = useState<number>(33)
  const [rounds, setRounds] = useState<number>(1)
  const [hapticEnabled, setHapticEnabled] = useState<boolean>(true)

  // Config bottom-sheet state (opened via long-press anywhere on screen)
  const [showConfig, setShowConfig] = useState<boolean>(false)
  const [showAddForm, setShowAddForm] = useState<boolean>(false)
  const [showCustomTarget, setShowCustomTarget] = useState<boolean>(false)
  const [customTargetInput, setCustomTargetInput] = useState<string>('33')

  // Full-screen touch & long-press visual feedback state
  const [isPressed, setIsPressed] = useState<boolean>(false)
  const [isHolding, setIsHolding] = useState<boolean>(false)
  const [ripple, setRipple] = useState<TouchRipple | null>(null)

  // Add custom dhikr form fields
  const [newLatin, setNewLatin] = useState('')
  const [newArabic, setNewArabic] = useState('')
  const [newMeaning, setNewMeaning] = useState('')
  const [newTarget, setNewTarget] = useState('33')

  // Gesture tracking refs for crisp tap vs long-press separation
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
  const configOpenedAtRef = useRef<number>(0)

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

  // Cleanup timers on unmount
  useEffect(() => {
    return () => clearHoldTimers()
  }, [])

  // Close config modal on Escape key
  useEffect(() => {
    if (!showConfig) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowConfig(false)
        setShowAddForm(false)
        setShowCustomTarget(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [showConfig])

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
  const radius = 98
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference

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
    if (showConfig) return
    // Ignore secondary mouse buttons (right-click, middle-click)
    if (e.pointerType === 'mouse' && e.button !== 0) return

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

    // Show subtle hold indicator only if user holds past quick-tap duration
    holdHintTimerRef.current = window.setTimeout(() => {
      if (gestureRef.current.active && !gestureRef.current.cancelled) {
        setIsHolding(true)
      }
    }, HOLD_HINT_DELAY_MS)

    // Open configuration sheet on sustained press (~520ms) without incrementing count
    longPressTimerRef.current = window.setTimeout(() => {
      if (gestureRef.current.active && !gestureRef.current.cancelled) {
        gestureRef.current.longPressed = true
        gestureRef.current.active = false
        setIsPressed(false)
        setIsHolding(false)
        configOpenedAtRef.current = Date.now()
        if (hapticEnabled) vibrateDevice([25, 35, 45])
        setShowConfig(true)
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
    if (showConfig) return
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      incrementCount()
    }
  }

  const handleReset = () => {
    setCount(0)
    setRounds(1)
    if (hapticEnabled) vibrateDevice(40)
    setShowConfig(false)
  }

  const handleSelectDhikr = (item: DhikrItem) => {
    setSelectedId(item.id)
    setCount(0)
    setRounds(1)
    if (item.defaultTarget && item.defaultTarget >= 1) {
      setTarget(item.defaultTarget)
      setCustomTargetInput(String(item.defaultTarget))
    }
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
    setNewLatin('')
    setNewArabic('')
    setNewMeaning('')
    setNewTarget('33')
    setShowAddForm(false)
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
    <>
      {/* Full-Screen Touch Surface — tap anywhere to count, press & hold anywhere for configuration */}
      <div
        role="button"
        tabIndex={0}
        aria-label={`Tasbih layar penuh ${activeDhikr.latin}, hitungan ${count} dari ${target}. Ketuk di mana saja untuk hitung, tekan dan tahan untuk membuka pengaturan.`}
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
        className="fixed inset-0 z-30 flex flex-col justify-between overflow-hidden select-none touch-none cursor-pointer bg-gradient-to-b from-[#F4F7FF] via-white to-[#F7FAFF]"
      >
        {/* Subtle ambient Tazkirah glow */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-[#8BA0F3]/15 blur-[90px]" />
        <div className="pointer-events-none absolute -bottom-24 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-[#14B8A6]/10 blur-[80px]" />

        {/* Touch-point ripple feedback */}
        {ripple && (
          <span
            key={ripple.id}
            style={{ left: ripple.x, top: ripple.y }}
            className="tasbih-touch-ripple pointer-events-none fixed z-10 w-28 h-28 rounded-full border-2 border-[#0F50BD]/30 bg-[#0F50BD]/10"
          />
        )}

        {/* Top Bar: Back Button (isolated from tap canvas) + Round Pill */}
        <div className="relative z-20 max-w-md w-full mx-auto px-4 pt-[calc(14px+env(safe-area-inset-top))] flex items-center justify-between">
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              onBack()
            }}
            className="w-10 h-10 rounded-xl glass-card flex items-center justify-center text-[#101828] hover:bg-white active:scale-95 transition-all cursor-pointer shadow-sm"
            aria-label="Kembali ke Beranda"
          >
            <ArrowLeft size={19} />
          </button>

          <div className="pointer-events-none px-3.5 py-1.5 rounded-full bg-[#0F50BD]/10 border border-[#0F50BD]/15 text-xs font-bold text-[#0F50BD] tabular-nums">
            Putaran ke-{rounds}
          </div>
        </div>

        {/* Center: Active Dhikr & Circular Progress Ring */}
        <div className="relative z-10 max-w-md w-full mx-auto px-6 flex-1 flex flex-col items-center justify-center text-center pointer-events-none">
          {/* Active Dhikr Text */}
          <div className="mb-7 max-w-xs">
            {activeDhikr.arabic && (
              <div className="text-2xl sm:text-[28px] font-bold text-[#0F50BD] leading-relaxed">
                {activeDhikr.arabic}
              </div>
            )}
            <div className="text-base font-bold text-[#101828] mt-1">{activeDhikr.latin}</div>
            <div className="text-xs text-[#525252] mt-0.5">{activeDhikr.meaning}</div>
          </div>

          {/* Circular Progress Counter */}
          <div
            className={`relative w-64 h-64 rounded-full flex items-center justify-center transition-transform duration-100 ${
              isPressed ? 'scale-[0.95]' : 'scale-100'
            }`}
          >
            <svg className="w-full h-full -rotate-90 drop-shadow-md" viewBox="0 0 240 240">
              <defs>
                <linearGradient id="tasbihRingGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#0F50BD" />
                  <stop offset="100%" stopColor="#14B8A6" />
                </linearGradient>
              </defs>
              <circle
                cx="120"
                cy="120"
                r={radius}
                stroke="rgba(16, 24, 40, 0.08)"
                strokeWidth="12"
                fill="rgba(255, 255, 255, 0.92)"
              />
              <circle
                cx="120"
                cy="120"
                r={radius}
                stroke="url(#tasbihRingGrad)"
                strokeWidth="12"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-[stroke-dashoffset] duration-150 ease-out"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-6xl font-black text-[#0F50BD] tracking-tight tabular-nums leading-none">
                {count}
              </span>
              <span className="text-sm font-bold text-[#525252] mt-2 tabular-nums">
                / {target}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Whisper Hint & Live Hold Progress Indicator */}
        <div className="relative z-10 max-w-md w-full mx-auto px-6 pb-[calc(24px+env(safe-area-inset-bottom))] flex flex-col items-center pointer-events-none">
          {isHolding ? (
            <div className="w-52 px-3.5 py-2 rounded-2xl bg-white/95 border border-[#0F50BD]/20 shadow-sm text-center">
              <div className="text-[11px] font-bold text-[#0F50BD]">
                Membuka pengaturan...
              </div>
              <div className="mt-1.5 h-1.5 w-full rounded-full bg-[#0F50BD]/15 overflow-hidden">
                <div className="tasbih-hold-bar h-full w-full rounded-full bg-gradient-to-r from-[#0F50BD] to-[#14B8A6]" />
              </div>
            </div>
          ) : (
            <div className="text-center space-y-1">
              <p className="text-xs font-semibold text-[#525252]">
                Ketuk di mana saja untuk hitung
              </p>
              <p className="text-[11px] text-[#525252]/75">
                Tekan &amp; tahan layar untuk pengaturan tasbih
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ================= CONFIGURATION BOTTOM SHEET (OPENED BY LONG-PRESS) ================= */}
      {showConfig && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#101828]/45 backdrop-blur-[3px] p-0 sm:p-4"
          onClick={() => {
            if (Date.now() - configOpenedAtRef.current < 350) return
            setShowConfig(false)
            setShowAddForm(false)
            setShowCustomTarget(false)
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Konfigurasi Tasbih"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md max-h-[85dvh] overflow-y-auto bg-white rounded-t-[26px] sm:rounded-[24px] p-5 pb-[calc(24px+env(safe-area-inset-bottom))] sm:pb-6 shadow-floating view-enter space-y-4"
          >
            {/* Grab handle */}
            <div className="w-10 h-1 rounded-full bg-black/15 mx-auto sm:hidden" />

            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#101828]">Konfigurasi Tasbih</h2>
                <p className="text-[11.5px] text-[#525252]">
                  Atur bacaan dzikir, jumlah target, dan getaran
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowConfig(false)
                  setShowAddForm(false)
                  setShowCustomTarget(false)
                }}
                className="w-9 h-9 rounded-xl bg-black/[0.05] text-[#525252] hover:text-[#101828] flex items-center justify-center cursor-pointer transition-colors"
                aria-label="Tutup konfigurasi"
              >
                <X size={18} />
              </button>
            </div>

            {/* 1. Target Jumlah */}
            <div className="p-3.5 rounded-2xl bg-[#F7F9FF] border border-[#0F50BD]/12 space-y-2.5">
              <span className="text-xs font-bold text-[#525252] uppercase tracking-wider block">
                Target Hitungan
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
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
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-colors ${
                      target === t && !showCustomTarget
                        ? 'bg-[#0F50BD] text-white shadow-sm'
                        : 'bg-white border border-black/10 text-[#525252] hover:border-[#0F50BD]/40'
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
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-colors ${
                    !isPresetTarget || showCustomTarget
                      ? 'bg-[#0F50BD] text-white shadow-sm'
                      : 'bg-white border border-black/10 text-[#525252] hover:border-[#0F50BD]/40'
                  }`}
                >
                  {!isPresetTarget ? `Custom (${target})` : 'Custom'}
                </button>
              </div>

              {showCustomTarget && (
                <form onSubmit={handleApplyCustomTarget} className="flex items-center gap-2 pt-1">
                  <input
                    type="number"
                    min={1}
                    max={100000}
                    inputMode="numeric"
                    autoFocus
                    value={customTargetInput}
                    onChange={(e) => setCustomTargetInput(e.target.value)}
                    placeholder="Jumlah target, mis. 500"
                    aria-label="Target jumlah custom"
                    className="flex-1 px-3 py-2 rounded-xl border border-black/15 bg-white text-sm font-bold text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#0F50BD]/30"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 rounded-xl bg-[#0F50BD] text-white text-xs font-bold flex items-center gap-1 hover:bg-[#1941B5] cursor-pointer"
                  >
                    <Check size={14} strokeWidth={2.5} />
                    <span>Atur</span>
                  </button>
                </form>
              )}
            </div>

            {/* 2. Pilih / Tambah Bacaan Dzikir */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#525252] uppercase tracking-wider">
                  Bacaan Dzikir
                </span>
                {!showAddForm && (
                  <button
                    type="button"
                    onClick={() => setShowAddForm(true)}
                    className="text-xs font-bold text-[#0F50BD] flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Plus size={14} strokeWidth={2.5} />
                    <span>Tambah Custom</span>
                  </button>
                )}
              </div>

              {showAddForm ? (
                <form
                  onSubmit={handleAddCustomDhikr}
                  className="p-3.5 rounded-2xl bg-[#F7F9FF] border border-[#0F50BD]/15 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#101828]">Bacaan Dzikir Custom</span>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="p-1 rounded-lg text-[#525252] hover:bg-black/5 cursor-pointer"
                      aria-label="Batal tambah bacaan"
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
                    placeholder="Nama / bacaan latin, mis. Sholawat Nabi"
                    className="w-full px-3 py-2 rounded-xl border border-black/15 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#0F50BD]/30"
                  />

                  <input
                    type="text"
                    maxLength={120}
                    dir="auto"
                    value={newArabic}
                    onChange={(e) => setNewArabic(e.target.value)}
                    placeholder="Teks Arab (opsional)"
                    className="w-full px-3 py-2 rounded-xl border border-black/15 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#0F50BD]/30"
                  />

                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      maxLength={80}
                      value={newMeaning}
                      onChange={(e) => setNewMeaning(e.target.value)}
                      placeholder="Arti / catatan (opsional)"
                      className="col-span-2 px-3 py-2 rounded-xl border border-black/15 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#0F50BD]/30"
                    />
                    <input
                      type="number"
                      min={1}
                      max={100000}
                      inputMode="numeric"
                      value={newTarget}
                      onChange={(e) => setNewTarget(e.target.value)}
                      placeholder="Target"
                      aria-label="Target jumlah dzikir"
                      className="px-3 py-2 rounded-xl border border-black/15 bg-white text-xs font-semibold text-center focus:outline-none focus:ring-2 focus:ring-[#0F50BD]/30"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-[#0F50BD] text-white text-xs font-bold hover:bg-[#1941B5] cursor-pointer transition-colors"
                  >
                    Simpan &amp; Pakai Bacaan
                  </button>
                </form>
              ) : (
                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-0.5">
                  {allDhikr.map((item) => {
                    const isSelected = item.id === activeDhikr.id
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleSelectDhikr(item)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') handleSelectDhikr(item)
                        }}
                        className={`w-full p-2.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-[#0F50BD]/10 border-[#0F50BD]/35'
                            : 'bg-white border-black/[0.07] hover:bg-black/[0.02]'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-[#101828] truncate flex items-center gap-1.5">
                            <span>{item.latin}</span>
                            {item.isCustom && (
                              <span className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded bg-[#0F50BD]/10 text-[#0F50BD]">
                                Custom
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#525252] truncate">{item.meaning}</div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.arabic && (
                            <span className="text-sm font-bold text-[#0F50BD]">{item.arabic}</span>
                          )}
                          {item.isCustom && (
                            <button
                              type="button"
                              onClick={(e) => handleDeleteCustomDhikr(e, item.id)}
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 cursor-pointer"
                              aria-label={`Hapus ${item.latin}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* 3. Haptic Toggle & Reset */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  const next = !hapticEnabled
                  setHapticEnabled(next)
                  if (next) vibrateDevice(55)
                }}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all ${
                  hapticEnabled
                    ? 'bg-[#0F50BD]/10 text-[#0F50BD] border border-[#0F50BD]/25'
                    : 'bg-black/[0.04] text-[#525252] border border-black/[0.06]'
                }`}
                aria-pressed={hapticEnabled}
              >
                <Vibrate size={15} />
                <span>Haptic: {hapticEnabled ? 'Aktif' : 'Mati'}</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="py-2.5 px-3 rounded-xl border border-black/10 bg-white text-xs font-bold text-[#525252] hover:text-[#101828] hover:bg-black/[0.03] flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
              >
                <RotateCcw size={15} />
                <span>Reset ke 0</span>
              </button>
            </div>

            {/* Done button */}
            <button
              type="button"
              onClick={() => {
                setShowConfig(false)
                setShowAddForm(false)
                setShowCustomTarget(false)
              }}
              className="w-full py-3 rounded-full bg-[#0F50BD] text-white text-sm font-bold hover:bg-[#1941B5] shadow-[0_4px_14px_rgba(15,80,189,0.28)] active:scale-[0.98] transition-all cursor-pointer"
            >
              Lanjut Dzikir
            </button>
          </div>
        </div>
      )}
    </>
  )
}
