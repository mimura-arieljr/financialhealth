import "@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "@supabase/supabase-js"

// Set with `supabase secrets set EXPENSE_API_KEY=... EXPENSE_USER_ID=...`
const EXPENSE_API_KEY = Deno.env.get("EXPENSE_API_KEY")
const EXPENSE_USER_ID = Deno.env.get("EXPENSE_USER_ID")
// Optional IANA zone used for the default date, e.g. "America/Toronto"
const TIMEZONE = Deno.env.get("TIMEZONE") ?? "UTC"
// Automatically injected by supabase runtime
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })

// Constant-time compare so the key can't be guessed byte by byte
const safeEqual = (a: string, b: string) => {
  const enc = new TextEncoder()
  const x = enc.encode(a)
  const y = enc.encode(b)
  let diff = x.length ^ y.length
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    diff |= (x[i] ?? 0) ^ (y[i] ?? 0)
  }
  return diff === 0
}

const todayInZone = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE }).format(new Date())

type Named = { id: string; name: string }

const findByName = (rows: Named[], name: string) =>
  rows.find((r) => r.name.trim().toLowerCase() === name.trim().toLowerCase())

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405)
  }

  if (!EXPENSE_API_KEY || !EXPENSE_USER_ID) {
    return json({ error: "Function is not configured" }, 500)
  }
  const key = req.headers.get("x-api-key") ?? ""
  if (!safeEqual(key, EXPENSE_API_KEY)) {
    return json({ error: "Unauthorized" }, 401)
  }

  try {
    const body = await req.json().catch(() => null)
    if (!body || typeof body !== "object") {
      return json({ error: "Body must be a JSON object" }, 400)
    }

    const { description, amount, bank, category, credit_card, date, is_marked } = body

    const parsedAmount = Number(amount)
    if (typeof description !== "string" || !description.trim()) {
      return json({ error: "description is required" }, 400)
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return json({ error: "amount must be a positive number" }, 400)
    }
    if (typeof bank !== "string" || !bank.trim()) {
      return json({ error: "bank is required (bank name)" }, 400)
    }
    if (date !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(String(date))) {
      return json({ error: "date must be YYYY-MM-DD" }, 400)
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    const [banksRes, categoriesRes, cardsRes] = await Promise.all([
      supabase.from("banks").select("id, name").eq("user_id", EXPENSE_USER_ID),
      supabase.from("categories").select("id, name").eq("user_id", EXPENSE_USER_ID),
      supabase.from("credit_cards").select("id, name").eq("user_id", EXPENSE_USER_ID),
    ])
    const lookupError = banksRes.error ?? categoriesRes.error ?? cardsRes.error
    if (lookupError) throw new Error(lookupError.message)

    // Unknown names are rejected so a typo never files an expense under nothing
    const resolve = (label: string, rows: Named[], name: unknown, required: boolean) => {
      if (name === undefined || name === null || name === "") {
        return required ? { error: `${label} is required` } : { id: null }
      }
      const match = findByName(rows, String(name))
      if (match) return { id: match.id }
      return { error: `Unknown ${label} "${name}". Valid: ${rows.map((r) => r.name).join(", ")}` }
    }

    const bankMatch = resolve("bank", banksRes.data ?? [], bank, true)
    const categoryMatch = resolve("category", categoriesRes.data ?? [], category, false)
    const cardMatch = resolve("credit_card", cardsRes.data ?? [], credit_card, false)
    for (const m of [bankMatch, categoryMatch, cardMatch]) {
      if ("error" in m) return json({ error: m.error }, 400)
    }

    const cardId = (cardMatch as { id: string | null }).id

    const { data, error } = await supabase
      .from("expenses")
      .insert({
        user_id: EXPENSE_USER_ID,
        description: description.trim(),
        amount: parsedAmount,
        date: date ?? todayInZone(),
        category_id: (categoryMatch as { id: string | null }).id,
        bank_id: (bankMatch as { id: string }).id,
        credit_card_id: cardId,
        is_card_settled: cardId ? false : null,
        is_marked: Boolean(is_marked),
      })
      .select("id, description, amount, date")
      .single()
    if (error) throw new Error(error.message)

    return json({ ok: true, expense: data }, 201)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return json({ error: message }, 500)
  }
})
