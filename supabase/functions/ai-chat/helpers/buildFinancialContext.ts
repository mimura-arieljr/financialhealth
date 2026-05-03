import { SupabaseClient } from "@supabase/supabase-js"
import { Intent } from "../types/intent.ts"
import { QueryParams } from "../types/queryParams.ts"
import { fetchFinancialData } from "./fetchFinancialData.ts"

export async function buildFinancialContext(
  supabase: SupabaseClient,
  userId: string,
  intent: Intent,
  params: QueryParams
): Promise<string> {
  const { banks, expenses, revenues, recurring } = await fetchFinancialData(
    supabase,
    userId,
    intent,
    params
  )

  console.log("Building financial context with params:", { userId, intent, params })

  const { from, to } = params.dateRange
  const fmt = (n: number) => Number(n.toFixed(2))

  function normalizeToMonthly(amount: number, freq: string) {
    if (freq === "weekly") return amount * 4.33
    if (freq === "yearly") return amount / 12
    return amount
  }

  const recurringMonthly = recurring.map((r) => ({
    description: r.description,
    monthly_amount: fmt(normalizeToMonthly(r.amount, r.frequency)),
  }))

  const expensesByCategory: Record<string, number> = {}
  let totalExpenses = 0
  for (const e of expenses) {
    const category = e.categories?.[0]?.name ?? "Uncategorized"
    expensesByCategory[category] = (expensesByCategory[category] ?? 0) + e.amount
    totalExpenses += e.amount
  }

  let totalRevenue = 0
  for (const r of revenues) {
    totalRevenue += r.amount
  }

  const incomeMonths = countDistinctMonths(revenues.map((r) => r.date))
  const expenseMonths = countDistinctMonths(expenses.map((e) => e.date))

  const avgIncome = totalRevenue / incomeMonths
  const avgExpenses = totalExpenses / expenseMonths
  const recurringTotal = recurringMonthly.reduce((sum, r) => sum + r.monthly_amount, 0)
  const netSavings = avgIncome - avgExpenses
  const savingsRate = avgIncome > 0 ? (netSavings / avgIncome) * 100 : 0

  const topCategories = Object.entries(expensesByCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, amount]) => ({ name, amount: fmt(amount / expenseMonths) }))

  const totalBalance = banks.reduce((sum, b) => sum + (b.current_balance ?? 0), 0)

  const context: Record<string, unknown> = {
    period: {
      from,
      to,
      income_months_with_data: incomeMonths,
      expense_months_with_data: expenseMonths,
    },
    summary: {
      avg_monthly_income: fmt(avgIncome),
      avg_monthly_expenses: fmt(avgExpenses),
      net_monthly_savings: fmt(netSavings),
      savings_rate_percent: fmt(savingsRate),
      recurring_monthly_total: fmt(recurringTotal),
      total_balance: fmt(totalBalance),
    },
  }

  if (intent === "expenses" || intent === "budget" || intent === "general") {
    context.top_expenses = topCategories
  }

  if (intent === "income" || intent === "general") {
    context.income = revenues
  }

  if (intent === "expenses" || intent === "general") {
    context.expenses = expenses.slice(0, 50)
  }

  if (intent === "budget" || intent === "general") {
    context.recurring_monthly = recurringMonthly
  }

  const contextResult = JSON.stringify(context, null, 2)
  console.log(contextResult)
  return contextResult
}

function countDistinctMonths(dates: string[]): number {
  const months = new Set(dates.map((d) => d.slice(0, 7)))
  return Math.max(1, months.size)
}
