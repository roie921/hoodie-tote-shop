import { createClient } from '@supabase/supabase-js'

// These values come from the ".env.local" file (see ".env.example").
// The publishable key is public by design: Row Level Security protects the data.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    'Missing Supabase settings. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env.local, then restart "npm run dev".'
  )
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey)
