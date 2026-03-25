export interface Session {
  id: string
  name: string
  month: string
  created_at: string | null
}

export interface Participant {
  id: string
  session_id: string
  name: string
  local_id: string
  created_at: string | null
}

export interface AvailabilityRow {
  id: string
  participant_id: string
  date: string
}

export interface DayCellStyle {
  bg: string
  textColor: string
}

export interface StoredParticipant {
  localId: string
  participantId: string
}
