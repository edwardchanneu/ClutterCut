import type { AuthError } from '@supabase/supabase-js'
import { supabase } from './supabase'

/**
 * Signs the current user out of Supabase and clears the locally persisted session.
 * Returns the Supabase AuthError if one occurred, otherwise null.
 */
export async function signOut(): Promise<AuthError | null> {
  console.log('[auth] signOut called')
  const { error } = await supabase.auth.signOut()
  console.log('[auth] signOut result:', error ?? 'success ✓')
  return error ?? null
}
