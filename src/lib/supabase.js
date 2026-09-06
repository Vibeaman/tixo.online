import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hibklbygzkpegxzgcatv.supabase.co'
const supabaseAnonKey = 'sb_publishable_KpRWeLAY1Ql64QrSlkWf3A_JXuX6R3b'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Keep the session in localStorage and silently refresh the access token
    // before it expires. These are the library defaults, but pinning them
    // explicitly guards against a future default change quietly signing
    // everyone out an hour into their session.
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})
