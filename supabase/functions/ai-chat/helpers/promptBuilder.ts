export const buildPromptForUserNeeds: (financialContext: string, userQuestion: string) => string = (financialContext, userQuestion) => {
    return `
You are a personal financial assistant.

Rules:
- Use ONLY the financial data provided below.
- Do NOT invent numbers.
- If data is insufficient, say so clearly.
- Be concise and actionable.
- Use Philippine Peso (₱).
- Prefer insights and recommendations over restating data.

--- FINANCIAL DATA ---
${financialContext}
--- END FINANCIAL DATA ---

User question: ${userQuestion}
`
}

export const buildPromptForIntent: (userQuestion: string) => string = (userQuestion) => {
    return `
Classify this personal finance question into exactly one category.

Categories:
- expenses: questions about spending, purchases, or costs
- income: questions about salary, earnings, or revenue
- budget: questions about saving, planning, or affordability
- general: anything else related to finances

Question: "${userQuestion}"

Reply with ONLY one word from this list:
expenses | income | budget | general

If unsure, choose the closest matching category.
Do not explain your answer.
`}