import React, { useState } from 'react'
import { MosqueSkyline } from './MosqueSkyline'
import { Scale, BookOpen, Clock, ArrowRight } from 'lucide-react'

interface OnboardingProps {
  onComplete: () => void
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState(0)

  const slides = [
    {
      title: 'Timbang amalmu hari ini.',
      desc: 'Mulai dengan niat. Catat ibadah harianmu, pantau tilawah, dan jaga istiqamah sepanjang tahun.',
      icon: Scale,
    },
    {
      title: 'Target tilawah & khatam.',
      desc: 'Atur target juz atau halaman per hari untuk khatam tepat waktu di bulan suci Ramadan.',
      icon: BookOpen,
    },
    {
      title: 'Jadwal sholat presisi.',
      desc: 'Metode resmi Kementerian Agama RI sesuai kotamu, dengan countdown dan pengingat waktu sholat.',
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
    <div className="fixed inset-0 z-50 bg-white flex flex-col justify-between p-6 max-w-lg mx-auto">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#0F50BD] text-white flex items-center justify-center font-bold text-sm shadow-[0_2px_8px_rgba(15,80,189,0.3)]">
              M
            </div>
            <span className="text-xl font-extrabold text-[#101828]">Mizany</span>
          </div>
          <span className="text-xs font-semibold text-[#525252]">Timbang Amal</span>
        </div>

        {/* 3 Progress Segments */}
        <div className="flex items-center gap-2 mt-6">
          {slides.map((_, idx) => (
            <div
              key={idx}
              className={`flex-1 h-1 rounded-full transition-all duration-300 ${
                idx === currentSlide ? 'bg-[#0F50BD]' : 'bg-black/[0.08]'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Slide Visual & Content */}
      <div className="my-auto py-6">
        {/* Visual Artwork Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0F50BD] to-[#1941B5] text-white p-8 rounded-[28px] shadow-[0_12px_32px_rgba(25,65,181,0.25)] flex flex-col items-center justify-center text-center min-h-[220px]">
          <div className="absolute inset-x-0 bottom-0 pointer-events-none opacity-25">
            <MosqueSkyline className="w-full h-auto" />
          </div>

          <div className="w-16 h-16 rounded-2xl bg-white/20 border border-white/30 backdrop-blur-md flex items-center justify-center text-white mb-3 shadow-sm relative z-10">
            <SlideIcon size={32} strokeWidth={2} />
          </div>

          <span className="text-xs font-bold uppercase tracking-wider text-[#8BA0F3] relative z-10">
            Langkah {currentSlide + 1} dari 3
          </span>
        </div>

        {/* Text */}
        <div className="mt-8 text-center sm:text-left">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#101828] leading-tight">
            {slides[currentSlide].title}
          </h2>
          <p className="text-sm text-[#525252] mt-3 leading-relaxed">
            {slides[currentSlide].desc}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-4 border-t border-black/[0.06]">
        <button
          type="button"
          onClick={onComplete}
          className="flex-1 py-3 px-4 rounded-full border border-black/10 text-xs font-bold text-[#525252] hover:bg-black/5 cursor-pointer transition-colors"
        >
          Lewati Intro
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="flex-1 py-3 px-6 rounded-full bg-[#0F50BD] text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#1941B5] shadow-[0_4px_14px_rgba(15,80,189,0.3)] cursor-pointer transition-all active:scale-98"
        >
          <span>{currentSlide === slides.length - 1 ? 'Mulai Sekarang' : 'Lanjut'}</span>
          <ArrowRight size={15} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  )
}
