import { useState } from 'react'
import { useModalClose } from '../../hooks/useModalClose'
import { SAVED_MS } from '../ui/motion'
import { today } from '../../lib/utils'
import { FieldInput } from '../ui/fieldInput'
import { FieldSelect } from '../ui/fieldSelect'
import { ErrorBanner } from '../ui/errorBanner'
import { Toggle } from '../ui/toggle'
import { FormActions, ToggleRow } from './formActions'

export function ExpenseForm({ initialValues, banks, creditCards, categories, onSubmit, onClose, onDelete, submitLabel }) {
  const [description, setDescription] = useState(initialValues?.description || '')
  const [amount, setAmount] = useState(initialValues?.amount ? String(initialValues.amount) : '')
  const [date, setDate] = useState(initialValues?.date || today())
  const [categoryId, setCategoryId] = useState(initialValues?.category_id || '')
  const [bankId, setBankId] = useState(initialValues?.bank_id || '')
  const [creditCardId, setCreditCardId] = useState(initialValues?.credit_card_id || '')
  const [isCardSettled, setIsCardSettled] = useState(initialValues?.is_card_settled || false)
  const [isMarked, setIsMarked] = useState(initialValues?.is_marked || false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const close = useModalClose(onClose)

  const usedCard = creditCardId !== ''

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!description.trim() || !amount || !date || !bankId) {
      setError('Description, amount, date, and bank are required.')
      return
    }
    setSaving(true)
    const err = await onSubmit({
      description: description.trim(),
      amount: parseFloat(amount),
      date,
      category_id: categoryId || null,
      bank_id: bankId,
      credit_card_id: creditCardId || null,
      is_card_settled: usedCard ? isCardSettled : null,
      is_marked: isMarked,
    })
    if (err) { setError(err); setSaving(false); return }
    setSaved(true)
    setTimeout(close, SAVED_MS)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FieldInput label="Description" value={description} onChange={setDescription} placeholder="e.g. Starbucks" required />
      <div className="grid grid-cols-2 gap-3">
        <FieldInput label="Amount (₱)" type="number" value={amount} onChange={setAmount} placeholder="0.00" required min="0.01" step="0.01" />
        <FieldInput label="Date" type="date" value={date} onChange={setDate} required />
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
      {usedCard && (
        <ToggleRow title="Card bill settled?" hint="Turn on if you've already paid this card bill">
          <Toggle checked={isCardSettled} onChange={setIsCardSettled} label="Card bill settled" />
        </ToggleRow>
      )}
      <ToggleRow title="Mark this expense" hint="Marked expenses are tracked separately on the dashboard">
        <Toggle checked={isMarked} onChange={setIsMarked} label="Marked" />
      </ToggleRow>
      <ErrorBanner message={error} />
      <FormActions onClose={close} saving={saving} saved={saved} submitLabel={submitLabel} onDelete={onDelete} />
    </form>
  )
}
