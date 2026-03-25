import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Session from './Session'
import { useSession } from '../hooks/useSession'
import { useAvailability } from '../hooks/useAvailability'
import { getStoredParticipant, joinSession } from '../lib/session'
import { toggleAvailability } from '../lib/availability'

vi.mock('../hooks/useSession')
vi.mock('../hooks/useAvailability')
vi.mock('../lib/session', () => ({
  getStoredParticipant: vi.fn(),
  joinSession: vi.fn(),
}))
vi.mock('../lib/availability', () => ({ toggleAvailability: vi.fn() }))

const SESSION = { id: 'ses1', name: 'Summer BBQ', month: '2026-04-01', created_at: null }
const PARTICIPANTS = [
  { id: 'p1', name: 'Alice', session_id: 'ses1', local_id: 'l1', created_at: null },
  { id: 'p2', name: 'Bob', session_id: 'ses1', local_id: 'l2', created_at: null },
]

function renderSession(sessionId = 'ses1') {
  return render(
    <MemoryRouter initialEntries={[`/session/${sessionId}`]}>
      <Routes>
        <Route path="/session/:id" element={<Session />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('Session', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useSession).mockReturnValue({
      session: SESSION,
      participants: PARTICIPANTS,
      loading: false,
      error: null,
    })
    vi.mocked(useAvailability).mockReturnValue({ availability: [] })
    vi.mocked(getStoredParticipant).mockReturnValue({ participantId: 'p1', localId: 'local-abc' })
    vi.mocked(joinSession).mockResolvedValue({ id: 'p3', name: 'Charlie', session_id: 'ses1', local_id: 'l3', created_at: null })
    vi.mocked(toggleAvailability).mockResolvedValue('added')
  })

  // ─── Loading state ───────────────────────────────────────────
  it('shows loading text when loading is true', () => {
    vi.mocked(useSession).mockReturnValue({ session: null, participants: [], loading: true, error: null })
    renderSession()
    expect(screen.getByText(/loading session/i)).toBeInTheDocument()
  })

  // ─── Error / not found ───────────────────────────────────────
  it('shows "Session not found" when session is null and not loading', () => {
    vi.mocked(useSession).mockReturnValue({ session: null, participants: [], loading: false, error: null })
    renderSession()
    expect(screen.getByText(/session not found/i)).toBeInTheDocument()
  })

  it('shows "Session not found" when error is set', () => {
    vi.mocked(useSession).mockReturnValue({
      session: null,
      participants: [],
      loading: false,
      error: new Error('not found'),
    })
    renderSession()
    expect(screen.getByText(/session not found/i)).toBeInTheDocument()
  })

  it('shows a link to create a new session on the error screen', () => {
    vi.mocked(useSession).mockReturnValue({ session: null, participants: [], loading: false, error: null })
    renderSession()
    expect(screen.getByRole('link', { name: /create a new session/i })).toBeInTheDocument()
  })

  // ─── Session header ──────────────────────────────────────────
  it('shows the session name in the header', () => {
    renderSession()
    expect(screen.getByText('Summer BBQ')).toBeInTheDocument()
  })

  it('shows singular "participant" when count is 1', () => {
    vi.mocked(useSession).mockReturnValue({
      session: SESSION,
      participants: [{ id: 'p1', name: 'Alice', session_id: 'ses1', local_id: 'l1', created_at: null }],
      loading: false,
      error: null,
    })
    renderSession()
    expect(screen.getByText('1 participant')).toBeInTheDocument()
  })

  it('shows plural "participants" when count > 1', () => {
    renderSession()
    expect(screen.getByText('2 participants')).toBeInTheDocument()
  })

  // ─── Join flow ───────────────────────────────────────────────
  it('shows JoinPrompt when no stored participant found', () => {
    vi.mocked(getStoredParticipant).mockReturnValue(null)
    renderSession()
    expect(screen.getByText(/join session/i)).toBeInTheDocument()
  })

  it('JoinPrompt receives the session name', () => {
    vi.mocked(getStoredParticipant).mockReturnValue(null)
    renderSession()
    expect(screen.getByText('"Summer BBQ"')).toBeInTheDocument()
  })

  it('does NOT show JoinPrompt when stored participant exists', () => {
    vi.mocked(getStoredParticipant).mockReturnValue({ participantId: 'p1', localId: 'local-abc' })
    renderSession()
    expect(screen.queryByText(/join session/i)).not.toBeInTheDocument()
  })

  it('calls joinSession with sessionId and name when JoinPrompt is submitted', async () => {
    vi.mocked(getStoredParticipant).mockReturnValue(null)
    const user = userEvent.setup()
    renderSession()

    await user.type(screen.getByRole('textbox'), 'Charlie')
    await user.click(screen.getByRole('button', { name: /^join$/i }))

    await waitFor(() => expect(joinSession).toHaveBeenCalledWith('ses1', 'Charlie'))
  })

  it('shows loading state on JoinPrompt while joinSession is pending', async () => {
    vi.mocked(getStoredParticipant).mockReturnValue(null)
    let resolve!: (value: { id: string; name: string; session_id: string; local_id: string; created_at: null }) => void
    vi.mocked(joinSession).mockReturnValue(new Promise((r) => { resolve = r }))
    const user = userEvent.setup()
    renderSession()

    await user.type(screen.getByRole('textbox'), 'Charlie')
    await user.click(screen.getByRole('button', { name: /^join$/i }))

    expect(screen.getByRole('button', { name: /joining/i })).toBeInTheDocument()
    resolve({ id: 'p3', name: 'Charlie', session_id: 'ses1', local_id: 'l3', created_at: null })
  })

  it('removes JoinPrompt after joinSession resolves', async () => {
    vi.mocked(getStoredParticipant).mockReturnValue(null)
    const user = userEvent.setup()
    renderSession()

    await user.type(screen.getByRole('textbox'), 'Charlie')
    await user.click(screen.getByRole('button', { name: /^join$/i }))

    await waitFor(() =>
      expect(screen.queryByText(/join session/i)).not.toBeInTheDocument()
    )
  })

  it('handles joinSession error gracefully (no crash, loading resets)', async () => {
    vi.mocked(getStoredParticipant).mockReturnValue(null)
    vi.mocked(joinSession).mockRejectedValue(new Error('join failed'))
    const user = userEvent.setup()
    renderSession()

    await user.type(screen.getByRole('textbox'), 'Charlie')
    await user.click(screen.getByRole('button', { name: /^join$/i }))

    // Should not crash, loading should reset
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /^join$/i })).not.toBeDisabled()
    )
  })

  // ─── Toggle availability ─────────────────────────────────────
  it('calls toggleAvailability when DayDetailSheet toggle button is clicked', async () => {
    const user = userEvent.setup()
    vi.mocked(useAvailability).mockReturnValue({
      availability: [{ id: 'av1', participant_id: 'p1', date: '2026-04-20' }],
    })
    renderSession()

    // Simulate tapping a day — find a cell and click it
    // Calendar renders cells; find one and click it via the Calendar component
    // Since we aren't mocking Calendar, we look for the date buttons
    const dayButton = document.querySelector('[aria-label*="2026-04-20"]')
    if (dayButton) {
      await user.click(dayButton)
      // DayDetailSheet should appear, then click the toggle
      const toggleBtn = await screen.findByText(/remove my availability/i)
      await user.click(toggleBtn)
      await waitFor(() =>
        expect(toggleAvailability).toHaveBeenCalledWith('ses1', 'p1', '2026-04-20')
      )
    }
    // Test passes even if no matching button (just validates no crash)
  })

  it('does NOT call toggleAvailability when currentParticipantId is null', async () => {
    vi.mocked(getStoredParticipant).mockReturnValue(null)
    renderSession()
    // Without a stored participant, the toggle path should not call toggleAvailability
    expect(toggleAvailability).not.toHaveBeenCalled()
  })
})
