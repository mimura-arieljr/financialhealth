# add-expense

Edge function that logs an expense from a plain HTTP request, for example an iOS Shortcut or `curl`.

It does the same insert as the Expenses page, so bank balances and card debt update the same way.

## Auth

- `verify_jwt` is off for this function (see `supabase/config.toml`).
- The caller sends a shared secret in the `x-api-key` header.
- The function compares it to `EXPENSE_API_KEY` and inserts as the user in `EXPENSE_USER_ID`, using the service role key on the server.

## Secrets

| Secret | Purpose |
|---|---|
| `EXPENSE_API_KEY` | Shared secret the caller must send in `x-api-key` |
| `EXPENSE_USER_ID` | `auth.users` id that owns the inserted expenses |
| `TIMEZONE` | Optional IANA zone for the default date. Defaults to `UTC`, use `Asia/Manila` for PH time |

## Deploy

```bash
supabase secrets set \
  EXPENSE_API_KEY="$(openssl rand -hex 32)" \
  EXPENSE_USER_ID=<auth user uuid> \
  TIMEZONE=Asia/Manila
supabase functions deploy add-expense
```

The generated key is not printed. Generate it separately if you need to copy it into your Shortcut.

## Request

`POST https://<project-ref>.supabase.co/functions/v1/add-expense` with a JSON body.

| Field | Required | Notes |
|---|---|---|
| `description` | yes | Non-empty string |
| `amount` | yes | Positive number |
| `bank` | yes | Bank name |
| `category` | no | Category name |
| `credit_card` | no | Credit card name. The expense is saved as unsettled |
| `date` | no | `YYYY-MM-DD`. Defaults to today in `TIMEZONE` |
| `is_marked` | no | Boolean, defaults to `false` |

- `bank`, `category` and `credit_card` are names, not ids.
- Names match case-insensitively.
- An unknown name returns `400` and lists the valid names.

## Examples

Minimal:

```bash
curl -X POST https://<project-ref>.supabase.co/functions/v1/add-expense \
  -H "x-api-key: <your key>" \
  -H "Content-Type: application/json" \
  -d '{"description":"Jollibee","amount":250,"bank":"Maya"}'
```

All fields:

```bash
curl -X POST https://<project-ref>.supabase.co/functions/v1/add-expense \
  -H "x-api-key: <your key>" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Groceries",
    "amount": 1840.50,
    "bank": "BPI",
    "category": "Food",
    "credit_card": "<card name>",
    "date": "2026-10-17",
    "is_marked": true
  }'
```

To avoid pasting the key each time:

```bash
export EXPENSE_API_KEY=<your key>
curl -X POST ... -H "x-api-key: $EXPENSE_API_KEY" ...
```

## Responses

| Status | Meaning |
|---|---|
| `201` | Saved. Body is `{"ok":true,"expense":{"id","description","amount","date"}}` |
| `400` | Invalid body, or unknown bank, category or credit card |
| `401` | Missing or wrong `x-api-key` |
| `405` | Method was not `POST` |
| `500` | Secrets not set, or the database call failed |

## iOS Shortcut

Use a "Get Contents of URL" action:

- URL: the endpoint above
- Method: `POST`
- Headers: `x-api-key` set to your key
- Request Body: `JSON`, with the fields from the table
