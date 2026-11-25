import React from 'react'
import {
  ArrowLeft,
  MapPin,
  AlertCircle,
  BellRing,
  BellOff,
  Volume2,
  VolumeX,
  Send,
  Moon,
  Sunset,
} from 'lucide-react'
import { MandatoryPrayerKey } from '../types'
import { PrayerSchedule } from '../services/prayerService'
import {
  NotificationPermissionState,
  PrayerReminderSettings,
  REMINDER_LEAD_OPTIONS,
  ReminderLeadMinutes,
  ReminderPrayerId,
  countActiveReminderPrayers,
  formatLeadLabel,
} from '../services/reminderService'
import type { RamadanContext, RamadanPhaseInfo } from '../utils/ramadan'

interface PrayerViewProps {
  city: string
  prayerSchedule?: PrayerSchedule | null
  reminderSettings: PrayerReminderSettings
  notificationPermission: NotificationPermissionState
  ramadan?: RamadanContext
  ramadanPhase?: RamadanPhaseInfo | null
  onToggleMasterReminder: () => void
  onTogglePrayerReminder: (prayerId: ReminderPrayerId) => void
  onChangeLeadMinutes: (minutes: ReminderLeadMinutes) => void
  onToggleReminderSound: () => void
  onTestReminder: () => void
  onBack: () => void
}

const OBLIGATORY_IDS = new Set<string>(['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'])

export const PrayerView: React.FC<PrayerViewProps> = ({
  city,
  prayerSchedule,
  reminderSettings,
  notificationPermission,
  ramadan,
  ramadanPhase,
  onToggleMasterReminder,
  onTogglePrayerReminder,
  onChangeLeadMinutes,
  onToggleReminderSound,
  onTestReminder,
  onBack,
}) => {
  const t = prayerSchedule?.timings
  const nextId = prayerSchedule?.nextPrayer?.id
  const includeImsak = Boolean(ramadan?.isActive)
  const activeCount = countActiveReminderPrayers(reminderSettings, includeImsak)
  const totalReminderSlots = includeImsak ? 6 : 5
  const isMasterActive = reminderSettings.enabled && activeCount > 0

  const prayerDetails = [
    { id: 'imsak', name: 'Imsak', time: t?.imsak || '--:--', note: '10 menit sebelum Subuh' },
    { id: 'subuh', name: 'Subuh', time: t?.subuh || '--:--', note: 'Mulai waktu fajar' },
    { id: 'terbit', name: 'Terbit', time: t?.terbit || '--:--', note: 'Matahari terbit (syuruq)', forbidden: true },
    { id: 'dhuha', name: 'Dhuha', time: t?.dhuha || '--:--', note: 'Mulai waktu sholat Dhuha' },
    { id: 'dzuhur', name: 'Dzuhur', time: t?.dzuhur || '--:--', note: 'Matahari tergelincir' },
    { id: 'ashar', name: 'Ashar', time: t?.ashar || '--:--', note: 'Bayangan sama panjang' },
    { id: 'maghrib', name: 'Maghrib', time: t?.maghrib || '--:--', note: 'Matahari terbenam' },
    { id: 'isya', name: 'Isya', time: t?.isya || '--:--', note: 'Hilangnya syafaq merah' },
  ]

  const nextName = prayerSchedule?.nextPrayer?.name || 'Memuat...'
  const nextTime = prayerSchedule?.nextPrayer?.time || '--:--'
  const nextRemaining = prayerSchedule?.nextPrayer?.remainingLabel || 'Mengambil jadwal Kemenag RI...'

  return (
    <div className="space-y-4 pb-28">
      {/* Header with back button */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="w-10 h-10 rounded-xl glass-card flex items-center justify-center text-[#101828] hover:border-[#CBD5E1] cursor-pointer active:scale-95 transition-all shrink-0"
          aria-label="Kembali ke Beranda"
        >
          <ArrowLeft size={19} />
        </button>
        <div className="min-w-0">
          <h1 className="text-xl font-extrabold text-[#101828] tracking-tight">
            Jadwal Sholat Lengkap
          </h1>
          <div className="flex items-center gap-1.5 text-xs text-[#475467] mt-0.5 truncate">
            <MapPin size={13} className="text-[#0F50BD] shrink-0" aria-hidden="true" />
            <span className="truncate">{city}</span>
            <span aria-hidden="true">·</span>
            <span className="shrink-0">Kemenag RI</span>
          </div>
        </div>
      </div>

      {/* Rich Tazkirah Blue Next Prayer Highlight Card */}
      <div className="bg-gradient-to-r from-[#0F50BD] to-[#1941B5] text-white p-5 rounded-[22px] shadow-[0_8px_24px_rgba(25,65,181,0.2)] flex items-center justify-between gap-3">
        <div>
          <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/18 border border-white/25 text-white text-xs font-bold">
            {nextName} berikutnya
          </span>
          <p className="text-xs text-[#DBEAFE] font-medium mt-2">{nextRemaining}</p>
        </div>
        <div className="text-3xl font-extrabold text-white tabular-nums tracking-tight shrink-0">
          {nextTime}
        </div>
      </div>

      {/* Ramadan Imsak & Berbuka Highlight Tiles */}
      {ramadan?.isActive && (
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card-sm p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#475467]">
              <span className="w-7 h-7 rounded-lg bg-[#EFF6FF] text-[#0F50BD] flex items-center justify-center shrink-0">
                <Moon size={14} aria-hidden="true" />
              </span>
              <span>Imsak</span>
            </div>
            <div className="text-2xl font-extrabold text-[#101828] tabular-nums mt-2">
              {t?.imsak || '--:--'}
            </div>
            <p className="text-[11px] font-medium text-[#475467] mt-0.5">
              {ramadanPhase?.phase === 'sahur'
                ? `Menuju Imsak · ${ramadanPhase.countdown}`
                : 'Batas akhir sahur'}
            </p>
          </div>
          <div className="glass-card-sm p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#475467]">
              <span className="w-7 h-7 rounded-lg bg-[#F0FDFA] text-[#0F766E] flex items-center justify-center shrink-0">
                <Sunset size={14} aria-hidden="true" />
              </span>
              <span>Berbuka</span>
            </div>
            <div className="text-2xl font-extrabold text-[#0F766E] tabular-nums mt-2">
              {t?.maghrib || '--:--'}
            </div>
            <p className="text-[11px] font-medium text-[#475467] mt-0.5 tabular-nums">
              {ramadanPhase?.phase === 'puasa'
                ? `Menuju berbuka · ${ramadanPhase.countdown}`
                : 'Maghrib · waktu berbuka'}
            </p>
          </div>
        </div>
      )}

      {/* Detailed Prayer List with Per-Prayer Reminder Bell */}
      <div className="glass-card divide-y divide-[#EEF2F6] overflow-hidden">
        {prayerDetails.map((item) => {
          const isNext = item.id === nextId
          const isObligatory = OBLIGATORY_IDS.has(item.id)
          const isRamadanImsak = includeImsak && item.id === 'imsak'
          const hasBell = isObligatory || isRamadanImsak
          const reminderId = item.id as ReminderPrayerId
          const bellOn =
            hasBell &&
            reminderSettings.enabled &&
            (isRamadanImsak
              ? Boolean(reminderSettings.imsak)
              : Boolean(reminderSettings.prayers[item.id as MandatoryPrayerKey]))

          return (
            <div
              key={item.id}
              className={`px-4 py-3.5 flex items-center justify-between gap-2 transition-colors ${
                isNext ? 'bg-[#F5F9FF]' : ''
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-sm font-bold ${isNext ? 'text-[#0F50BD]' : 'text-[#101828]'}`}
                  >
                    {item.name}
                  </span>
                  {isNext && (
                    <span className="px-2 py-0.5 rounded-full bg-[#0F50BD] text-white text-[11px] font-bold">
                      Berikutnya
                    </span>
                  )}
                  {isRamadanImsak && (
                    <span className="px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#0F50BD] text-[11px] font-bold">
                      Sahur
                    </span>
                  )}
                  {ramadan?.isActive && item.id === 'maghrib' && (
                    <span className="px-2 py-0.5 rounded-full bg-[#F0FDFA] text-[#0F766E] text-[11px] font-bold">
                      Berbuka
                    </span>
                  )}
                  {item.forbidden && (
                    <span className="px-2 py-0.5 rounded-md bg-red-50 border border-red-200 text-red-700 text-[11px] font-semibold">
                      Larangan Sholat
                    </span>
                  )}
                </div>
                <div className="text-xs text-[#475467] mt-0.5">{item.note}</div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <div
                  className={`text-base font-bold tabular-nums ${
                    isNext ? 'text-[#0F50BD]' : 'text-[#101828]'
                  }`}
                >
                  {item.time}
                </div>
                {hasBell && (
                  <button
                    type="button"
                    onClick={() => onTogglePrayerReminder(reminderId)}
                    aria-pressed={bellOn}
                    aria-label={
                      bellOn ? `Matikan pengingat ${item.name}` : `Aktifkan pengingat ${item.name}`
                    }
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer active:scale-95 ${
                      bellOn
                        ? 'bg-[#EFF6FF] text-[#0F50BD] hover:bg-[#DBEAFE]'
                        : 'bg-[#F8FAFC] text-[#667085] hover:bg-[#EEF2F6] hover:text-[#334155]'
                    }`}
                  >
                    {bellOn ? (
                      <BellRing size={16} strokeWidth={2.2} aria-hidden="true" />
                    ) : (
                      <BellOff size={16} strokeWidth={2} aria-hidden="true" />
                    )}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Pengingat Waktu Sholat Control Card */}
      <section className="glass-card p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                isMasterActive
                  ? 'bg-[#EFF6FF] text-[#0F50BD]'
                  : 'bg-[#F1F5F9] text-[#475467]'
              }`}
            >
              {isMasterActive ? (
                <BellRing size={20} aria-hidden="true" />
              ) : (
                <BellOff size={20} aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-[#101828]">Pengingat Waktu Sholat</h2>
              <p className="text-xs text-[#475467] mt-0.5 truncate">
                {isMasterActive
                  ? `${activeCount} dari ${totalReminderSlots} waktu aktif · ${formatLeadLabel(reminderSettings.leadMinutes)}`
                  : 'Ketuk tombol atau ikon lonceng di jadwal'}
              </p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={isMasterActive}
            aria-label="Aktifkan pengingat waktu sholat"
            onClick={onToggleMasterReminder}
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F50BD]/40 ${
              isMasterActive ? 'bg-[#0F50BD]' : 'bg-[#CBD5E1]'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                isMasterActive ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Permission notice */}
        {notificationPermission === 'denied' && (
          <div className="rounded-xl bg-[#FEF2F2] border border-[#FECACA] px-3 py-2.5 text-xs text-[#991B1B] leading-relaxed">
            Izin notifikasi diblokir oleh browser. Aktifkan izin notifikasi di pengaturan situs browser agar pengingat muncul di layar; notifikasi di dalam aplikasi tetap berjalan.
          </div>
        )}
        {notificationPermission === 'unsupported' && (
          <div className="rounded-xl bg-[#EFF6FF] border border-[#DBEAFE] px-3 py-2.5 text-xs text-[#334155] leading-relaxed">
            Browser ini belum mendukung notifikasi sistem. Pengingat tetap tampil di dalam aplikasi saat Mizany terbuka.
          </div>
        )}

        {/* Lead time chips */}
        <div className="pt-3 border-t border-[#EEF2F6] space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#475467]">Waktu pengingat</span>
            <span className="text-[11px] font-semibold text-[#0F50BD]">
              {formatLeadLabel(reminderSettings.leadMinutes)}
            </span>
          </div>
          <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] gap-1.5">
            {REMINDER_LEAD_OPTIONS.map((opt) => {
              const selected = reminderSettings.leadMinutes === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onChangeLeadMinutes(opt.value)}
                  aria-pressed={selected}
                  className={`min-h-[36px] px-2 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
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

        {/* Sound toggle & Test reminder */}
        <div className="pt-3 border-t border-[#EEF2F6] flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onToggleReminderSound}
            aria-pressed={reminderSettings.sound}
            className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
              reminderSettings.sound
                ? 'bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1]'
                : 'bg-[#F1F5F9] text-[#475467] border border-transparent hover:bg-[#E2E8F0]'
            }`}
          >
            {reminderSettings.sound ? (
              <Volume2 size={14} aria-hidden="true" />
            ) : (
              <VolumeX size={14} aria-hidden="true" />
            )}
            <span>{reminderSettings.sound ? 'Bunyi lembut: Aktif' : 'Bunyi: Senyap'}</span>
          </button>

          <button
            type="button"
            onClick={onTestReminder}
            className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#EFF6FF] text-[#0F50BD] text-xs font-bold inline-flex items-center gap-1.5 hover:bg-[#DBEAFE] active:scale-95 transition-all cursor-pointer"
          >
            <Send size={13} aria-hidden="true" />
            <span>Uji Pengingat</span>
          </button>
        </div>

        <p className="text-[11px] text-[#475467] leading-relaxed">
          Pengingat berjalan lokal selama Mizany terbuka di browser atau latar belakang tab.
        </p>
      </section>

      {/* Note Waktu Tahrim */}
      <div className="rounded-[18px] p-4 flex items-start gap-2.5 bg-[#FFFBEB] border border-[#FDE68A]">
        <AlertCircle size={18} className="text-[#B45309] shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-xs text-[#475467] leading-relaxed">
          <b className="text-[#101828]">Waktu Terlarang Sholat (Tahrim):</b> Saat matahari tepat terbit hingga naik setinggi tombak (sekitar 15–20 menit setelah terbit), saat matahari tepat di puncaknya (istiwak), dan saat matahari tenggelam hingga sempurna.
        </p>
      </div>
    </div>
  )
}
