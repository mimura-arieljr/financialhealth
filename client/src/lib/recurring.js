import { supabase } from './supabase'
import { today } from './utils'

// Logs a recurring item as an expense dated today, then stamps last_logged.
// Returns an error message, or null on success.
export async function logRecurringExpense(userId, item) {
  const todayStr = today()
  const { error } = await supabase.from('expenses').insert({
    user_id: userId,
    description: item.description,
    amount: item.amount,
    date: todayStr,
    category_id: item.category_id,
    bank_id: item.bank_id,
    credit_card_id: item.credit_card_id,
    is_card_settled: item.credit_card_id ? false : null,
  })
  if (error) return error.message

  const { error: updateError } = await supabase
    .from('recurring_expenses')
    .update({ last_logged: todayStr })
    .eq('id', item.id)
  return updateError ? updateError.message : null
}
