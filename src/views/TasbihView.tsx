import React, { useState, useEffect, useRef } from 'react'
import { RotateCcw, ChevronDown, Plus, Trash2, Vibrate, Check, X } from 'lucide-react'

interface DhikrItem {
  id: string
  arabic: string
  latin: string
  meaning: string
  defaultTarget?: number
  isCustom?: boolean
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

const IS_IOS =
  typeof navigator !== 'undefined' &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))

function vibrateDevice(pattern: number | number[]) {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(pattern)
    } catch {}
  }
}

export const TasbihView: React.FC = () => {
  const [customDhikr, setCustomDhikr] = useState<DhikrItem[]>([])
  const [selectedId, setSelectedId] = useState<string>('subhanallah')
  const [count, setCount] = useState<number>(0)
  const [target, setTarget] = useState<number>(33)
  const [rounds, setRounds] = useState<number>(1)
  const [hapticEnabled, setHapticEnabled] = useState<boolean>(true)
  const [isDhikrOpen, setIsDhikrOpen] = useState<boolean>(false)
  const [showAddForm, setShowAddForm] = useState<boolean>(false)
  const [showCustomTarget, setShowCustomTarget] = useState<boolean>(false)
  const [customTargetInput, setCustomTargetInput] = useState<string>('33')
  const [tapPulseKey, setTapPulseKey] = useState<number>(0)
  const [isPressed, setIsPressed] = useState<boolean>(false)

  // Add custom dhikr form fields
  const [newLatin, setNewLatin] = useState('')
  const [newArabic, setNewArabic] = useState('')
  const [newMeaning, setNewMeaning] = useState('')
  const [newTarget, setNewTarget] = useState('33')

  const tapBtnRef = useRef<HTMLButtonElement | null>(null)
  const hapticStateRef = useRef({ hapticEnabled: true, isNextMilestone: false })
  const vibratedOnPointerRef = useRef(false)

  hapticStateRef.current = {
    hapticEnabled,
    isNextMilestone: count + 1 >= target,
  }

  // Attach raw native pointerdown listener for zero-latency trusted Vibration API firing on Android Chrome
  useEffect(() => {
    if (IS_IOS) return
    const btn = tapBtnRef.current
    if (!btn) return

    const onNativePointerDown = () => {
      if (!hapticStateRef.current.hapticEnabled) return
      vibratedOnPointerRef.current = true
      vibrateDevice(hapticStateRef.current.isNextMilestone ? [80, 50, 140] : 55)
    }

    btn.addEventListener('pointerdown', onNativePointerDown, { passive: true })
    return () => {
      btn.removeEventListener('pointerdown', onNativePointerDown)
    }
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

  const triggerHaptic = (isMilestone: boolean) => {
    if (!hapticEnabled) return
    vibrateDevice(isMilestone ? [80, 50, 140] : 55)
  }

  const handleTap = () => {
    setTapPulseKey((k) => k + 1)
    const nextCount = count + 1
    const isMilestone = nextCount >= target
    if (isMilestone) {
      setCount(0)
      setRounds((r) => r + 1)
    } else {
      setCount(nextCount)
    }

    if (vibratedOnPointerRef.current) {
      vibratedOnPointerRef.current = false
    } else {
      triggerHaptic(isMilestone)
    }
  }

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCount(0)
    setRounds(1)
    triggerHaptic(false)
  }

  const handleSelectDhikr = (item: DhikrItem) => {
    setSelectedId(item.id)
    setCount(0)
    setRounds(1)
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
    <div className="space-y-4 pb-24 text-center">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-[#101828]">Tasbih Digital</h1>
        <p className="text-xs text-[#525252] mt-0.5">Dzikir penenang hati & penjaga lisan</p>
      </div>

      {/* Selector Lafadz Dzikir (Default + Custom) */}
      <div className="relative max-w-sm mx-auto">
        <button
          type="button"
          onClick={() => {
            setIsDhikrOpen(!isDhikrOpen)
            setShowAddForm(false)
          }}
          className="w-full glass-card p-4 flex items-center justify-between text-left cursor-pointer hover:bg-white transition-all shadow-sm"
        >
          <div className="min-w-0 pr-2">
            {activeDhikr.arabic && (
              <div className="text-base font-bold text-[#0F50BD] leading-snug">
                {activeDhikr.arabic}
              </div>
            )}
            <div className="text-xs font-semibold text-[#101828] mt-0.5 truncate">
              {activeDhikr.latin}
            </div>
            <div className="text-[11px] text-[#525252] truncate">{activeDhikr.meaning}</div>
          </div>
          <ChevronDown
            size={18}
            className={`text-[#0F50BD] shrink-0 transition-transform duration-200 ${
              isDhikrOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Dropdown Options + Add Custom Dhikr */}
        {isDhikrOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 z-30 glass-card p-2.5 shadow-floating space-y-1 bg-white/95 backdrop-blur-xl text-left max-h-[360px] overflow-y-auto">
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
                        ? 'bg-[#0F50BD]/10 text-[#0F50BD]'
                        : 'hover:bg-black/5'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-[#101828] truncate flex items-center gap-1.5">
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
                ))}

                <button
                  type="button"
                  onClick={() => setShowAddForm(true)}
                  className="w-full mt-1.5 py-2.5 px-3 rounded-xl border border-dashed border-[#0F50BD]/35 text-[#0F50BD] text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-blue-50/60 cursor-pointer transition-colors"
                >
                  <Plus size={15} strokeWidth={2.5} />
                  <span>Tambah Bacaan Custom</span>
                </button>
              </>
            ) : (
              <form onSubmit={handleAddCustomDhikr} className="p-1.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#101828]">Bacaan Dzikir Custom</span>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="p-1 rounded-lg text-[#525252] hover:bg-black/5 cursor-pointer"
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
                  placeholder="Nama / bacaan latin, mis. Sholawat Nabi"
                  className="w-full px-3 py-2 rounded-xl border border-black/10 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#0F50BD]/30"
                />

                <input
                  type="text"
                  maxLength={120}
                  dir="auto"
                  value={newArabic}
                  onChange={(e) => setNewArabic(e.target.value)}
                  placeholder="Teks Arab (opsional)"
                  className="w-full px-3 py-2 rounded-xl border border-black/10 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#0F50BD]/30"
                />

                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    maxLength={80}
                    value={newMeaning}
                    onChange={(e) => setNewMeaning(e.target.value)}
                    placeholder="Arti / catatan (opsional)"
                    className="col-span-2 px-3 py-2 rounded-xl border border-black/10 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#0F50BD]/30"
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
                    className="px-3 py-2 rounded-xl border border-black/10 bg-white text-xs font-semibold text-center focus:outline-none focus:ring-2 focus:ring-[#0F50BD]/30"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-[#0F50BD] text-white text-xs font-bold hover:bg-[#1941B5] cursor-pointer transition-colors"
                >
                  Simpan & Pakai Bacaan
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Target Jumlah (Preset + Custom) & Round pills */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-black/[0.04] text-xs font-semibold text-[#525252]">
          <span className="pr-0.5">Target:</span>
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
              className={`px-2 py-0.5 rounded-full cursor-pointer transition-colors ${
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
              setShowCustomTarget(!showCustomTarget)
            }}
            className={`px-2.5 py-0.5 rounded-full cursor-pointer transition-colors ${
              !isPresetTarget || showCustomTarget
                ? 'bg-[#0F50BD] text-white font-bold'
                : 'hover:text-[#101828]'
            }`}
          >
            {!isPresetTarget ? `${target}` : 'Custom'}
          </button>
        </div>

        <div className="px-3 py-1.5 rounded-full bg-blue-50 text-xs font-bold text-[#0F50BD]">
          Putaran ke-{rounds}
        </div>
      </div>

      {/* Custom Target Inline Input */}
      {showCustomTarget && (
        <form
          onSubmit={handleApplyCustomTarget}
          className="max-w-xs mx-auto glass-card p-2.5 flex items-center gap-2"
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
            aria-label="Target jumlah custom"
            className="flex-1 px-3 py-1.5 rounded-xl border border-black/10 bg-white text-sm font-bold text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#0F50BD]/30"
          />
          <button
            type="submit"
            className="px-3 py-1.5 rounded-xl bg-[#0F50BD] text-white text-xs font-bold flex items-center gap-1 hover:bg-[#1941B5] cursor-pointer"
          >
            <Check size={14} strokeWidth={2.5} />
            <span>Atur</span>
          </button>
        </form>
      )}

      {/* Main Interactive Tap Circle — native button + pointerdown vibrate on Android, switch overlay on iOS */}
      <div className="py-3 flex justify-center">
        <div
          className={`relative w-64 h-64 rounded-full overflow-hidden flex items-center justify-center transition-transform duration-100 select-none touch-manipulation ${
            isPressed ? 'scale-[0.94]' : ''
          }`}
        >
          {/* Direct physical tap target covering the circular area */}
          {IS_IOS && hapticEnabled ? (
            <input
              ref={(el) => {
                if (el) el.setAttribute('switch', '')
              }}
              type="checkbox"
              {...({ switch: '' } as React.InputHTMLAttributes<HTMLInputElement>)}
              onChange={handleTap}
              onPointerDown={() => setIsPressed(true)}
              onPointerUp={() => setIsPressed(false)}
              onPointerCancel={() => setIsPressed(false)}
              onPointerLeave={() => setIsPressed(false)}
              aria-label={`Hitung dzikir ${activeDhikr.latin}, saat ini ${count} dari ${target}`}
              className="absolute inset-0 z-20 w-full h-full m-0 opacity-0 cursor-pointer touch-manipulation"
              style={{ appearance: 'auto', WebkitAppearance: 'auto' as any }}
            />
          ) : (
            <button
              ref={tapBtnRef}
              type="button"
              onClick={handleTap}
              onPointerDown={() => setIsPressed(true)}
              onPointerUp={() => setIsPressed(false)}
              onPointerCancel={() => setIsPressed(false)}
              onPointerLeave={() => setIsPressed(false)}
              aria-label={`Hitung dzikir ${activeDhikr.latin}, saat ini ${count} dari ${target}`}
              className="absolute inset-0 z-20 w-full h-full m-0 opacity-0 cursor-pointer touch-manipulation"
            />
          )}

          {/* Tactile visual ripple on tap */}
          {tapPulseKey > 0 && (
            <span
              key={tapPulseKey}
              className="pointer-events-none absolute inset-4 rounded-full border-2 border-[#0F50BD]/35 animate-ping"
              style={{ animationIterationCount: 1, animationDuration: '320ms' }}
            />
          )}

          {/* SVG Circular Progress Track */}
          <svg className="w-full h-full -rotate-90 drop-shadow-md pointer-events-none" viewBox="0 0 240 240">
            <circle
              cx="120"
              cy="120"
              r={radius}
              stroke="rgba(16, 24, 40, 0.08)"
              strokeWidth="12"
              fill="rgba(255, 255, 255, 0.88)"
            />
            <circle
              cx="120"
              cy="120"
              r={radius}
              stroke="#0F50BD"
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-150 ease-out"
            />
          </svg>

          {/* Central count display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-5xl font-black text-[#0F50BD] tracking-tight">{count}</span>
            <span className="text-xs font-bold text-[#525252] mt-1">/ {target}</span>
            <span className="text-[10px] text-[#0F50BD] font-semibold mt-2 px-2.5 py-0.5 rounded-full bg-[#0F50BD]/10">
              Ketuk untuk hitung
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Controls: Haptic Toggle & Reset */}
      <div className="flex items-center justify-center gap-2.5">
        <button
          type="button"
          onClick={() => {
            const next = !hapticEnabled
            setHapticEnabled(next)
            if (next) vibrateDevice(60)
          }}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold cursor-pointer active:scale-95 transition-all shadow-sm touch-manipulation ${
            hapticEnabled
              ? 'bg-[#0F50BD]/10 text-[#0F50BD] border border-[#0F50BD]/20'
              : 'glass-card text-[#525252]'
          }`}
          aria-pressed={hapticEnabled}
        >
          <Vibrate size={14} />
          <span>Haptic: {hapticEnabled ? 'Aktif' : 'Mati'}</span>
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full glass-card text-xs font-semibold text-[#525252] hover:text-[#101828] cursor-pointer active:scale-95 transition-all shadow-sm touch-manipulation"
        >
          <RotateCcw size={14} />
          <span>Mulai dari 0</span>
        </button>
      </div>
    </div>
  )
}
