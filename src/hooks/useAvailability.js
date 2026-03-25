import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useAvailability(sessionId) {
  const [availability, setAvailability] = useState([])

  useEffect(() => {
    if (!sessionId) { return }

    let cancelled = false

    async function load() {
      const { data, error } = await supabase
        .from('availability')
        .select('id, participant_id, date')
        .eq('session_id', sessionId)
      if (!cancelled && !error) { setAvailability(data ?? []) }
    }

    load()

    const channel = supabase
      .channel(`session-availability-${sessionId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'availability', filter: `session_id=eq.${sessionId}` },
        (payload) =>
          setAvailability((prev) => [
            ...prev,
            { id: payload.new.id, participant_id: payload.new.participant_id, date: payload.new.date },
          ])
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'availability' },
        (payload) =>
          setAvailability((prev) => prev.filter((a) => a.id !== payload.old.id))
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [sessionId])

  return { availability }
}
