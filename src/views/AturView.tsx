import React, { useState } from 'react'
import { AmalItem, AmalType } from '../types'
import { MapPin, Plus, Trash2, Minus, Info, Sparkles } from 'lucide-react'

interface AturViewProps {
  city: string
  onChangeCity: (newCity: string) => void
  tilawahTarget: number
  onChangeTilawahTarget: (newTarget: number) => void
  customAmalItems: AmalItem[]
  onAddCustomAmal: (item: Omit<AmalItem, 'id'>) => void
  onDeleteCustomAmal: (id: string) => void
  onReplayOnboarding: () => void
}

const CITIES = [
  'Kota Tangerang',
  'Jakarta',
  'Bogor',
  'Depok',
  'Bekasi',
  'Bandung',
  'Semarang',
  'Yogyakarta',
  'Surabaya',
  'Medan',
  'Makassar',
]

export const AturView: React.FC<AturViewProps> = ({
  city,
  onChangeCity,
  tilawahTarget,
  onChangeTilawahTarget,
  customAmalItems,
  onAddCustomAmal,
  onDeleteCustomAmal,
  onReplayOnboarding,
}) => {
  const [newAmalName, setNewAmalName] = useState('')
  const [newAmalType, setNewAmalType] = useState<AmalType>('checklist')
  const [newAmalTarget, setNewAmalTarget] = useState(20)

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAmalName.trim()) return

    onAddCustomAmal({
      name: newAmalName.trim(),
      type: newAmalType,
      target: newAmalType === 'target' ? newAmalTarget : undefined,
      unit: newAmalType === 'target' ? 'kali' : undefined,
      icon: 'star',
      isCustom: true,
      done: false,
      value: 0,
    })

    setNewAmalName('')
  }

  return (
    <div className="space-y-5 pb-24">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-[#101828]">Pengaturan</h1>
        <p className="text-xs text-[#525252] mt-0.5">Sesuaikan Mizany dengan kebiasaan ibadahmu</p>
      </div>

      {/* 1. Pilih Kota */}
      <div className="glass-card p-4 sm:p-5">
        <label htmlFor="city-select" className="text-xs font-bold text-[#525252] uppercase tracking-wider block mb-2">
          Kota untuk Jadwal Sholat
        </label>
        <div className="relative">
          <select
            id="city-select"
            value={city}
            onChange={(e) => onChangeCity(e.target.value)}
            className="w-full p-3.5 pl-10 rounded-xl border border-black/10 bg-white text-[#101828] text-sm font-semibold appearance-none focus:outline-none focus:ring-2 focus:ring-[#0F50BD]/30 cursor-pointer shadow-sm"
          >
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <MapPin size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#0F50BD] pointer-events-none" />
        </div>
        <p className="text-[11px] text-[#525252] mt-1.5">
          Jadwal otomatis disesuaikan dengan metode resmi Kementerian Agama RI.
        </p>
      </div>

      {/* 2. Target Tilawah Harian */}
      <div className="glass-card p-4 sm:p-5">
        <label className="text-xs font-bold text-[#525252] uppercase tracking-wider block mb-2">
          Target Tilawah Harian
        </label>
        <div className="flex items-center justify-between p-2 rounded-xl bg-black/[0.03]">
          <button
            type="button"
            onClick={() => onChangeTilawahTarget(Math.max(1, tilawahTarget - 1))}
            className="w-10 h-10 rounded-lg bg-white border border-black/10 flex items-center justify-center text-[#525252] hover:text-[#101828] active:scale-95 shadow-sm cursor-pointer"
            aria-label="Kurangi target"
          >
            <Minus size={18} strokeWidth={2.5} />
          </button>

          <div className="text-center">
            <span className="text-2xl font-extrabold text-[#0F50BD]">{tilawahTarget}</span>
            <span className="text-xs text-[#525252] block font-medium">halaman per hari</span>
          </div>

          <button
            type="button"
            onClick={() => onChangeTilawahTarget(tilawahTarget + 1)}
            className="w-10 h-10 rounded-lg bg-[#0F50BD] text-white flex items-center justify-center active:scale-95 shadow-sm cursor-pointer hover:bg-[#1941B5]"
            aria-label="Tambah target"
          >
            <Plus size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* 3. Kelola Amal Tambahan Saya */}
      <div className="glass-card p-4 sm:p-5">
        <h3 className="text-xs font-bold text-[#525252] uppercase tracking-wider mb-3">
          Amal Tambahan Saya
        </h3>

        {/* Existing Custom Items */}
        {customAmalItems.length > 0 ? (
          <div className="space-y-2 mb-4">
            {customAmalItems.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-white border border-black/[0.06] flex items-center justify-between"
              >
                <div>
                  <div className="text-sm font-bold text-[#101828]">{item.name}</div>
                  <div className="text-[11px] text-[#525252] capitalize">Tipe: {item.type}</div>
                </div>
                <button
                  type="button"
                  onClick={() => onDeleteCustomAmal(item.id)}
                  className="w-8 h-8 rounded-lg text-red-500 hover:bg-red-50 flex items-center justify-center cursor-pointer transition-colors"
                  aria-label={`Hapus ${item.name}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#525252] mb-3">Belum ada amal kustom yang ditambahkan.</p>
        )}

        {/* Form Tambah Amal */}
        <form onSubmit={handleAddSubmit} className="space-y-2.5 pt-2 border-t border-black/[0.06]">
          <input
            type="text"
            value={newAmalName}
            onChange={(e) => setNewAmalName(e.target.value)}
            placeholder="Nama amal, mis. Sholat Dhuha"
            maxLength={40}
            className="w-full p-3 rounded-xl border border-black/10 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0F50BD]/30"
          />

          <div className="grid grid-cols-2 gap-2">
            <select
              value={newAmalType}
              onChange={(e) => setNewAmalType(e.target.value as AmalType)}
              className="p-2.5 rounded-xl border border-black/10 bg-white text-xs font-semibold focus:outline-none"
            >
              <option value="checklist">Ceklist (Ya/Tidak)</option>
              <option value="counter">Counter (Hitungan)</option>
              <option value="target">Target Nilai</option>
              <option value="amount">Nominal Uang</option>
            </select>

            {newAmalType === 'target' ? (
              <input
                type="number"
                min="1"
                value={newAmalTarget}
                onChange={(e) => setNewAmalTarget(Number(e.target.value))}
                className="p-2.5 rounded-xl border border-black/10 bg-white text-xs font-semibold focus:outline-none"
                placeholder="Target nilai"
              />
            ) : (
              <button
                type="submit"
                className="py-2.5 px-4 rounded-xl bg-[#0F50BD] text-white text-xs font-bold hover:bg-[#1941B5] transition-colors cursor-pointer shadow-sm"
              >
                + Tambah
              </button>
            )}
          </div>

          {newAmalType === 'target' && (
            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-[#0F50BD] text-white text-xs font-bold hover:bg-[#1941B5] transition-colors cursor-pointer shadow-sm"
            >
              + Tambah Amal Target
            </button>
          )}
        </form>
      </div>

      {/* 4. Disclaimer Kejujuran (Kunci Desain & Spesifikasi) */}
      <div className="glass-card p-4 sm:p-5 border-blue-200/60 bg-blue-50/30">
        <div className="flex items-start gap-2.5">
          <Info size={19} className="text-[#0F50BD] shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-[#101828]">Tentang Streak & Skor</h3>
            <p className="text-xs text-[#525252] mt-1.5 leading-relaxed">
              Streak dan skor di Mizany <b>hanya alat bantu menjaga konsistensi</b> — bukan ukuran nilai amal, apalagi tanda diterimanya amal di sisi Allah. Hari yang terlewat bukan kegagalan; yang terpenting adalah niat, keikhlasan, dan kemauan untuk mulai lagi.
            </p>
          </div>
        </div>
      </div>

      {/* 5. Replay Onboarding */}
      <div className="text-center pt-2">
        <button
          type="button"
          onClick={onReplayOnboarding}
          className="text-xs font-bold text-[#0F50BD] hover:underline cursor-pointer"
        >
          Lihat kembali intro aplikasi (Onboarding)
        </button>
      </div>

      <p className="text-[11px] text-center text-[#525252]/70 pt-2">
        Mizany — Timbang Amal Harian · Selalu gratis, tanpa iklan
      </p>
    </div>
  )
}
