import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ParticipantList from './ParticipantList'

const PARTICIPANTS = [
  { id: 'p1', name: 'Alice', session_id: 's1', local_id: 'l1', created_at: null },
  { id: 'p2', name: 'Bob', session_id: 's1', local_id: 'l2', created_at: null },
  { id: 'p3', name: 'Carol', session_id: 's1', local_id: 'l3', created_at: null },
]

const AVAILABILITY = [
  { id: 'av1', participant_id: 'p1', date: '2026-04-01' },
  { id: 'av2', participant_id: 'p1', date: '2026-04-02' },
  { id: 'av3', participant_id: 'p1', date: '2026-04-03' },
  { id: 'av4', participant_id: 'p2', date: '2026-04-01' },
]

function renderList(props = {}) {
  const defaults = {
    participants: PARTICIPANTS,
    availability: AVAILABILITY,
    currentParticipantId: 'p1',
  }
  return render(<ParticipantList {...defaults} {...props} />)
}

describe('ParticipantList', () => {
  it('renders the heading with participant count', () => {
    renderList()
    expect(screen.getByText('Participants (3)')).toBeInTheDocument()
  })

  it('renders all participant names', () => {
    renderList()
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByText('Carol')).toBeInTheDocument()
  })

  it('shows "(you)" next to the current participant', () => {
    renderList({ currentParticipantId: 'p1' })
    expect(screen.getByText('(you)')).toBeInTheDocument()
  })

  it('does NOT show "(you)" on other participants', () => {
    renderList({ currentParticipantId: 'p1' })
    // Only one "(you)" in total
    expect(screen.getAllByText('(you)')).toHaveLength(1)
  })

  it('renders the current participant first', () => {
    renderList({ currentParticipantId: 'p2' })
    const allNames = screen.getAllByRole('paragraph').map((p) => p.textContent)
    const bobIndex = allNames.findIndex((t) => t?.includes('Bob'))
    const aliceIndex = allNames.findIndex((t) => t?.includes('Alice'))
    expect(bobIndex).toBeLessThan(aliceIndex)
  })

  it('shows the correct day count for each participant', () => {
    renderList()
    expect(screen.getByText('3 days free')).toBeInTheDocument() // Alice: 3
    expect(screen.getByText('1 day free')).toBeInTheDocument() // Bob: 1
    expect(screen.getByText('No days marked')).toBeInTheDocument() // Carol: 0
  })

  it('uses singular "1 day free" for exactly 1 day', () => {
    renderList()
    expect(screen.getByText('1 day free')).toBeInTheDocument()
    expect(screen.queryByText('1 days free')).not.toBeInTheDocument()
  })

  it('uses plural "N days free" for N > 1', () => {
    renderList()
    expect(screen.getByText('3 days free')).toBeInTheDocument()
  })

  it('shows "No days marked" for 0 days', () => {
    renderList()
    expect(screen.getByText('No days marked')).toBeInTheDocument()
  })

  it('current participant row has bg-blue-50 class', () => {
    renderList({ currentParticipantId: 'p1' })
    // Find the container of "Alice" that has the special styling
    const aliceContainer = screen.getByText('Alice').closest('[class*="bg-blue"]')
    expect(aliceContainer).toBeInTheDocument()
    expect(aliceContainer!.className).toContain('bg-blue-50')
  })

  it('other participant rows have bg-gray-50 class', () => {
    renderList({ currentParticipantId: 'p1' })
    const bobContainer = screen.getByText('Bob').closest('[class*="bg-gray"]')
    expect(bobContainer).toBeInTheDocument()
    expect(bobContainer!.className).toContain('bg-gray-50')
  })

  it('renders empty list without crashing when participants is empty', () => {
    renderList({ participants: [], availability: [] })
    expect(screen.getByText('Participants (0)')).toBeInTheDocument()
  })

  it('shows 0 days for all participants when availability is empty', () => {
    renderList({ availability: [] })
    const noneMarked = screen.getAllByText('No days marked')
    expect(noneMarked).toHaveLength(3)
  })

  it('handles null currentParticipantId without crashing', () => {
    renderList({ currentParticipantId: null })
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.queryByText('(you)')).not.toBeInTheDocument()
  })
})
