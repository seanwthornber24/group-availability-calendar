import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getSession } from '../lib/session'

export function useSession(sessionId) {
  const [session, setSession] = useState(null)
  const [participants, setParticipants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!sessionId) { return }

    let cancelled = false

    async function load() {
      try {
        const [sessionData, { data: participantsData, error: pErr }] = await Promise.all([
          getSession(sessionId),
          supabase.from('participants').select('*').eq('session_id', sessionId),
        ])
        if (pErr) { throw pErr }
        if (!cancelled) {
          setSession(sessionData)
          setParticipants(participantsData ?? [])
          setLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err)
          setLoading(false)
        }
      }
    }

    load()

    const channel = supabase
      .channel(`session-participants-${sessionId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'participants', filter: `session_id=eq.${sessionId}` },
        (payload) => setParticipants((prev) => [...prev, payload.new])
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'participants', filter: `session_id=eq.${sessionId}` },
        (payload) => setParticipants((prev) => prev.filter((p) => p.id !== payload.old.id))
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [sessionId])

  return { session, participants, loading, error }
}
