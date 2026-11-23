import React, { useState, useEffect } from 'react'
import { AmalItem, CustomAmalType } from '../types'
import { X, CheckSquare, Target, Hash, Coins, Trash2, LucideIcon } from 'lucide-react'

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

  useEffect(() => {
    if (!isOpen) return
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

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) return

    const parsedTarget = Math.max(1, Math.min(100000, Number(target) || 1))
    const trimmedUnit = unit.trim()

    onSave({
      id: editingItem?.id,
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#101828]/40 backdrop-blur-[3px] p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={editingItem ? 'Edit amal' : 'Tambah amal baru'}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white rounded-t-[26px] sm:rounded-[24px] p-5 pb-[calc(24px+env(safe-area-inset-bottom))] sm:pb-6 shadow-floating view-enter"
      >
        {/* Grab handle on mobile */}
        <div className="w-10 h-1 rounded-full bg-black/15 mx-auto mb-3 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-[#101828]">
              {editingItem ? 'Edit Amal' : 'Tambah Amal Baru'}
            </h3>
            <p className="text-[11.5px] text-[#525252]">
              Catat kebiasaan ibadah atau target harianmu sendiri
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-black/[0.05] text-[#525252] hover:text-[#101828] flex items-center justify-center cursor-pointer transition-colors"
            aria-label="Tutup form"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nama Amal */}
          <div>
            <label
              htmlFor="amal-name-input"
              className="text-xs font-bold text-[#525252] block mb-1.5"
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
              className="w-full px-3.5 py-3 rounded-xl border border-black/15 bg-white text-sm font-medium text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#0F50BD]/30 focus:border-[#0F50BD]"
            />
          </div>

          {/* Tipe Catatan Selector */}
          <div>
            <span className="text-xs font-bold text-[#525252] block mb-1.5">Tipe Catatan</span>
            <div className="grid grid-cols-2 gap-2">
              {TYPE_OPTIONS.map((opt) => {
                const Icon = opt.icon
                const active = type === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setType(opt.value)}
                    className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 cursor-pointer transition-all ${
                      active
                        ? 'bg-[#0F50BD]/10 border-[#0F50BD] text-[#0F50BD]'
                        : 'bg-white border-black/10 text-[#101828] hover:border-black/20'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        active ? 'bg-[#0F50BD] text-white' : 'bg-black/[0.05] text-[#525252]'
                      }`}
                    >
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold leading-tight">{opt.label}</div>
                      <div className="text-[10.5px] text-[#525252] mt-0.5 leading-tight">
                        {opt.desc}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Target + Satuan fields (when Target is selected) */}
          {type === 'target' && (
            <div className="space-y-2.5 p-3.5 rounded-2xl bg-[#F7F9FF] border border-[#0F50BD]/15">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label
                    htmlFor="amal-target-input"
                    className="text-[11px] font-bold text-[#525252] block mb-1"
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
                    className="w-full px-3 py-2.5 rounded-xl border border-black/15 bg-white text-sm font-bold text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#0F50BD]/30"
                  />
                </div>
                <div>
                  <label
                    htmlFor="amal-unit-input"
                    className="text-[11px] font-bold text-[#525252] block mb-1"
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
                    className="w-full px-3 py-2.5 rounded-xl border border-black/15 bg-white text-sm font-semibold text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#0F50BD]/30"
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
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold cursor-pointer transition-colors ${
                      unit.toLowerCase() === preset
                        ? 'bg-[#0F50BD] text-white'
                        : 'bg-white border border-black/10 text-[#525252] hover:border-[#0F50BD]/40'
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
                className="text-xs font-bold text-[#525252] block mb-1.5"
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-black/15 bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#0F50BD]/30"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2.5 pt-1">
            {editingItem && onDelete && (
              <button
                type="button"
                onClick={() => {
                  onDelete(editingItem.id)
                  onClose()
                }}
                className="px-3.5 py-3 rounded-full border border-red-200 bg-red-50/70 text-red-600 text-xs font-bold flex items-center gap-1.5 hover:bg-red-100 cursor-pointer transition-colors"
                aria-label="Hapus amal"
              >
                <Trash2 size={15} />
                <span>Hapus</span>
              </button>
            )}

            <button
              type="submit"
              className="flex-1 py-3 px-5 rounded-full bg-[#0F50BD] text-white text-sm font-bold hover:bg-[#1941B5] shadow-[0_4px_14px_rgba(15,80,189,0.3)] active:scale-[0.98] transition-all cursor-pointer"
            >
              {editingItem ? 'Simpan Perubahan' : 'Simpan Amal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
