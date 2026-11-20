import { useCallback, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { fetchCached } from '../../lib/cache'
import { useAuth } from '../../hooks/useAuth'
import { Modal } from '../ui/modal'
import { ExpenseForm } from '../forms/expenseForm'
import { RevenueForm } from '../forms/revenueForm'
import { TransferForm } from '../forms/transferForm'
import { QuickAddContext } from './quickAddContext'

const KINDS = {
  expense: { title: 'Add expense', table: 'expenses', submitLabel: 'Add expense' },
  revenue: { title: 'Add revenue', table: 'revenues', submitLabel: 'Add revenue' },
  transfer: { title: 'New transfer', table: 'transfers', submitLabel: 'Save transfer' },
}

export function QuickAddProvider({ children }) {
  const { user } = useAuth()
  const userId = user?.id
  const [kind, setKind] = useState(null)
  const [refs, setRefs] = useState({ banks: [], creditCards: [], categories: [] })
  const [dataVersion, setDataVersion] = useState(0)

  const notifySaved = useCallback(() => setDataVersion(v => v + 1), [])
  const close = useCallback(() => setKind(null), [])

  const openQuickAdd = useCallback(async (k) => {
    setKind(k)
    if (!userId) return
    const [b, cc, cat] = await Promise.all([
      fetchCached('banks', userId, 'id, name', 'name'),
      fetchCached('credit_cards', userId, 'id, name', 'name'),
      fetchCached('categories', userId, 'id, name', 'name'),
    ])
    setRefs({ banks: b.data || [], creditCards: cc.data || [], categories: cat.data || [] })
  }, [userId])

  const value = useMemo(() => ({ openQuickAdd, dataVersion, notifySaved }), [openQuickAdd, dataVersion, notifySaved])

  const config = kind && KINDS[kind]
  const handleSubmit = async (values) => {
    const { error } = await supabase.from(config.table).insert({ user_id: userId, ...values })
    if (error) return error.message
    close()
    notifySaved()
    return null
  }

  const formProps = { onSubmit: handleSubmit, onClose: close, submitLabel: config?.submitLabel }

  return (
    <QuickAddContext.Provider value={value}>
      {children}
      {config && (
        <Modal title={config.title} onClose={close}>
          {kind === 'expense' && <ExpenseForm {...formProps} banks={refs.banks} creditCards={refs.creditCards} categories={refs.categories} />}
          {kind === 'revenue' && <RevenueForm {...formProps} banks={refs.banks} />}
          {kind === 'transfer' && <TransferForm {...formProps} banks={refs.banks} />}
        </Modal>
      )}
    </QuickAddContext.Provider>
  )
}
