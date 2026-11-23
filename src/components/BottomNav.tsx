import React from 'react'
import { TabKey } from '../types'
import { Home, BookOpen, Calendar, Settings } from 'lucide-react'

interface BottomNavProps {
  activeTab: TabKey
  onSelectTab: (tab: TabKey) => void
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab }) => {
  const tabs = [
    { key: 'beranda' as TabKey, label: 'Home', icon: Home },
    { key: 'quran' as TabKey, label: 'Quran', icon: BookOpen },
    { key: 'kalender' as TabKey, label: 'Kalender', icon: Calendar },
    { key: 'atur' as TabKey, label: 'Atur', icon: Settings },
  ]

  return (
    <nav
      className="fixed left-1/2 -translate-x-1/2 bottom-[calc(16px+env(safe-area-inset-bottom))] z-40 flex items-center gap-1.5 p-1.5 bg-white/95 backdrop-blur-[18px] border border-white/90 rounded-full shadow-floating max-w-[92vw]"
      aria-label="Navigasi utama"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.key
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onSelectTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-[13.5px] font-semibold transition-all duration-200 cursor-pointer ${
              isActive
                ? 'bg-[#0F50BD] text-white shadow-[0_4px_12px_rgba(15,80,189,0.32)] scale-[1.02]'
                : 'text-[#525252] hover:text-[#101828] hover:bg-black/[0.03]'
            }`}
          >
            <Icon size={19} strokeWidth={2} />
            {isActive && <span>{tab.label}</span>}
          </button>
        )
      })}
    </nav>
  )
}
