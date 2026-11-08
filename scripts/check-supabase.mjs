// Checks the Supabase connection and the Row Level Security rules
// from the point of view of a visitor who is NOT logged in.
// Run with: npm run check:supabase
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error('FAIL  .env.local is missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
  process.exit(1)
}

// Give up after 10 seconds so a wrong URL does not hang the script.
const supabase = createClient(url, key, {
  global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(10000) }) },
})
let failures = 0

function report(passed, label, detail = '') {
  if (!passed) failures += 1
  console.log(`${passed ? 'PASS' : 'FAIL'}  ${label}${detail ? ` (${detail})` : ''}`)
}

// 1. Connection + seed data: categories
const categories = await supabase.from('categories').select('id, name')
report(
  !categories.error && categories.data.length >= 2,
  'Read categories',
  categories.error ? categories.error.message : `${categories.data.length} rows`
)

// Stop here if the connection itself failed, the next checks would be meaningless.
if (categories.error) {
  console.error('\nCannot reach Supabase. Check VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY and that 01_schema.sql, 02_rls_policies.sql and 03_seed.sql were run.')
  process.exit(1)
}

// 2. Products with their colors (uses the foreign key product_colors.product_id)
const products = await supabase
  .from('products')
  .select('id, name, price, category_id, product_colors(color_key, name, hex)')
report(
  !products.error && products.data.length >= 1,
  'Read products with colors',
  products.error ? products.error.message : `${products.data.length} products`
)
if (!products.error && products.data.length > 0) {
  const first = products.data[0]
  console.log(`      example: ${first.id} -> ${first.product_colors.length} colors`)
}

// 3. A visitor must NOT be able to create a product
const insertAttempt = await supabase
  .from('products')
  .insert({ id: 'rls-test-product', category_id: 'hoodie', name: 'RLS test', price: 1 })
// A real database rejection has an error code (for example 42501). A network error has none.
report(Boolean(insertAttempt.error?.code), 'Visitor cannot insert products (RLS)', insertAttempt.error?.message)

// 4. A visitor must NOT see private tables (an error or zero rows are both fine)
for (const table of ['profiles', 'orders', 'order_items', 'saved_designs']) {
  const result = await supabase.from(table).select('*')
  const blocked = result.error ? Boolean(result.error.code) : result.data.length === 0
  report(blocked, `Visitor cannot read ${table}`, result.error ? result.error.message : '0 rows')
}

console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) failed.`)
process.exit(failures === 0 ? 0 : 1)
