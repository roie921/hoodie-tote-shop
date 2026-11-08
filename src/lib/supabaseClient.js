import { createClient } from '@supabase/supabase-js'

// These values come from the ".env.local" file (see ".env.example").
// The anon key is public by design: Row Level Security protects the data.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase settings. Copy .env.example to .env.local and fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then restart "npm run dev".'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
