import React, { useState, useEffect } from 'react'
import { MosqueSkyline } from './MosqueSkyline'
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
      desc: 'Catat sholat lima waktu, pantau tilawah harian, dan jaga istiqamah ibadahmu sepanjang tahun.',
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
      className="fixed inset-0 z-50 bg-white overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Panduan awal Mizany"
    >
      <div className="min-h-full max-w-md mx-auto flex flex-col justify-between p-6 pb-[calc(24px+env(safe-area-inset-bottom))]">
        {/* Top Header */}
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#0F50BD] text-white flex items-center justify-center font-bold text-sm shadow-[0_2px_8px_rgba(15,80,189,0.28)]">
                M
              </div>
              <span className="text-xl font-extrabold text-[#101828]">Mizany</span>
            </div>
            <span className="text-xs font-semibold text-[#475467]">Timbang Amal</span>
          </div>

          {/* 3 Progress Segments */}
          <div className="flex items-center gap-2 mt-6" aria-label={`Langkah ${currentSlide + 1} dari 3`}>
            {slides.map((_, idx) => (
              <div
                key={idx}
                className={`flex-1 h-1.5 rounded-full transition-colors duration-300 ${
                  idx <= currentSlide ? 'bg-[#0F50BD]' : 'bg-[#E2E8F0]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Rich Blue Visual Hero + Editorial Copy */}
        <div className="my-auto py-6">
          <div className="relative overflow-hidden bg-gradient-to-br from-[#0F50BD] to-[#1941B5] text-white p-8 rounded-[28px] shadow-[0_12px_32px_rgba(25,65,181,0.24)] flex flex-col items-center justify-center text-center min-h-[216px]">
            <div className="absolute inset-x-0 bottom-0 pointer-events-none opacity-25">
              <MosqueSkyline className="w-full h-auto" />
            </div>

            <div className="w-16 h-16 rounded-2xl bg-white/20 border border-white/30 backdrop-blur-sm flex items-center justify-center text-white mb-3 relative z-10">
              <SlideIcon size={32} strokeWidth={2} aria-hidden="true" />
            </div>

            <span className="text-xs font-bold text-[#DBEAFE] relative z-10">
              Langkah {currentSlide + 1} dari 3
            </span>
          </div>

          <div className="mt-8 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#101828] leading-tight">
              {slides[currentSlide].title}
            </h1>
            <p className="text-sm text-[#475467] mt-3 leading-relaxed">
              {slides[currentSlide].desc}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-4 border-t border-[#EEF2F6]">
          <button
            type="button"
            onClick={onComplete}
            className="flex-1 min-h-[44px] py-3 px-4 rounded-full border border-[#CBD5E1] text-xs font-bold text-[#334155] hover:bg-[#F8FAFC] cursor-pointer transition-colors"
          >
            Lewati
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="flex-1 min-h-[44px] py-3 px-6 rounded-full bg-[#0F50BD] text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#1941B5] shadow-[0_4px_14px_rgba(15,80,189,0.28)] cursor-pointer transition-all active:scale-[0.98]"
          >
            <span>{currentSlide === slides.length - 1 ? 'Mulai Sekarang' : 'Lanjut'}</span>
            <ArrowRight size={15} strokeWidth={2.5} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  )
}
