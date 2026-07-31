import { supabase } from './supabase'

const DEFAULT_TTL_MS = 5 * 60 * 1000
const store = new Map()

function makeKey(table, userId, select) {
  return `${table}::${userId}::${select}`
}

// Fetches `select` columns from `table` for `userId`, serving from the
// in-memory cache when a fresh entry exists. Same { data, error } shape as
// a raw supabase query, so it can replace one directly.
export async function fetchCached(table, userId, select, order) {
  const key = makeKey(table, userId, select)
  const cached = store.get(key)
  if (cached && cached.expiresAt > Date.now()) {
    return { data: cached.data, error: null }
  }

  let query = supabase.from(table).select(select).eq('user_id', userId)
  if (order) query = query.order(order)
  const { data, error } = await query
  if (!error) store.set(key, { data, expiresAt: Date.now() + DEFAULT_TTL_MS })
  return { data, error }
}

// Clears every cached variant of `table` for `userId` (different pages
// request different columns, so there can be more than one cache entry).
export function invalidateTable(table, userId) {
  const prefix = `${table}::${userId}::`
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key)
  }
}
