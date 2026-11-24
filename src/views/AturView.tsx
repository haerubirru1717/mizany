import React, { useState, useEffect, useMemo } from 'react'
import { AmalItem } from '../types'
import {
  fetchAllIndonesianCities,
  IndonesianCityOption,
} from '../services/prayerService'
import {
  MapPin,
  Plus,
  Trash2,
  Minus,
  Info,
  Pencil,
  LocateFixed,
  Search,
  Check,
  Loader2,
  Download,
  Smartphone,
} from 'lucide-react'

interface AturViewProps {
  city: string
  cityMode: 'auto' | 'manual'
  isLocatingCity: boolean
  locationMessage: string | null
  locationError: string | null
  onDetectLocation: () => void
  onChangeCity: (newCity: string) => void
  tilawahTarget: number
  onChangeTilawahTarget: (newTarget: number) => void
  customAmalItems: AmalItem[]
  onOpenAddAmal: () => void
  onEditAmal: (item: AmalItem) => void
  onDeleteCustomAmal: (id: string) => void
  onReplayOnboarding: () => void
  canInstallPwa: boolean
  isPwaInstalled: boolean
  onInstallPwa: () => void
}

const POPULAR_CITIES: IndonesianCityOption[] = [
  { id: '1108', lokasi: 'KOTA TANGERANG', label: 'Kota Tangerang' },
  { id: '1301', lokasi: 'KOTA JAKARTA', label: 'Kota Jakarta' },
  { id: '1221', lokasi: 'KOTA BANDUNG', label: 'Kota Bandung' },
  { id: '1638', lokasi: 'KOTA SURABAYA', label: 'Kota Surabaya' },
  { id: '1433', lokasi: 'KOTA SEMARANG', label: 'Kota Semarang' },
  { id: '1505', lokasi: 'KOTA YOGYAKARTA', label: 'Kota Yogyakarta' },
  { id: '0228', lokasi: 'KOTA MEDAN', label: 'Kota Medan' },
  { id: '2622', lokasi: 'KOTA MAKASSAR', label: 'Kota Makassar' },
  { id: '1709', lokasi: 'KOTA DENPASAR', label: 'Kota Denpasar' },
  { id: '3329', lokasi: 'KOTA JAYAPURA', label: 'Kota Jayapura' },
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
  cityMode,
  isLocatingCity,
  locationMessage,
  locationError,
  onDetectLocation,
  onChangeCity,
  tilawahTarget,
  onChangeTilawahTarget,
  customAmalItems,
  onOpenAddAmal,
  onEditAmal,
  onDeleteCustomAmal,
  onReplayOnboarding,
  canInstallPwa,
  isPwaInstalled,
  onInstallPwa,
}) => {
  const [allCities, setAllCities] = useState<IndonesianCityOption[]>(POPULAR_CITIES)
  const [cityQuery, setCityQuery] = useState('')
  const [showCitySearch, setShowCitySearch] = useState(false)

  useEffect(() => {
    let active = true
    fetchAllIndonesianCities().then((list) => {
      if (active && list.length > 0) {
        setAllCities(list)
      }
    })
    return () => {
      active = false
    }
  }, [])

  const filteredCities = useMemo(() => {
    const q = cityQuery.trim().toLowerCase()
    if (!q) return POPULAR_CITIES
    return allCities
      .filter((c) => c.label.toLowerCase().includes(q) || c.lokasi.toLowerCase().includes(q))
      .slice(0, 30)
  }, [allCities, cityQuery])

  const isIosBrowser =
    typeof navigator !== 'undefined' &&
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !isPwaInstalled

  return (
    <div className="space-y-5 pb-24">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-[#101828]">Pengaturan</h1>
        <p className="text-xs text-[#525252] mt-0.5">Sesuaikan Mizany dengan kebiasaan ibadahmu</p>
      </div>

      {/* 1. Lokasi & Kota Jadwal Sholat (GPS Otomatis + Pencarian 518 Wilayah Kemenag) */}
      <div className="glass-card p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-[#525252] uppercase tracking-wider">
            Lokasi Jadwal Sholat
          </span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              cityMode === 'auto'
                ? 'bg-[#14B8A6]/15 text-[#0F766E]'
                : 'bg-[#0F50BD]/10 text-[#0F50BD]'
            }`}
          >
            {cityMode === 'auto' ? 'Otomatis (GPS)' : 'Manual'}
          </span>
        </div>

        {/* Active City Display */}
        <div className="p-3 rounded-xl bg-[#F7F9FF] border border-[#0F50BD]/15 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#0F50BD]/10 text-[#0F50BD] flex items-center justify-center shrink-0">
              <MapPin size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-[#101828] truncate">{city}</div>
              <div className="text-[11px] text-[#525252] truncate">
                Data resmi Bimas Islam Kemenag RI
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowCitySearch((v) => !v)}
            className="px-2.5 py-1.5 rounded-lg border border-black/10 bg-white text-[11px] font-bold text-[#0F50BD] hover:bg-blue-50 cursor-pointer shrink-0 transition-colors"
          >
            {showCitySearch ? 'Tutup' : 'Ganti'}
          </button>
        </div>

        {/* Auto-detect GPS button */}
        <button
          type="button"
          onClick={onDetectLocation}
          disabled={isLocatingCity}
          className="w-full py-2.5 px-4 rounded-xl bg-[#0F50BD] text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#1941B5] active:scale-[0.99] disabled:opacity-65 transition-all cursor-pointer shadow-sm"
        >
          {isLocatingCity ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              <span>Mendeteksi lokasi perangkat...</span>
            </>
          ) : (
            <>
              <LocateFixed size={15} />
              <span>Gunakan Lokasi Otomatis (GPS)</span>
            </>
          )}
        </button>

        {locationMessage && !locationError && (
          <p className="text-[11.5px] font-medium text-[#0F766E] bg-teal-50 border border-teal-200/70 rounded-xl px-3 py-2">
            {locationMessage}
          </p>
        )}

        {locationError && (
          <p className="text-[11.5px] font-medium text-red-600 bg-red-50 border border-red-200/70 rounded-xl px-3 py-2">
            {locationError}
          </p>
        )}

        {/* Expandable Search across all 518 Indonesian Kab/Kota */}
        {showCitySearch && (
          <div className="pt-2 border-t border-black/[0.06] space-y-2">
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#525252]/70 pointer-events-none"
              />
              <input
                type="text"
                value={cityQuery}
                onChange={(e) => setCityQuery(e.target.value)}
                placeholder="Cari dari 518 kota/kabupaten Indonesia..."
                aria-label="Cari kota atau kabupaten Indonesia"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-black/15 bg-white text-xs font-medium text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#0F50BD]/30 focus:border-[#0F50BD]"
              />
            </div>

            <div className="max-h-48 overflow-y-auto rounded-xl border border-black/[0.07] bg-white divide-y divide-black/[0.04]">
              {filteredCities.length > 0 ? (
                filteredCities.map((c) => {
                  const selected = c.label.toLowerCase() === city.toLowerCase()
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        onChangeCity(c.label)
                        setShowCitySearch(false)
                        setCityQuery('')
                      }}
                      className={`w-full px-3 py-2.5 text-left text-xs flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                        selected
                          ? 'bg-[#0F50BD]/10 text-[#0F50BD] font-bold'
                          : 'text-[#101828] hover:bg-black/[0.03] font-medium'
                      }`}
                    >
                      <span className="truncate">{c.label}</span>
                      {selected && <Check size={14} strokeWidth={2.8} className="shrink-0" />}
                    </button>
                  )
                })
              ) : (
                <div className="py-4 text-center text-xs text-[#525252]">
                  Kota "{cityQuery}" tidak ditemukan
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. Pasang Aplikasi (PWA) — tampil jika belum terpasang */}
      {!isPwaInstalled && (canInstallPwa || isIosBrowser) && (
        <div className="glass-card p-4 sm:p-5 border-[#0F50BD]/20 bg-gradient-to-br from-[#F7F9FF] to-white">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0F50BD]/10 text-[#0F50BD] flex items-center justify-center shrink-0">
              <Smartphone size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-[#101828]">Pasang Mizany di HP</h3>
              <p className="text-[11.5px] text-[#525252] mt-0.5 leading-relaxed">
                {canInstallPwa
                  ? 'Akses cepat dari layar utama layar penuh dan tetap bisa dibuka saat offline.'
                  : 'Di Safari iPhone/iPad: ketuk tombol Bagikan (Share) lalu pilih "Tambahkan ke Layar Utama".'}
              </p>
              {canInstallPwa && (
                <button
                  type="button"
                  onClick={onInstallPwa}
                  className="mt-2.5 px-4 py-2 rounded-full bg-[#0F50BD] text-white text-xs font-bold inline-flex items-center gap-1.5 hover:bg-[#1941B5] active:scale-95 transition-all cursor-pointer shadow-sm"
                >
                  <Download size={14} />
                  <span>Pasang Aplikasi</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Target Tilawah Harian */}
      {(() => {
        const linkedJuzAmal = customAmalItems.find(
          (item) =>
            item.type === 'target' &&
            /qur|tilawah|tadarus|mushaf|ngaji|mengaji/i.test(item.name) &&
            /juz/i.test(item.unit || '')
        )
        const step = linkedJuzAmal ? 20 : 1
        return (
          <div className="glass-card p-4 sm:p-5">
            <label className="text-xs font-bold text-[#525252] uppercase tracking-wider block mb-2">
              Target Tilawah Harian
            </label>
            <div className="flex items-center justify-between p-2 rounded-xl bg-black/[0.03]">
              <button
                type="button"
                onClick={() => onChangeTilawahTarget(Math.max(step, tilawahTarget - step))}
                className="w-10 h-10 rounded-lg bg-white border border-black/10 flex items-center justify-center text-[#525252] hover:text-[#101828] active:scale-95 shadow-sm cursor-pointer"
                aria-label="Kurangi target"
              >
                <Minus size={18} strokeWidth={2.5} />
              </button>

              <div className="text-center">
                <span className="text-2xl font-extrabold text-[#0F50BD] tabular-nums">{tilawahTarget}</span>
                <span className="text-xs text-[#525252] block font-medium">
                  {linkedJuzAmal
                    ? `halaman (${linkedJuzAmal.target || 1} juz · ${linkedJuzAmal.name})`
                    : 'halaman per hari'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => onChangeTilawahTarget(tilawahTarget + step)}
                className="w-10 h-10 rounded-lg bg-[#0F50BD] text-white flex items-center justify-center active:scale-95 shadow-sm cursor-pointer hover:bg-[#1941B5]"
                aria-label="Tambah target"
              >
                <Plus size={18} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        )
      })()}

      {/* 4. Kelola Amal Tambahan Saya */}
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
                  {item.type === 'target' && (
                    <button
                      type="button"
                      onClick={() => onEditAmal(item)}
                      className="w-8 h-8 rounded-lg text-[#0F50BD] hover:bg-[#0F50BD]/10 flex items-center justify-center cursor-pointer transition-colors"
                      aria-label={`Ubah target ${item.name}`}
                      title="Ubah target"
                    >
                      <Pencil size={15} />
                    </button>
                  )}
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

      {/* 5. Disclaimer Kejujuran (Kunci Desain & Spesifikasi) */}
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

      {/* 6. Replay Onboarding */}
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
