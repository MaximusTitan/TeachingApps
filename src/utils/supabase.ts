import { SupabaseClient, createClient } from '@supabase/supabase-js'

let supabaseInstance: SupabaseClient | null = null

export function initSupabase(supabaseUrl: string, supabaseAnonKey: string) {
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey)
  return supabaseInstance
}

export function getSupabaseClient() {
  if (!supabaseInstance) {
    throw new Error('Supabase client not initialized')
  }
  return supabaseInstance
}
