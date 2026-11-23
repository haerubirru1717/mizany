import React from 'react'
import { AmalItem } from '../types'
import { MapPin, Plus, Trash2, Minus, Info, Pencil } from 'lucide-react'

interface AturViewProps {
  city: string
  onChangeCity: (newCity: string) => void
  tilawahTarget: number
  onChangeTilawahTarget: (newTarget: number) => void
  customAmalItems: AmalItem[]
  onOpenAddAmal: () => void
  onEditAmal: (item: AmalItem) => void
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

function formatAmalSubtitle(item: AmalItem): string {
  if (item.type === 'target') {
    return `Target: ${item.target || 1}${item.unit ? ` ${item.unit}` : ''}`
  }
  if (item.type === 'counter') {
    return item.unit ? `Hitungan (${item.unit})` : 'Hitungan'
  }
  if (item.type === 'amount') {
    return 'Nominal (Rp)'
  }
  return 'Ceklist'
}

export const AturView: React.FC<AturViewProps> = ({
  city,
  onChangeCity,
  tilawahTarget,
  onChangeTilawahTarget,
  customAmalItems,
  onOpenAddAmal,
  onEditAmal,
  onDeleteCustomAmal,
  onReplayOnboarding,
}) => {
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
          Jadwal otomatis disesuaikan dengan data resmi Bimas Islam Kementerian Agama RI.
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

        {customAmalItems.length > 0 ? (
          <div className="space-y-2 mb-3.5">
            {customAmalItems.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-white border border-black/[0.06] flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="text-sm font-bold text-[#101828] truncate">{item.name}</div>
                  <div className="text-[11px] text-[#525252]">{formatAmalSubtitle(item)}</div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => onEditAmal(item)}
                    className="w-8 h-8 rounded-lg text-[#0F50BD] hover:bg-[#0F50BD]/10 flex items-center justify-center cursor-pointer transition-colors"
                    aria-label={`Edit ${item.name}`}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteCustomAmal(item.id)}
                    className="w-8 h-8 rounded-lg text-red-500 hover:bg-red-50 flex items-center justify-center cursor-pointer transition-colors"
                    aria-label={`Hapus ${item.name}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#525252] mb-3.5">
            Secara default hanya amalan wajib Sholat 5 waktu (dan Puasa saat Ramadan). Tambahkan amal harianmu di bawah.
          </p>
        )}

        <button
          type="button"
          onClick={onOpenAddAmal}
          className="w-full py-2.5 px-4 rounded-full bg-[#0F50BD] text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-[#1941B5] transition-colors cursor-pointer shadow-sm"
        >
          <Plus size={15} strokeWidth={2.5} />
          <span>Tambah Amal Baru</span>
        </button>
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
