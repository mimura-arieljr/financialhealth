import { fmtPeso } from './utils'

// Each builder returns { before, strong, after }; the page renders `strong` in bold
const h = (before, strong = '', after = '') => ({ before, strong, after })
export const headlineText = ({ before, strong, after }) => before + strong + after

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`

// ", 12% less than X" / ", about the same as X"; empty when there is nothing to compare with
function comparisonClause(comparison) {
  if (!comparison || comparison.pct === null || comparison.pct === undefined || !comparison.against) return ''
  if (comparison.pct === 0) return `, about the same as ${comparison.against}`
  return `, ${Math.abs(comparison.pct)}% ${comparison.pct > 0 ? 'more' : 'less'} than ${comparison.against}`
}

export function dashboardHeadline({ spent, comparison }) {
  if (!spent) return h('Nothing spent yet this month.')
  const clause = comparisonClause(comparison)
  return h("You've spent ", fmtPeso(spent), clause ? `${clause}.` : ' so far.')
}

export function expensesHeadline({ total, count, monthName, top }) {
  if (!count) return h(monthName ? `No expenses in ${monthName}.` : 'No expenses yet.')
  const where = monthName ? `in ${monthName}` : 'in total'
  const topLine = monthName && top ? ` ${top.name} is your biggest category at ${fmtPeso(top.total)}.` : ''
  return h('', fmtPeso(total), ` across ${plural(count, 'expense', 'expenses')} ${where}.${topLine}`)
}

export function revenuesHeadline({ total, count, monthName, comparison }) {
  if (!count) return h(monthName ? `No income logged in ${monthName}.` : 'No income logged yet.')
  const where = monthName ? `in ${monthName}` : 'in total'
  const clause = monthName ? comparisonClause(comparison) : ''
  return h('', fmtPeso(total), ` from ${plural(count, 'entry', 'entries')} ${where}${clause}.`)
}

export function transfersHeadline({ total, count, monthName }) {
  if (!count) return h(monthName ? `No transfers in ${monthName}.` : 'No transfers yet.')
  const where = monthName ? ` in ${monthName},` : ''
  return h('', fmtPeso(total), ` moved between your banks${where} across ${plural(count, 'transfer', 'transfers')}.`)
}

export function recurringHeadline({ activeCount, monthlyTotal, dueCount }) {
  if (!activeCount) return h('No active recurring expenses.')
  const due = dueCount === 0 ? 'Nothing needs paying now.'
    : dueCount === 1 ? '1 needs paying now.'
      : `${dueCount} need paying now.`
  return h(`${activeCount} active, about `, `${fmtPeso(monthlyTotal)} a month`, `. ${due}`)
}

export function analyticsHeadline({ savingsRate, monthName }) {
  if (savingsRate === null || savingsRate === undefined) return h('No income logged yet this month.')
  if (savingsRate < 0) return h(`You're spending more than you earn in ${monthName}.`)
  const band = savingsRate >= 30 ? 'well above'
    : savingsRate > 20 ? 'above'
      : savingsRate === 20 ? 'right at'
        : 'below'
  return h("You're saving ", `${savingsRate}%`, ` of your income in ${monthName}, ${band} the 20% target.`)
}
