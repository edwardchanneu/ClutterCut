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

export const updateRunStatus = async (runId: string, undone: boolean): Promise<void> => {
  const { error } = await supabase.from('organization_runs').update({ undone }).eq('id', runId)

  if (error) {
    throw error
  }
}

export const insertRun = async (
  runData: Omit<QueuedRun, 'synced_at'> & { synced_at?: string }
): Promise<void> => {
  const { error } = await supabase.from('organization_runs').insert(runData)

  if (error) {
    throw error
  }
}
