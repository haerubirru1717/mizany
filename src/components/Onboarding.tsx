import React, { useState, useEffect } from 'react'
import { Scale, BookOpen, Clock, ArrowRight } from 'lucide-react'

interface OnboardingProps {
  onComplete: () => void
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState(0)

  // Lock background scroll while onboarding is visible so Beranda never bleeds through
  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [])

  const slides = [
    {
      title: 'Timbang amalmu hari ini.',
      desc: 'Catat sholat lima waktu, pantau tilawah, dan jaga istiqamah ibadah harian dengan tenang.',
      icon: Scale,
    },
    {
      title: 'Target tilawah & khatam.',
      desc: 'Atur target halaman atau juz harian untuk menjaga bacaan Al-Qur’an tetap konsisten setiap hari.',
      icon: BookOpen,
    },
    {
      title: 'Jadwal sholat resmi Kemenag.',
      desc: 'Otomatis menyesuaikan 518 kota di Indonesia lengkap dengan kalender Hijriah resmi Neo MABIMS.',
      icon: Clock,
    },
  ]

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1)
    } else {
      onComplete()
    }
  }

  const SlideIcon = slides[currentSlide].icon

  return (
    <div
      className="fixed inset-0 z-50 bg-[#F4F7FB] overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Panduan awal Mizany"
    >
      <div className="min-h-full max-w-md mx-auto flex flex-col justify-between px-5 py-6 pb-[calc(24px+env(safe-area-inset-bottom))]">
        {/* Top Header */}
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#0F50BD] text-white flex items-center justify-center font-bold text-sm">
                M
              </div>
              <span className="text-lg font-extrabold text-[#101828]">Mizany</span>
            </div>
            <span className="text-xs font-semibold text-[#475467]">Timbang Amal</span>
          </div>

          {/* 3 Progress Segments */}
          <div className="flex items-center gap-2 mt-5" aria-label={`Langkah ${currentSlide + 1} dari 3`}>
            {slides.map((_, idx) => (
              <div
                key={idx}
                className={`flex-1 h-1.5 rounded-full transition-colors duration-200 ${
                  idx <= currentSlide ? 'bg-[#0F50BD]' : 'bg-[#DDE5F0]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Slide Content — quiet editorial layout (no stacked AI icon tile) */}
        <div className="my-auto py-8">
          <div className="bg-white border border-[#E2E8F0] rounded-[22px] p-6 shadow-glass text-left space-y-4">
            <div className="flex items-center gap-3">
              <SlideIcon size={24} strokeWidth={2.1} className="text-[#0F50BD] shrink-0" aria-hidden="true" />
              <h1 className="text-[22px] font-extrabold text-[#101828] leading-snug tracking-tight">
                {slides[currentSlide].title}
              </h1>
            </div>
            <p className="text-[15px] text-[#475467] leading-relaxed">
              {slides[currentSlide].desc}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-4 border-t border-[#E2E8F0]">
          <button
            type="button"
            onClick={onComplete}
            className="flex-1 min-h-[44px] py-3 px-4 rounded-xl border border-[#CBD5E1] bg-white text-xs font-bold text-[#334155] hover:bg-[#F8FAFC] cursor-pointer transition-colors"
          >
            Lewati
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="flex-1 min-h-[44px] py-3 px-5 rounded-xl bg-[#0F50BD] text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#1941B5] cursor-pointer transition-colors active:scale-[0.98]"
          >
            <span>{currentSlide === slides.length - 1 ? 'Mulai Sekarang' : 'Lanjut'}</span>
            <ArrowRight size={15} strokeWidth={2.5} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  )
}
