import { supabase } from './supabase'

/**
 * Toggle a day for a participant. Inserts if not exists, deletes if exists.
 * Returns 'added' or 'removed'.
 */
export async function toggleAvailability(
  sessionId: string,
  participantId: string,
  date: string
): Promise<'added' | 'removed'> {
  const { data: existing, error: fetchError } = await supabase
    .from('availability')
    .select('id')
    .eq('participant_id', participantId)
    .eq('date', date)
    .maybeSingle()

  if (fetchError) {
    throw fetchError
  }

  if (existing) {
    const { error } = await supabase.from('availability').delete().eq('id', existing.id)
    if (error) {
      throw error
    }
    return 'removed'
  } else {
    const { error } = await supabase
      .from('availability')
      .insert({ session_id: sessionId, participant_id: participantId, date })
    if (error) {
      throw error
    }
    return 'added'
  }
}
