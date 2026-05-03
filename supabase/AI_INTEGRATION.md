# AI Integration — Financial Health

This document covers how the AI assistant feature was set up and how it works under the hood.

---

## Overview

The AI assistant lets users ask natural language questions about their finances (e.g. "Can I afford a new laptop?", "Where did my money go last month?"). It works by:

1. Detecting the user's intent from their question
2. Extracting query parameters (date range, category filter)
3. Fetching only the relevant financial data from the database
4. Shaping that data into a lean context
5. Sending the context + question to Gemini and returning the answer

The Gemini API key never touches the browser — it lives only inside the Edge Function.

```
React App  →  Supabase Edge Function  →  Gemini API
               ├── detectIntent
               ├── extractQueryParams
               ├── fetchFinancialData
               ├── buildFinancialContext
               └── buildPromptForUserNeeds
```

---

## Pipeline

### 1. Intent Detection (`helpers/detectIntent.ts`)

Before fetching any data, the function classifies the user's question into one of four intents:

| Intent | Covers |
|---|---|
| `expenses` | Spending, purchases, categories |
| `income` | Earnings, salary, revenue |
| `budget` | Savings, affordability, balance |
| `general` | Anything that doesn't clearly fit one category |

Detection uses a **two-tier cascade**:

**Tier 1 — Keyword scoring** (`helpers/intentPatterns.ts`)

Each intent has a list of regex patterns with weights:
- **Score 3** — strong phrases (`"how much did i spend"`, `"will i be able to afford"`)
- **Score 2** — partial phrases (`"spent on"`, `"monthly rent"`)
- **Score 1** — single keywords (`"spend"`, `"budget"`, `"balance"`)

The intent with the highest total score wins, provided it clears a **confidence threshold** (score ≥ 2) and leads the next-best intent by more than the **ambiguity margin** (> 1 point). This avoids false positives on vague questions.

**Tier 2 — LLM fallback**

Only triggered when keyword scoring is ambiguous or produces no match. A minimal constrained prompt is sent to Gemini asking for a single-word classification. This keeps costs low — most questions are resolved by Tier 1.

```
"what is my biggest spend category?"
  → expenses score: 7  (matches /biggest (?:spend|expense)/ + /spend(?:ing)? categor/ + /spend/)
  → Tier 1 wins, no LLM call needed

"what's my general financial situation?"
  → all scores: 0
  → falls through to Gemini for classification
```

To add new patterns, edit `helpers/intentPatterns.ts` — no logic changes needed.

---

### 2. Parameter Extraction (`helpers/extractQueryParams.ts`)

After intent, the question is parsed for filters that shape the database query:

**Date range** — resolved from natural language to absolute `YYYY-MM-DD` dates:

| Phrase | Resolves to |
|---|---|
| `"last week"` | 7 days ago → today |
| `"this month"` | 1st of current month → today |
| `"last month"` | Full previous month |
| `"this year"` | Jan 1 → today |
| `"last year"` | Full previous year |
| `"in January"` | Most recent January |
| *(nothing)* | Last 3 months (default) |

All dates use **local time**, not UTC, to avoid off-by-one errors across timezones.

**Category hint** — extracted from phrases like `"spent on food"`, `"paying for Netflix"`, `"food expenses"`. Used to filter expense rows client-side after fetching.

---

### 3. Data Fetching (`helpers/fetchFinancialData.ts`)

Queries only the tables that the detected intent actually needs:

| Intent | Tables queried |
|---|---|
| `expenses` | `banks`, `expenses` |
| `income` | `banks`, `revenues` |
| `budget` | `banks`, `expenses`, `revenues`, `recurring_expenses` |
| `general` | All four tables |

Date range filters are applied at the query level (not post-fetch), and category hint filtering is applied immediately after fetch before returning data to the shaping layer.

---

### 4. Data Shaping (`helpers/buildFinancialContext.ts`)

Raw rows are aggregated into a lean JSON context before being sent to Gemini. Key decisions:

**Accurate averages** — Monthly averages divide by the number of months that *actually have data*, not the number of months in the requested range. This prevents artificially low averages for new users who only have 1–2 months of history.

```
User with 1 month of data asking "what's my average monthly spend?"
  ✗ totalExpenses / 3  →  understates reality
  ✓ totalExpenses / countDistinctMonths(expenses)  →  accurate
```

**Intent-gated context** — Only the fields relevant to the intent are included in the output. An `income` question doesn't send expense rows to Gemini; a `budget` question doesn't send raw income rows.

**Period metadata** — The context always includes `from`, `to`, `income_months_with_data`, and `expense_months_with_data` so the model can reason accurately about the time window (e.g. "based on 1 month of data").

---

### 5. Prompt Building (`helpers/promptBuilder.ts`)

The shaped context is injected into a structured prompt that instructs Gemini to:
- Use only the provided data (no hallucinated numbers)
- Respond in Philippine Peso (₱)
- Prefer actionable insights over restating data

---

## File Structure

```
supabase/functions/ai-chat/
├── index.ts                        # Request handler, orchestrates the pipeline
├── classifyIntentWithLLM.ts        # LLM fallback for intent classification
├── types/
│   ├── intent.ts                   # Intent type definition
│   └── queryParams.ts              # QueryParams / DateRange types
└── helpers/
    ├── detectIntent.ts             # Keyword scoring + LLM fallback logic
    ├── intentPatterns.ts           # All regex patterns by intent (edit here to add patterns)
    ├── extractQueryParams.ts       # Date range + category hint extraction
    ├── fetchFinancialData.ts       # Intent-gated Supabase queries
    ├── buildFinancialContext.ts    # Aggregation and context shaping
    └── promptBuilder.ts            # Gemini prompt templates
```

---

## Prerequisites

### 1. Supabase CLI

```bash
brew install supabase/tap/supabase
supabase --version
```

### 2. Deno

```bash
brew install deno
deno --version
```

### 3. Gemini API Key

- Go to https://aistudio.google.com
- Click **Get API key** → Create a new key
- Free tier: 1,500 requests/day — no credit card needed
- Save the key somewhere safe; you'll need it below

---

## Step 1 — Initialize Supabase locally

From the project root:

```bash
supabase init
```

Accept the defaults. If it says already initialized, that's fine.

---

## Step 2 — Create the Edge Function

```bash
supabase functions new ai-chat
```

This creates `supabase/functions/ai-chat/index.ts`.

Also update `supabase/functions/ai-chat/deno.json` to include the supabase-js import:

```json
{
  "imports": {
    "@supabase/functions-js": "jsr:@supabase/functions-js@^2",
    "@supabase/supabase-js": "jsr:@supabase/supabase-js@2"
  }
}
```

To cache dependencies locally (clears IDE warnings):

```bash
cd supabase/functions/ai-chat && deno cache index.ts
```

---

## Step 3 — Link your project and store the API key

Log in to Supabase CLI:

```bash
supabase login
```

Link to your Supabase project:

```bash
supabase link
```

Store the Gemini API key as a secret (never commit this to git):

```bash
supabase secrets set GEMINI_API_KEY=your_actual_key_here
```

Verify it was saved:

```bash
supabase secrets list
```

---

## Step 4 — Deploy the Edge Function

```bash
supabase functions deploy ai-chat
```

The deployed function URL will be:

```
https://<your-project-ref>.supabase.co/functions/v1/ai-chat
```

To redeploy after any code changes, just run the same command again.

---

## Step 5 — Frontend integration

Three files were added/updated on the React side:

### `client/src/pages/ai.jsx` (new)
The chat UI page. Calls the Edge Function with the user's Supabase session token and renders the conversation.

### `client/src/App.jsx`
Added the `/ai` route:
```jsx
import AiChat from './pages/ai'
// ...
<Route path="ai" element={<AiChat />} />
```

### `client/src/components/layout/layout.jsx`
Added the AI nav item to `navItems`:
```jsx
{
  to: '/ai',
  label: 'AI',
  icon: <svg>...</svg>
}
```

---

## Secrets reference

| Secret | Description |
|--------|-------------|
| `GEMINI_API_KEY` | Google AI Studio API key |
| `SUPABASE_URL` | Auto-injected by Supabase at runtime |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-injected by Supabase at runtime |

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` do not need to be set manually — Supabase injects them automatically inside every Edge Function.

---

## Extending intent detection

To handle a new type of question without triggering the LLM fallback, add a pattern to `helpers/intentPatterns.ts`:

```ts
// In the expenses array:
{ pattern: /my subscription costs/i, score: 3 },
```

Use score 3 for specific phrases, score 2 for partial phrases, score 1 for keywords. A question needs a total score ≥ 2 with a lead > 1 over the next intent to be classified confidently.

---

## Cost

- **Supabase Edge Functions**: Free up to 500,000 invocations/month
- **Gemini API**: Free up to 1,500 requests/day (Google AI Studio free tier)
- **LLM intent fallback**: Only fires when keyword scoring is inconclusive — typical questions never incur this extra call

For personal use, this integration runs at zero cost.
