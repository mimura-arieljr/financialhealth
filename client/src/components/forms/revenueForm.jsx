import { useState } from 'react'
import { today } from '../../lib/utils'
import { FieldInput } from '../ui/fieldInput'
import { FieldSelect } from '../ui/fieldSelect'
import { ErrorBanner } from '../ui/errorBanner'
import { FormActions } from './formActions'

export function RevenueForm({ initialValues, banks, onSubmit, onClose, onDelete, submitLabel }) {
  const [description, setDescription] = useState(initialValues?.description || '')
  const [amount, setAmount] = useState(initialValues?.amount ? String(initialValues.amount) : '')
  const [date, setDate] = useState(initialValues?.date || today())
  const [bankId, setBankId] = useState(initialValues?.bank_id || '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!description.trim() || !amount || !date || !bankId) {
      setError('All fields are required.')
      return
    }
    setSaving(true)
    const err = await onSubmit({
      description: description.trim(),
      amount: parseFloat(amount),
      date,
      bank_id: bankId,
    })
    if (err) setError(err)
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FieldInput label="Description" value={description} onChange={setDescription} placeholder="e.g. Salary" required />
      <div className="grid grid-cols-2 gap-3">
        <FieldInput label="Amount (₱)" type="number" value={amount} onChange={setAmount} placeholder="0.00" required min="0.01" step="0.01" />
        <FieldInput label="Date" type="date" value={date} onChange={setDate} required />
      </div>
      <FieldSelect label="Received in bank" value={bankId} onChange={setBankId} required>
        <option value="">Select a bank</option>
        {banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
      </FieldSelect>
      <ErrorBanner message={error} />
      <FormActions onClose={onClose} saving={saving} submitLabel={submitLabel} onDelete={onDelete} />
    </form>
  )
}
