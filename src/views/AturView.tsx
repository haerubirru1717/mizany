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
  BellRing,
  BellOff,
  ChevronRight,
  Moon,
} from 'lucide-react'
import {
  NotificationPermissionState,
  PrayerReminderSettings,
  REMINDER_LEAD_OPTIONS,
  ReminderLeadMinutes,
  countActiveReminderPrayers,
  formatLeadLabel,
} from '../services/reminderService'
import type { RamadanContext } from '../utils/ramadan'

interface AturViewProps {
  city: string
  cityMode: 'auto' | 'manual'
  isLocatingCity: boolean
  locationMessage: string | null
  locationError: string | null
  onDetectLocation: () => void
  onChangeCity: (newCity: string) => void
  reminderSettings: PrayerReminderSettings
  notificationPermission: NotificationPermissionState
  onToggleMasterReminder: () => void
  onChangeReminderLead: (minutes: ReminderLeadMinutes) => void
  onOpenPrayerReminders: () => void
  ramadan: RamadanContext
  onToggleRamadanPreview: () => void
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
  reminderSettings,
  notificationPermission,
  onToggleMasterReminder,
  onChangeReminderLead,
  onOpenPrayerReminders,
  ramadan,
  onToggleRamadanPreview,
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
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

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

  const linkedJuzAmal = customAmalItems.find(
    (item) =>
      item.type === 'target' &&
      /qur|tilawah|tadarus|mushaf|ngaji|mengaji/i.test(item.name) &&
      /juz/i.test(item.unit || '')
  )
  const tilawahStep = linkedJuzAmal ? 20 : 1

  return (
    <div className="space-y-4 pb-28">
      {/* Title */}
      <div className="px-0.5">
        <h1 className="text-xl font-extrabold text-[#101828] tracking-tight">Pengaturan</h1>
        <p className="text-xs text-[#475467] mt-0.5">Sesuaikan Mizany dengan kebiasaan ibadahmu</p>
      </div>

      {/* 1. Lokasi & Kota Jadwal Sholat (flat, zero nested cards) */}
      <section className="glass-card p-4 sm:p-5 space-y-3.5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-[#101828]">Lokasi Jadwal Sholat</h2>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
              cityMode === 'auto'
                ? 'bg-[#F0FDFA] text-[#0F766E]'
                : 'bg-[#EFF6FF] text-[#0F50BD]'
            }`}
          >
            {cityMode === 'auto' ? 'Otomatis' : 'Manual'}
          </span>
        </div>

        {/* Active City Row (flat, no inner card border) */}
        <div className="flex items-center justify-between gap-2.5 pt-2 border-t border-[#EEF2F6]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] text-[#0F50BD] flex items-center justify-center shrink-0">
              <MapPin size={18} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-[#101828] truncate">{city}</div>
              <div className="text-xs text-[#475467] truncate">Bimas Islam Kemenag RI</div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowCitySearch((v) => !v)}
            className="min-h-[38px] px-3 py-1.5 rounded-xl border border-[#CBD5E1] bg-white text-xs font-bold text-[#0F50BD] hover:bg-[#EFF6FF] cursor-pointer shrink-0 transition-colors"
          >
            {showCitySearch ? 'Tutup' : 'Ganti'}
          </button>
        </div>

        {/* GPS trigger: secondary when auto is active, primary when manual */}
        <button
          type="button"
          onClick={onDetectLocation}
          disabled={isLocatingCity}
          className={`w-full min-h-[42px] py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-65 transition-colors cursor-pointer ${
            cityMode === 'auto'
              ? 'border border-[#CBD5E1] bg-[#F8FAFC] text-[#101828] hover:bg-[#F1F5F9]'
              : 'bg-[#0F50BD] text-white hover:bg-[#1941B5]'
          }`}
        >
          {isLocatingCity ? (
            <>
              <Loader2 size={15} className="animate-spin" aria-hidden="true" />
              <span>Mendeteksi lokasi...</span>
            </>
          ) : (
            <>
              <LocateFixed size={15} aria-hidden="true" />
              <span>
                {cityMode === 'auto'
                  ? 'Perbarui Lokasi Otomatis (GPS)'
                  : 'Gunakan Lokasi Otomatis (GPS)'}
              </span>
            </>
          )}
        </button>

        {locationMessage && !locationError && (
          <p className="text-xs font-medium text-[#0F766E] bg-[#F0FDFA] border border-[#CCFBF1] rounded-xl px-3 py-2">
            {locationMessage}
          </p>
        )}

        {locationError && (
          <p className="text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
            {locationError}
          </p>
        )}

        {/* Expandable Search across 518 Indonesian Kab/Kota */}
        {showCitySearch && (
          <div className="pt-3 border-t border-[#EEF2F6] space-y-2.5">
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#475467] pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="text"
                value={cityQuery}
                onChange={(e) => setCityQuery(e.target.value)}
                placeholder="Cari dari 518 kota/kabupaten..."
                aria-label="Cari kota atau kabupaten Indonesia"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-xs font-medium text-[#101828] focus:outline-none focus:border-[#0F50BD]"
              />
            </div>

            <div className="max-h-48 overflow-y-auto divide-y divide-[#EEF2F6]">
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
                      className={`w-full px-2 py-2.5 text-left text-xs flex items-center justify-between gap-2 cursor-pointer transition-colors rounded-lg ${
                        selected
                          ? 'bg-[#EFF6FF] text-[#0F50BD] font-bold'
                          : 'text-[#101828] hover:bg-[#F8FAFC] font-medium'
                      }`}
                    >
                      <span className="truncate">{c.label}</span>
                      {selected && <Check size={14} strokeWidth={2.8} className="shrink-0" />}
                    </button>
                  )
                })
              ) : (
                <div className="py-4 text-center text-xs text-[#475467]">
                  Kota &ldquo;{cityQuery}&rdquo; tidak ditemukan
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* 1b. Pengingat Waktu Sholat */}
      {(() => {
        const activeCount = countActiveReminderPrayers(reminderSettings, ramadan.isActive)
        const isReminderActive = reminderSettings.enabled && activeCount > 0
        return (
          <section className="glass-card p-4 sm:p-5 space-y-3.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    isReminderActive
                      ? 'bg-[#EFF6FF] text-[#0F50BD]'
                      : 'bg-[#F1F5F9] text-[#475467]'
                  }`}
                >
                  {isReminderActive ? (
                    <BellRing size={18} aria-hidden="true" />
                  ) : (
                    <BellOff size={18} aria-hidden="true" />
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-[#101828]">Pengingat Waktu Sholat</h2>
                  <p className="text-xs text-[#475467] truncate">
                    {isReminderActive
                      ? `${activeCount} waktu aktif · ${formatLeadLabel(reminderSettings.leadMinutes)}`
                      : 'Nonaktif'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={isReminderActive}
                aria-label="Aktifkan pengingat waktu sholat"
                onClick={onToggleMasterReminder}
                className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F50BD]/40 ${
                  isReminderActive ? 'bg-[#0F50BD]' : 'bg-[#CBD5E1]'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                    isReminderActive ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {notificationPermission === 'denied' && (
              <p className="text-xs text-[#991B1B] bg-[#FEF2F2] border border-[#FECACA] rounded-xl px-3 py-2 leading-relaxed">
                Izin notifikasi diblokir browser. Buka pengaturan situs untuk mengizinkan notifikasi.
              </p>
            )}

            {isReminderActive && (
              <div className="pt-3 border-t border-[#EEF2F6] space-y-2.5">
                <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] gap-1.5">
                  {REMINDER_LEAD_OPTIONS.map((opt) => {
                    const selected = reminderSettings.leadMinutes === opt.value
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => onChangeReminderLead(opt.value)}
                        aria-pressed={selected}
                        className={`min-h-[34px] px-2 py-1 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                          selected
                            ? 'bg-[#0F50BD] text-white'
                            : 'bg-[#F1F5F9] text-[#334155] hover:bg-[#E2E8F0]'
                        }`}
                      >
                        {opt.shortLabel}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={onOpenPrayerReminders}
              className="w-full pt-3 border-t border-[#EEF2F6] flex items-center justify-between text-xs font-bold text-[#0F50BD] hover:text-[#1941B5] cursor-pointer"
            >
              <span>Atur per waktu sholat &amp; uji notifikasi</span>
              <ChevronRight size={15} aria-hidden="true" />
            </button>
          </section>
        )
      })()}

      {/* 1c. Mode Ramadan */}
      <section className="glass-card p-4 sm:p-5 space-y-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                ramadan.isActive
                  ? 'bg-[#EFF6FF] text-[#0F50BD]'
                  : 'bg-[#F1F5F9] text-[#475467]'
              }`}
            >
              <Moon size={18} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-sm font-bold text-[#101828]">Mode Ramadan</h2>
                {ramadan.isRealRamadan ? (
                  <span className="px-2 py-0.5 rounded-full bg-[#F0FDFA] text-[#0F766E] text-[11px] font-bold">
                    Aktif Otomatis
                  </span>
                ) : ramadan.isPreview ? (
                  <span className="px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#0F50BD] text-[11px] font-bold">
                    Pratinjau
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-[#475467] mt-0.5">
                {ramadan.isRealRamadan
                  ? `Ramadan Hari ke-${ramadan.dayOfRamadan} dari ${ramadan.totalDays} hari`
                  : ramadan.isPreview
                    ? 'Aktif sementara untuk pratinjau di luar bulan Ramadan'
                    : 'Aktif otomatis saat masuk bulan Ramadan (Hijriah)'}
              </p>
            </div>
          </div>

          {!ramadan.isRealRamadan && (
            <button
              type="button"
              role="switch"
              aria-checked={ramadan.isPreview}
              aria-label="Aktifkan pratinjau Mode Ramadan"
              onClick={onToggleRamadanPreview}
              className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F50BD]/40 ${
                ramadan.isPreview ? 'bg-[#0F50BD]' : 'bg-[#CBD5E1]'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                  ramadan.isPreview ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          )}
        </div>

        <p className="text-xs text-[#475467] leading-relaxed pt-2 border-t border-[#EEF2F6]">
          Menampilkan sorotan Imsak &amp; Berbuka, checklist Puasa Ramadan, saran amal Ramadan, pengingat Imsak, dan kalkulator khatam 30 hari.
        </p>
      </section>

      {/* 2. Pasang Aplikasi (PWA) */}
      {!isPwaInstalled && (canInstallPwa || isIosBrowser) && (
        <section className="glass-card p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#0F50BD] flex items-center justify-center shrink-0">
              <Smartphone size={20} aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-[#101828]">Pasang Mizany di HP</h2>
              <p className="text-xs text-[#475467] mt-0.5 leading-relaxed">
                {canInstallPwa
                  ? 'Akses cepat layar penuh dari beranda HP dan tetap terbuka saat offline.'
                  : 'Di Safari iPhone/iPad: ketuk Bagikan lalu pilih "Tambahkan ke Layar Utama".'}
              </p>
              {canInstallPwa && (
                <button
                  type="button"
                  onClick={onInstallPwa}
                  className="mt-3 min-h-[40px] px-4 py-2 rounded-xl bg-[#0F50BD] text-white text-xs font-bold inline-flex items-center gap-1.5 hover:bg-[#1941B5] active:scale-95 transition-all cursor-pointer"
                >
                  <Download size={14} aria-hidden="true" />
                  <span>Pasang Aplikasi</span>
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 3. Target Tilawah Harian */}
      <section className="glass-card p-4 sm:p-5 space-y-3">
        <h2 className="text-sm font-bold text-[#101828]">Target Tilawah Harian</h2>
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={() => onChangeTilawahTarget(Math.max(tilawahStep, tilawahTarget - tilawahStep))}
            className="w-11 h-11 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-center text-[#334155] hover:bg-[#EEF2F6] active:scale-95 cursor-pointer"
            aria-label="Kurangi target tilawah"
          >
            <Minus size={18} strokeWidth={2.5} />
          </button>

          <div className="text-center">
            <span className="text-2xl font-extrabold text-[#0F50BD] tabular-nums">
              {tilawahTarget}
            </span>
            <span className="text-xs text-[#475467] block font-medium mt-0.5">
              {linkedJuzAmal
                ? `halaman (${linkedJuzAmal.target || 1} juz · ${linkedJuzAmal.name})`
                : 'halaman per hari'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onChangeTilawahTarget(tilawahTarget + tilawahStep)}
            className="w-11 h-11 rounded-xl bg-[#0F50BD] text-white flex items-center justify-center active:scale-95 cursor-pointer hover:bg-[#1941B5]"
            aria-label="Tambah target tilawah"
          >
            <Plus size={18} strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 pt-2 border-t border-[#EEF2F6]">
          {[4, 10, 20].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => onChangeTilawahTarget(preset)}
              className={`min-h-[34px] px-3 py-1 rounded-lg text-xs font-bold tabular-nums cursor-pointer transition-colors ${
                tilawahTarget === preset
                  ? 'bg-[#0F50BD] text-white'
                  : 'bg-[#F1F5F9] text-[#334155] hover:bg-[#E2E8F0]'
              }`}
            >
              {preset} hal
            </button>
          ))}
        </div>
      </section>

      {/* 4. Kelola Amal Tambahan (flat divider rows + 2-tap delete guard) */}
      <section className="glass-card overflow-hidden">
        <div className="px-4 sm:px-5 pt-4 pb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-[#101828]">Amal Tambahan Saya</h2>
          <span className="text-xs font-semibold text-[#475467] tabular-nums">
            {customAmalItems.length} amal
          </span>
        </div>

        {customAmalItems.length > 0 ? (
          <div className="divide-y divide-[#EEF2F6] border-t border-[#EEF2F6]">
            {customAmalItems.map((item) => {
              const confirming = confirmDeleteId === item.id
              return (
                <div
                  key={item.id}
                  className="px-4 sm:px-5 py-3 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-[#101828] truncate">{item.name}</div>
                    <div className="text-xs text-[#475467]">{formatAmalSubtitle(item)}</div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {item.type === 'target' && !confirming && (
                      <button
                        type="button"
                        onClick={() => onEditAmal(item)}
                        className="w-9 h-9 rounded-xl text-[#0F50BD] hover:bg-[#EFF6FF] flex items-center justify-center cursor-pointer transition-colors"
                        aria-label={`Ubah target ${item.name}`}
                        title="Ubah target"
                      >
                        <Pencil size={16} />
                      </button>
                    )}
                    {confirming ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="min-h-[36px] px-2.5 rounded-lg bg-[#F1F5F9] text-xs font-semibold text-[#334155] cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteCustomAmal(item.id)
                            setConfirmDeleteId(null)
                          }}
                          className="min-h-[36px] px-2.5 rounded-lg bg-red-600 text-white text-xs font-bold cursor-pointer"
                        >
                          Hapus
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(item.id)}
                        className="w-9 h-9 rounded-xl text-red-700 hover:bg-red-50 flex items-center justify-center cursor-pointer transition-colors"
                        aria-label={`Hapus ${item.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="px-4 sm:px-5 pb-3 text-xs text-[#475467] leading-relaxed">
            Secara bawaan hanya amalan wajib Sholat 5 waktu (dan Puasa saat Ramadan). Tambahkan kebiasaan ibadahmu di bawah.
          </p>
        )}

        <div className="px-4 sm:px-5 py-3 border-t border-[#EEF2F6] bg-[#F8FAFC]">
          <button
            type="button"
            onClick={onOpenAddAmal}
            className="w-full min-h-[42px] py-2 px-4 rounded-xl bg-[#0F50BD] text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-[#1941B5] transition-colors cursor-pointer"
          >
            <Plus size={15} strokeWidth={2.5} aria-hidden="true" />
            <span>Tambah Amal Baru</span>
          </button>
        </div>
      </section>

      {/* 5. Disclaimer Kejujuran */}
      <section className="rounded-[18px] p-4 sm:p-5 bg-[#EFF6FF] border border-[#DBEAFE]">
        <div className="flex items-start gap-2.5">
          <Info size={18} className="text-[#0F50BD] shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <h2 className="text-sm font-bold text-[#101828]">Tentang Streak &amp; Skor</h2>
            <p className="text-xs text-[#334155] mt-1.5 leading-relaxed">
              Streak dan skor di Mizany <b>hanya alat bantu menjaga konsistensi</b> — bukan ukuran nilai amal, apalagi tanda diterimanya amal di sisi Allah. Hari yang terlewat bukan kegagalan; yang terpenting adalah niat, keikhlasan, dan kemauan untuk mulai lagi.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Replay Panduan Awal */}
      <div className="text-center pt-1">
        <button
          type="button"
          onClick={onReplayOnboarding}
          className="min-h-[40px] px-3 py-2 text-xs font-bold text-[#0F50BD] hover:underline cursor-pointer"
        >
          Lihat panduan awal aplikasi
        </button>
      </div>

      <p className="text-xs text-center text-[#475467] pb-2">
        Mizany — Timbang Amal Harian · Gratis, tanpa iklan
      </p>
    </div>
  )
}
