import { useState } from 'react'
import { useModalClose } from '../../hooks/useModalClose'
import { SAVED_MS } from '../../components/ui/motion'
import { DAYS_OF_WEEK } from '../../lib/consts'
import { FieldInput } from '../../components/ui/fieldInput'
import { FieldSelect } from '../../components/ui/fieldSelect'
import { ErrorBanner } from '../../components/ui/errorBanner'
import { FormActions } from '../../components/forms/formActions'

export function RecurringForm({ initialValues, banks, creditCards, categories, onSubmit, onClose, onDelete, submitLabel }) {
  const [description, setDescription] = useState(initialValues?.description || '')
  const [amount, setAmount] = useState(initialValues?.amount ? String(initialValues.amount) : '')
  const [categoryId, setCategoryId] = useState(initialValues?.category_id || '')
  const [bankId, setBankId] = useState(initialValues?.bank_id || '')
  const [creditCardId, setCreditCardId] = useState(initialValues?.credit_card_id || '')
  const [frequency, setFrequency] = useState(initialValues?.frequency || 'monthly')
  const [dayOfMonth, setDayOfMonth] = useState(initialValues?.day_of_month ? String(initialValues.day_of_month) : '1')
  const [dayOfWeek, setDayOfWeek] = useState(initialValues?.day_of_week !== undefined && initialValues?.day_of_week !== null ? String(initialValues.day_of_week) : '1')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const close = useModalClose(onClose)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!description.trim() || !amount || !bankId) {
      setError('Description, amount, and bank are required.')
      return
    }
    setSaving(true)
    const err = await onSubmit({
      description: description.trim(),
      amount: parseFloat(amount),
      category_id: categoryId || null,
      bank_id: bankId,
      credit_card_id: creditCardId || null,
      frequency,
      day_of_month: frequency === 'monthly' ? parseInt(dayOfMonth) : null,
      day_of_week: frequency === 'weekly' ? parseInt(dayOfWeek) : null,
    })
    if (err) { setError(err); setSaving(false); return }
    setSaved(true)
    setTimeout(close, SAVED_MS)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FieldInput label="Description" value={description} onChange={setDescription} placeholder="e.g. Netflix" required />
      <FieldInput label="Amount (₱)" type="number" value={amount} onChange={setAmount} placeholder="0.00" required min="0.01" step="0.01" />
      <div className="grid grid-cols-2 gap-3">
        <FieldSelect label="Repeats" value={frequency} onChange={setFrequency}>
          <option value="monthly">Monthly</option>
          <option value="weekly">Weekly</option>
        </FieldSelect>
        {frequency === 'monthly' ? (
          <FieldInput label="Day of month" type="number" value={dayOfMonth} onChange={setDayOfMonth} min="1" max="31" required />
        ) : (
          <FieldSelect label="Day of week" value={dayOfWeek} onChange={setDayOfWeek}>
            {DAYS_OF_WEEK.map((d, i) => <option key={i} value={i}>{d}</option>)}
          </FieldSelect>
        )}
      </div>
      <FieldSelect label="Category" value={categoryId} onChange={setCategoryId}>
        <option value="">No category</option>
        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </FieldSelect>
      <FieldSelect label="Paid from bank" value={bankId} onChange={setBankId} required>
        <option value="">Select a bank</option>
        {banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
      </FieldSelect>
      <FieldSelect label="Credit card (optional)" value={creditCardId} onChange={setCreditCardId}>
        <option value="">Cash or direct debit</option>
        {creditCards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </FieldSelect>
      <ErrorBanner message={error} />
      <FormActions onClose={close} saving={saving} saved={saved} submitLabel={submitLabel} onDelete={onDelete} />
    </form>
  )
}
