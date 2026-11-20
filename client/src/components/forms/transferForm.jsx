import { useState } from 'react'
import { today } from '../../lib/utils'
import { FieldInput } from '../ui/fieldInput'
import { FieldSelect } from '../ui/fieldSelect'
import { ErrorBanner } from '../ui/errorBanner'
import { TransferIcon } from '../ui/icons'
import { FormActions } from './formActions'

export function TransferForm({ initialValues, banks, onSubmit, onClose, onDelete, submitLabel }) {
  const [fromBankId, setFromBankId] = useState(initialValues?.from_bank_id || '')
  const [toBankId, setToBankId] = useState(initialValues?.to_bank_id || '')
  const [amount, setAmount] = useState(initialValues?.amount ? String(initialValues.amount) : '')
  const [date, setDate] = useState(initialValues?.date || today())
  const [note, setNote] = useState(initialValues?.note || '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!fromBankId || !toBankId || !amount || !date) {
      setError('From bank, to bank, amount, and date are required.')
      return
    }
    if (fromBankId === toBankId) {
      setError('From and To banks must be different.')
      return
    }
    setSaving(true)
    const err = await onSubmit({
      from_bank_id: fromBankId,
      to_bank_id: toBankId,
      amount: parseFloat(amount),
      date,
      note: note.trim() || null,
    })
    if (err) setError(err)
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
        <FieldSelect label="From" value={fromBankId} onChange={setFromBankId} required>
          <option value="">Select</option>
          {banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </FieldSelect>
        <span className="h-11 grid place-items-center text-cyan-ink"><TransferIcon className="w-4 h-4" /></span>
        <FieldSelect label="To" value={toBankId} onChange={setToBankId} required>
          <option value="">Select</option>
          {banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </FieldSelect>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FieldInput label="Amount (₱)" type="number" value={amount} onChange={setAmount} placeholder="0.00" required min="0.01" step="0.01" />
        <FieldInput label="Date" type="date" value={date} onChange={setDate} required />
      </div>
      <FieldInput label="Note (optional)" value={note} onChange={setNote} placeholder="e.g. Load for bills" />
      <ErrorBanner message={error} />
      <FormActions onClose={onClose} saving={saving} submitLabel={submitLabel} onDelete={onDelete} />
    </form>
  )
}
