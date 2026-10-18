# Fundora

A personal finance tracker for managing bank balances, expenses, revenues, transfers, and credit card debt, built for the Philippine Peso (₱).

## Features

- **Dashboard**: total bank balance, outstanding card debt, monthly spending, and net surplus/deficit; 6-month expense vs. revenue chart; spending by category; per-bank balances; marked expenses
- **Expenses**: log and manage spending with category, bank, and credit card tagging; mark expenses for follow-up; settle card expenses; filter by month, category, or bank
- **Revenues**: track income per bank account; filter by month or bank
- **Recurring**: define recurring expenses (monthly or weekly) and log them when due
- **Transfers**: move money between your own bank accounts
- **Analytics**: savings rate, projected year-end savings, 12-month net worth trend, income consistency
- **AI Chat**: ask natural language questions about your finances, answered by Gemini through an edge function
- **Settings**: manage banks (with initial balances), credit cards, and spending categories
- **Quick add API**: log an expense with a plain HTTP request, for example from an iOS Shortcut

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [React 19](https://react.dev) |
| Build tool | [Vite 7](https://vite.dev) |
| Routing | [React Router v7](https://reactrouter.com) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| Backend / Auth / DB | [Supabase](https://supabase.com) (PostgreSQL + Auth) |
| Server functions | Supabase Edge Functions (Deno) |
| AI | [Gemini](https://ai.google.dev) |
| Charts | [Recharts](https://recharts.org) |

## Project Structure

```
financialhealth/
├── client/                      React app (this directory)
│   └── src/
│       ├── pages/               One file per route
│       ├── components/          Layout and shared UI
│       ├── hooks/               useAuth
│       └── lib/                 Supabase client, cache, helpers
└── supabase/
    ├── config.toml
    ├── AI_INTEGRATION.md        How the AI assistant works
    └── functions/
        ├── ai-chat/             AI assistant
        └── add-expense/         Quick add API
```

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- [Supabase CLI](https://supabase.com/docs/guides/cli), only if you deploy the edge functions

### Setup

1. Clone the repository and navigate to the client directory:

   ```bash
   git clone <repo-url>
   cd financialhealth/client
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the `client/` directory:

   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_KEY=your_supabase_anon_key
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |

## Database Schema

The app expects the following tables in your Supabase project (all with a `user_id` column referencing `auth.users`):

- **`banks`**: `id`, `user_id`, `name`, `initial_balance`
- **`credit_cards`**: `id`, `user_id`, `name`
- **`categories`**: `id`, `user_id`, `name`
- **`expenses`**: `id`, `user_id`, `description`, `amount`, `date`, `bank_id`, `credit_card_id`, `category_id`, `is_card_settled`, `is_marked`, `created_at`
- **`revenues`**: `id`, `user_id`, `description`, `amount`, `date`, `bank_id`, `created_at`
- **`transfers`**: `id`, `user_id`, `from_bank_id`, `to_bank_id`, `amount`, `date`, `note`, `created_at`
- **`recurring_expenses`**: `id`, `user_id`, `description`, `amount`, `frequency`, `day_of_month`, `day_of_week`, `last_logged`, `category_id`, `bank_id`, `credit_card_id`, `is_active`

The `ai-chat` function also reads `bank_balances` (`name`, `current_balance`).

Bank balances are not stored in the app tables. The dashboard and analytics compute them from `initial_balance`, expenses, revenues, and transfers.

Enable Row Level Security (RLS) on all tables and add policies so users can only access their own rows.

## Edge Functions

Both functions live in `supabase/functions/`. Link the project once, then deploy:

```bash
supabase login
supabase link --project-ref <project-ref>
supabase functions deploy ai-chat
supabase functions deploy add-expense
```

| Function | Auth | Secrets | Docs |
|---|---|---|---|
| `ai-chat` | Supabase JWT (`verify_jwt = true`) | `GEMINI_API_KEY` | [AI_INTEGRATION.md](../supabase/AI_INTEGRATION.md) |
| `add-expense` | `x-api-key` header (`verify_jwt = false`) | `EXPENSE_API_KEY`, `EXPENSE_USER_ID`, `TIMEZONE` | [README](../supabase/functions/add-expense/README.md) |

### Quick add

`add-expense` inserts one expense per call. Banks, categories, and credit cards are sent by name:

```bash
curl -X POST https://<project-ref>.supabase.co/functions/v1/add-expense \
  -H "x-api-key: <your key>" \
  -H "Content-Type: application/json" \
  -d '{"description":"Jollibee","amount":250,"bank":"Maya"}'
```

See the function's README for all fields, secrets, and responses.
