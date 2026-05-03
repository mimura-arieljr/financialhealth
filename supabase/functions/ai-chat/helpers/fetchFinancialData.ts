import { SupabaseClient } from "@supabase/supabase-js"
import { Intent } from "../types/intent.ts"
import { QueryParams } from "../types/queryParams.ts"

export type RawBank = { name: string; current_balance: number | null }
export type RawExpense = { amount: number; date: string; categories?: { name?: string }[] | null }
export type RawRevenue = { amount: number; date: string }
export type RawRecurring = { description: string; amount: number; frequency: string }

export type RawFinancialData = {
  banks: RawBank[]
  expenses: RawExpense[]
  revenues: RawRevenue[]
  recurring: RawRecurring[]
}

const needsExpenses = (intent: Intent) =>
  intent === "expenses" || intent === "budget" || intent === "general"

const needsRevenues = (intent: Intent) =>
  intent === "income" || intent === "budget" || intent === "general"

const needsRecurring = (intent: Intent) =>
  intent === "budget" || intent === "general"

export async function fetchFinancialData(
  supabase: SupabaseClient,
  userId: string,
  intent: Intent,
  params: QueryParams
): Promise<RawFinancialData> {
  const { from, to } = params.dateRange

  const [banksRes, expensesRes, revenuesRes, recurringRes] = await Promise.all([
    supabase.from("bank_balances").select("name, current_balance").eq("user_id", userId),
    needsExpenses(intent)
      ? supabase.from("expenses")
          .select("amount, date, categories(name)")
          .eq("user_id", userId)
          .gte("date", from)
          .lte("date", to)
      : Promise.resolve({ data: [] }),
    needsRevenues(intent)
      ? supabase.from("revenues")
          .select("amount, date")
          .eq("user_id", userId)
          .gte("date", from)
          .lte("date", to)
      : Promise.resolve({ data: [] }),
    needsRecurring(intent)
      ? supabase.from("recurring_expenses")
          .select("description, amount, frequency")
          .eq("user_id", userId)
          .eq("is_active", true)
      : Promise.resolve({ data: [] }),
  ])

  let expenses: RawExpense[] = expensesRes.data ?? []

  if (params.categoryHint) {
    const hint = params.categoryHint.toLowerCase()
    expenses = expenses.filter((e) =>
      e.categories?.[0]?.name?.toLowerCase().includes(hint)
    )
  }

  return {
    banks: banksRes.data ?? [],
    expenses,
    revenues: revenuesRes.data ?? [],
    recurring: recurringRes.data ?? [],
  }
}
