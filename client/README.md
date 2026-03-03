# Financial Health

A personal finance tracker for managing bank balances, expenses, revenues, and credit card debt — built for the Philippine Peso (₱).

## Features

- **Dashboard** — at-a-glance summary of total bank balance, credit card debt, monthly spending, and net surplus/deficit; 6-month expense vs. revenue trend chart; spending breakdown by category
- **Expenses** — log and manage spending with category, bank, and credit card tagging; filter by month, category, or bank
- **Revenues** — track income and transfers per bank account; filter by month or bank
- **Settings** — manage banks (with initial balances), credit cards, and spending categories

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [React 19](https://react.dev) |
| Build tool | [Vite 7](https://vite.dev) |
| Routing | [React Router v7](https://reactrouter.com) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| Backend / Auth / DB | [Supabase](https://supabase.com) (PostgreSQL + Auth) |
| Charts | [Recharts](https://recharts.org) |

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

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
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
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

- **`banks`** — `id`, `user_id`, `name`, `initial_balance`
- **`credit_cards`** — `id`, `user_id`, `name`
- **`categories`** — `id`, `user_id`, `name`
- **`expenses`** — `id`, `user_id`, `description`, `amount`, `date`, `bank_id`, `credit_card_id`, `category_id`, `is_card_settled`, `created_at`
- **`revenues`** — `id`, `user_id`, `description`, `amount`, `date`, `bank_id`, `created_at`

Enable Row Level Security (RLS) on all tables and add policies so users can only access their own rows.
