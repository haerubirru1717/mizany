import React from 'react'
import { TabKey } from '../types'
import { Home, BookOpen, Calendar, Settings } from 'lucide-react'

interface BottomNavProps {
  activeTab: TabKey
  onSelectTab: (tab: TabKey) => void
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab }) => {
  const tabs = [
    { key: 'beranda' as TabKey, label: 'Beranda', icon: Home },
    { key: 'quran' as TabKey, label: "Qur'an", icon: BookOpen },
    { key: 'kalender' as TabKey, label: 'Kalender', icon: Calendar },
    { key: 'atur' as TabKey, label: 'Atur', icon: Settings },
  ]

  return (
    <nav
      className="fixed left-1/2 -translate-x-1/2 bottom-[calc(16px+env(safe-area-inset-bottom))] z-40 flex items-center gap-1.5 p-1.5 bg-white/95 backdrop-blur-md border border-[#E2E8F0] rounded-full shadow-floating max-w-[94vw]"
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
            aria-current={isActive ? 'page' : undefined}
            aria-label={tab.label}
            className={`group relative flex items-center justify-center min-h-[44px] py-2.5 px-3.5 sm:px-4 rounded-full text-[13px] font-semibold transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] cursor-pointer active:scale-95 select-none ${
              isActive
                ? 'bg-[#0F50BD] text-white shadow-[0_4px_16px_rgba(15,80,189,0.34)]'
                : 'text-[#475467] hover:text-[#101828] hover:bg-[#F1F5F9]'
            }`}
          >
            <div className="flex items-center">
              <Icon
                size={19}
                strokeWidth={isActive ? 2.4 : 1.9}
                aria-hidden="true"
                className={`transition-transform duration-300 ease-out ${
                  isActive ? 'scale-105' : 'group-hover:scale-110'
                }`}
              />
              <span
                className={`transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] whitespace-nowrap overflow-hidden leading-none ${
                  isActive
                    ? 'max-w-[78px] opacity-100 ml-2 font-bold'
                    : 'max-w-0 opacity-0 ml-0 pointer-events-none'
                }`}
              >
                {tab.label}
              </span>
            </div>
          </button>
        )
      })}
    </nav>
  )
}
