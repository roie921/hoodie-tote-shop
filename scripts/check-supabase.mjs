import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  console.error('FAIL  .env.local is missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY')
  process.exit(1)
}

const supabase = createClient(url, key, {
  global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(10000) }) },
})
let failures = 0

function report(passed, label, detail = '') {
  if (!passed) failures += 1
  console.log(`${passed ? 'PASS' : 'FAIL'}  ${label}${detail ? ` (${detail})` : ''}`)
}

const categories = await supabase.from('categories').select('id, name')
report(
  !categories.error && categories.data.length >= 2,
  'Read categories',
  categories.error ? categories.error.message : `${categories.data.length} rows`
)

if (categories.error) {
  console.error('\nCannot reach Supabase. Check VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY and that the SQL files 01 to 04 were run.')
  process.exit(1)
}

const products = await supabase
  .from('products')
  .select('id, slug, name, price, category_id, product_variants(color_key, color_name, size, stock_quantity)')
report(
  !products.error && products.data.length >= 1,
  'Read products with variants',
  products.error ? products.error.message : `${products.data.length} products`
)
if (!products.error && products.data.length > 0) {
  const first = products.data[0]
  console.log(`      example: ${first.slug} -> ${first.product_variants.length} variants`)
}

const insertAttempt = await supabase
  .from('products')
  .insert({ slug: 'rls-test-product', category_id: '00000000-0000-0000-0000-000000000000', name: 'RLS test', price: 1 })

report(Boolean(insertAttempt.error?.code), 'Visitor cannot insert products (RLS)', insertAttempt.error?.message)

for (const table of ['profiles', 'orders', 'order_items', 'custom_designs']) {
  const result = await supabase.from(table).select('*')
  const blocked = result.error ? Boolean(result.error.code) : result.data.length === 0
  report(blocked, `Visitor cannot read ${table}`, result.error ? result.error.message : '0 rows')
}

console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) failed.`)
process.exit(failures === 0 ? 0 : 1)
