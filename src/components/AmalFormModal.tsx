import React, { useState, useEffect } from 'react'
import { AmalItem, CustomAmalType } from '../types'
import { X, CheckSquare, Target, Hash, Coins, Trash2, Lock, LucideIcon } from 'lucide-react'

interface AmalFormModalProps {
  isOpen: boolean
  editingItem?: AmalItem | null
  onClose: () => void
  onSave: (data: {
    id?: string
    name: string
    type: CustomAmalType
    target?: number
    unit?: string
  }) => void
  onDelete?: (id: string) => void
}

const TYPE_OPTIONS: {
  value: CustomAmalType
  label: string
  desc: string
  icon: LucideIcon
}[] = [
  { value: 'checklist', label: 'Ceklist', desc: 'Selesai / belum', icon: CheckSquare },
  { value: 'target', label: 'Target', desc: 'Mis. 1 juz / 20 hal', icon: Target },
  { value: 'counter', label: 'Hitungan', desc: 'Tambah bebas (+1)', icon: Hash },
  { value: 'amount', label: 'Nominal', desc: 'Jumlah Rupiah (Rp)', icon: Coins },
]

const UNIT_PRESETS = ['juz', 'halaman', 'rakaat', 'kali', 'menit']

export const AmalFormModal: React.FC<AmalFormModalProps> = ({
  isOpen,
  editingItem,
  onClose,
  onSave,
  onDelete,
}) => {
  const [name, setName] = useState('')
  const [type, setType] = useState<CustomAmalType>('checklist')
  const [target, setTarget] = useState('1')
  const [unit, setUnit] = useState('juz')
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setConfirmDelete(false)
    if (editingItem && editingItem.type !== 'prayers') {
      setName(editingItem.name)
      setType(editingItem.type)
      setTarget(String(editingItem.target || 1))
      setUnit(editingItem.unit || (editingItem.type === 'target' ? 'juz' : ''))
    } else {
      setName('')
      setType('checklist')
      setTarget('1')
      setUnit('juz')
    }
  }, [isOpen, editingItem])

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const isEditing = Boolean(editingItem && editingItem.type === 'target')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (isEditing && editingItem) {
      const parsedTarget = Math.max(1, Math.min(100000, Number(target) || 1))
      onSave({
        id: editingItem.id,
        name: editingItem.name,
        type: 'target',
        target: parsedTarget,
        unit: editingItem.unit,
      })
      onClose()
      return
    }

    const trimmedName = name.trim()
    if (!trimmedName) return

    const parsedTarget = Math.max(1, Math.min(100000, Number(target) || 1))
    const trimmedUnit = unit.trim()

    onSave({
      name: trimmedName,
      type,
      target: type === 'target' ? parsedTarget : undefined,
      unit:
        type === 'target'
          ? trimmedUnit || 'kali'
          : type === 'counter'
          ? trimmedUnit || undefined
          : undefined,
    })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#101828]/45 p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={isEditing ? 'Ubah target amal' : 'Tambah amal baru'}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white rounded-t-[24px] sm:rounded-[22px] p-5 pb-[calc(24px+env(safe-area-inset-bottom))] sm:pb-6 shadow-floating view-enter"
      >
        {/* Grab handle on mobile */}
        <div className="w-10 h-1 rounded-full bg-[#CBD5E1] mx-auto mb-3 sm:hidden" />

        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-[#101828]">
              {isEditing ? 'Ubah Target Harian' : 'Tambah Amal Baru'}
            </h3>
            <p className="text-xs text-[#475467] mt-0.5">
              {isEditing
                ? 'Sesuaikan jumlah target tanpa mengubah riwayat laporan'
                : 'Catat kebiasaan ibadah atau target harianmu sendiri'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-[#F1F5F9] text-[#475467] hover:text-[#101828] flex items-center justify-center cursor-pointer transition-colors shrink-0"
            aria-label="Tutup form"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isEditing && editingItem ? (
            <div className="space-y-3 pt-2 border-t border-[#EEF2F6]">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-bold text-[#101828]">{editingItem.name}</div>
                  <div className="text-xs text-[#475467]">
                    Tipe Target · Satuan: <b>{editingItem.unit || 'kali'}</b>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#F1F5F9] text-[11px] font-semibold text-[#475467] shrink-0">
                  <Lock size={11} aria-hidden="true" />
                  Terkunci
                </span>
              </div>

              <div>
                <label
                  htmlFor="amal-edit-target-input"
                  className="text-xs font-bold text-[#334155] block mb-1.5"
                >
                  Jumlah Target ({editingItem.unit || 'kali'})
                </label>
                <input
                  id="amal-edit-target-input"
                  type="number"
                  min={1}
                  max={100000}
                  inputMode="numeric"
                  autoFocus
                  required
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-xl border border-[#CBD5E1] bg-white text-base font-extrabold text-[#0F50BD] tabular-nums focus:outline-none focus:border-[#0F50BD]"
                />
              </div>

              <p className="text-xs text-[#475467] leading-relaxed">
                Nama, tipe, dan satuan dikunci agar laporan riwayat tetap akurat. Jika ingin amal berbeda, hapus lalu buat amal baru.
              </p>
            </div>
          ) : (
            <>
              {/* Nama Amal */}
              <div>
                <label
                  htmlFor="amal-name-input"
                  className="text-xs font-bold text-[#334155] block mb-1.5"
                >
                  Nama Amal
                </label>
                <input
                  id="amal-name-input"
                  type="text"
                  required
                  autoFocus
                  maxLength={45}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Mis. Baca Qur'an, Sholat Dhuha, Sedekah"
                  className="w-full px-3.5 py-3 rounded-xl border border-[#CBD5E1] bg-white text-sm font-medium text-[#101828] focus:outline-none focus:border-[#0F50BD]"
                />
              </div>

              {/* Tipe Catatan Selector */}
              <div>
                <span className="text-xs font-bold text-[#334155] block mb-1.5">Tipe Catatan</span>
                <div className="grid grid-cols-2 gap-2">
                  {TYPE_OPTIONS.map((opt) => {
                    const Icon = opt.icon
                    const active = type === opt.value
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setType(opt.value)}
                        aria-pressed={active}
                        className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 cursor-pointer transition-colors ${
                          active
                            ? 'bg-[#EFF6FF] border-[#0F50BD] text-[#0F50BD]'
                            : 'bg-white border-[#E2E8F0] text-[#101828] hover:border-[#CBD5E1]'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            active ? 'bg-[#0F50BD] text-white' : 'bg-[#F1F5F9] text-[#475467]'
                          }`}
                        >
                          <Icon size={16} aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold leading-tight">{opt.label}</div>
                          <div className="text-[11px] text-[#475467] mt-0.5 leading-tight">
                            {opt.desc}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Target + Satuan fields */}
              {type === 'target' && (
                <div className="space-y-2.5 pt-3 border-t border-[#EEF2F6]">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label
                        htmlFor="amal-target-input"
                        className="text-xs font-bold text-[#334155] block mb-1"
                      >
                        Jumlah Target
                      </label>
                      <input
                        id="amal-target-input"
                        type="number"
                        min={1}
                        max={100000}
                        inputMode="numeric"
                        required
                        value={target}
                        onChange={(e) => setTarget(e.target.value)}
                        placeholder="1"
                        className="w-full px-3 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-sm font-bold text-[#101828] tabular-nums focus:outline-none focus:border-[#0F50BD]"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="amal-unit-input"
                        className="text-xs font-bold text-[#334155] block mb-1"
                      >
                        Satuan
                      </label>
                      <input
                        id="amal-unit-input"
                        type="text"
                        maxLength={20}
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        placeholder="juz, halaman..."
                        className="w-full px-3 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-sm font-semibold text-[#101828] focus:outline-none focus:border-[#0F50BD]"
                      />
                    </div>
                  </div>

                  {/* Quick unit preset chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {UNIT_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setUnit(preset)}
                        className={`min-h-[32px] px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                          unit.toLowerCase() === preset
                            ? 'bg-[#0F50BD] text-white'
                            : 'bg-[#F1F5F9] text-[#334155] hover:bg-[#E2E8F0]'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Optional unit for Counter */}
              {type === 'counter' && (
                <div>
                  <label
                    htmlFor="amal-counter-unit"
                    className="text-xs font-bold text-[#334155] block mb-1.5"
                  >
                    Satuan (opsional)
                  </label>
                  <input
                    id="amal-counter-unit"
                    type="text"
                    maxLength={20}
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="Mis. kali, rakaat"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-sm text-[#101828] focus:outline-none focus:border-[#0F50BD]"
                  />
                </div>
              )}
            </>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2.5 pt-2">
            {editingItem && onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (!confirmDelete) {
                    setConfirmDelete(true)
                    return
                  }
                  onDelete(editingItem.id)
                  onClose()
                }}
                className={`min-h-[44px] px-3.5 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                  confirmDelete
                    ? 'border-red-600 bg-red-600 text-white'
                    : 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                }`}
                aria-label="Hapus amal"
              >
                <Trash2 size={15} aria-hidden="true" />
                <span>{confirmDelete ? 'Yakin Hapus?' : 'Hapus'}</span>
              </button>
            )}

            <button
              type="submit"
              className="flex-1 min-h-[44px] py-3 px-5 rounded-xl bg-[#0F50BD] text-white text-sm font-bold hover:bg-[#1941B5] active:scale-[0.98] transition-all cursor-pointer"
            >
              {isEditing ? 'Simpan Target' : 'Simpan Amal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
