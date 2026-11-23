import React, { useState } from 'react'
import { RotateCcw, ChevronDown } from 'lucide-react'

const DHIKR_LIST = [
  { arabic: 'سُبْحَانَ اللَّهِ', latin: 'Subhanallah', meaning: 'Maha Suci Allah' },
  { arabic: 'الْحَمْدُ لِلَّهِ', latin: 'Alhamdulillah', meaning: 'Segala Puji Bagi Allah' },
  { arabic: 'اللَّهُ أَكْبَرُ', latin: 'Allahu Akbar', meaning: 'Allah Maha Besar' },
  { arabic: 'لَا إِلَهَ إِلَّا اللَّهُ', latin: 'Laa ilaaha illallah', meaning: 'Tiada Tuhan Selain Allah' },
  { arabic: 'أَسْتَغْفِرُ اللَّهَ', latin: 'Astaghfirullah', meaning: 'Aku memohon ampun kepada Allah' },
]

export const TasbihView: React.FC = () => {
  const [count, setCount] = useState(0)
  const [target, setTarget] = useState(33)
  const [rounds, setRounds] = useState(1)
  const [selectedDhikrIndex, setSelectedDhikrIndex] = useState(0)
  const [isDhikrOpen, setIsDhikrOpen] = useState(false)

  const activeDhikr = DHIKR_LIST[selectedDhikrIndex]
  const progressPercent = Math.min(100, (count / target) * 100)

  // Circular stroke calculation
  const radius = 96
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference

  const handleTap = () => {
    const nextCount = count + 1
    if (nextCount >= target) {
      setCount(0)
      setRounds(rounds + 1)
      if (navigator.vibrate) {
        navigator.vibrate([40, 60, 40])
      }
    } else {
      setCount(nextCount)
      if (navigator.vibrate) {
        navigator.vibrate(20)
      }
    }
  }

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCount(0)
    setRounds(1)
  }

  return (
    <div className="space-y-4 pb-24 text-center">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-[#101828]">Tasbih Digital</h1>
        <p className="text-xs text-[#525252] mt-0.5">Dzikir penenang hati & penjaga lisan</p>
      </div>

      {/* Selector Lafadz Dzikir */}
      <div className="relative max-w-sm mx-auto">
        <button
          type="button"
          onClick={() => setIsDhikrOpen(!isDhikrOpen)}
          className="w-full glass-card p-4 flex items-center justify-between text-left cursor-pointer hover:bg-white transition-all shadow-sm"
        >
          <div>
            <div className="text-base font-bold text-[#0F50BD] font-arabic">{activeDhikr.arabic}</div>
            <div className="text-xs font-semibold text-[#101828] mt-0.5">{activeDhikr.latin}</div>
            <div className="text-[11px] text-[#525252]">{activeDhikr.meaning}</div>
          </div>
          <ChevronDown size={18} className="text-[#0F50BD] shrink-0" />
        </button>

        {/* Dropdown Options */}
        {isDhikrOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 z-30 glass-card p-2 shadow-floating space-y-1 bg-white/95 backdrop-blur-xl">
            {DHIKR_LIST.map((item, idx) => (
              <button
                key={item.latin}
                type="button"
                onClick={() => {
                  setSelectedDhikrIndex(idx)
                  setCount(0)
                  setIsDhikrOpen(false)
                }}
                className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between cursor-pointer transition-colors ${
                  idx === selectedDhikrIndex ? 'bg-[#0F50BD]/10 text-[#0F50BD]' : 'hover:bg-black/5'
                }`}
              >
                <div>
                  <div className="text-sm font-bold text-[#101828]">{item.latin}</div>
                  <div className="text-[11px] text-[#525252]">{item.meaning}</div>
                </div>
                <span className="text-sm font-arabic font-bold text-[#0F50BD]">{item.arabic}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Target & Round pills */}
      <div className="flex items-center justify-center gap-3">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/[0.04] text-xs font-semibold text-[#525252]">
          <span>Target:</span>
          {[33, 100].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setTarget(t)
                setCount(0)
              }}
              className={`px-2 py-0.5 rounded-full cursor-pointer transition-colors ${
                target === t ? 'bg-[#0F50BD] text-white font-bold' : 'hover:text-[#101828]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="px-3 py-1.5 rounded-full bg-blue-50 text-xs font-bold text-[#0F50BD]">
          Putaran ke-{rounds}
        </div>
      </div>

      {/* Main Interactive Tap Circle */}
      <div className="py-4 flex justify-center">
        <button
          type="button"
          onClick={handleTap}
          className="relative w-64 h-64 rounded-full flex items-center justify-center cursor-pointer active:scale-95 transition-transform select-none focus:outline-none"
          aria-label="Hitung dzikir"
        >
          {/* SVG Circular Progress Track */}
          <svg className="w-full h-full -rotate-90 drop-shadow-md" viewBox="0 0 240 240">
            {/* Background ring */}
            <circle
              cx="120"
              cy="120"
              r={radius}
              stroke="rgba(16, 24, 40, 0.08)"
              strokeWidth="12"
              fill="rgba(255, 255, 255, 0.85)"
            />
            {/* Active ring */}
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
        </button>
      </div>

      {/* Reset button */}
      <div>
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full glass-card text-xs font-semibold text-[#525252] hover:text-[#101828] cursor-pointer active:scale-95 transition-all shadow-sm"
        >
          <RotateCcw size={14} />
          <span>Mulai dari 0</span>
        </button>
      </div>
    </div>
  )
}
