import React from 'react'
import { TabKey } from '../types'
import { Home, BookOpen, Calendar, Settings, CircleDot } from 'lucide-react'

interface BottomNavProps {
  activeTab: TabKey
  onSelectTab: (tab: TabKey) => void
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab }) => {
  const tabs = [
    { key: 'beranda' as TabKey, label: 'Beranda', icon: Home },
    { key: 'quran' as TabKey, label: "Qur'an", icon: BookOpen },
    { key: 'tasbih' as TabKey, label: 'Tasbih', icon: CircleDot },
    { key: 'kalender' as TabKey, label: 'Kalender', icon: Calendar },
    { key: 'atur' as TabKey, label: 'Atur', icon: Settings },
  ]

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(10px+env(safe-area-inset-bottom))] pt-2 pointer-events-none"
      aria-label="Navigasi utama"
    >
      <div className="pointer-events-auto max-w-md mx-auto grid grid-cols-5 items-center bg-white border border-[#E2E8F0] rounded-2xl p-1 shadow-floating">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onSelectTab(tab.key)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-col items-center justify-center gap-1 min-h-[48px] py-1.5 px-1 rounded-xl transition-colors cursor-pointer active:scale-95 select-none ${
                isActive
                  ? 'bg-[#EFF6FF] text-[#0F50BD]'
                  : 'text-[#475467] hover:text-[#101828] hover:bg-[#F8FAFC]'
              }`}
            >
              <Icon size={19} strokeWidth={isActive ? 2.3 : 1.85} aria-hidden="true" />
              <span
                className={`text-[11px] leading-none ${
                  isActive ? 'font-bold text-[#0F50BD]' : 'font-medium text-[#475467]'
                }`}
              >
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
