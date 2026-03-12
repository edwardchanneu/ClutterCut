import { supabase } from './supabase'
import type { QueuedRun } from '../../../shared/ipcChannels'

export const getRuns = async (userId: string): Promise<QueuedRun[]> => {
  const { data, error } = await supabase
    .from('organization_runs')
    .select('*')
    .eq('user_id', userId)
    .order('ran_at', { ascending: false })

  if (error) {
    throw error
  }

  return data as QueuedRun[]
}
