import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DayDetailSheet from './DayDetailSheet'

const PARTICIPANTS = [
  { id: 'p1', name: 'Alice' },
  { id: 'p2', name: 'Bob' },
  { id: 'p3', name: 'Carol' },
]

const AVAILABILITY = [
  { id: 'av1', participant_id: 'p1', date: '2026-04-15' },
  { id: 'av2', participant_id: 'p2', date: '2026-04-15' },
]

function renderSheet(props = {}) {
  const defaults = {
    date: '2026-04-15',
    participants: PARTICIPANTS,
    availability: AVAILABILITY,
    currentParticipantId: 'p1',
    onToggle: vi.fn(),
    onClose: vi.fn(),
  }
  return render(<DayDetailSheet {...defaults} {...props} />)
}

describe('DayDetailSheet', () => {
  it('renders nothing when date is null', () => {
    const { container } = render(
      <DayDetailSheet
        date={null}
        participants={PARTICIPANTS}
        availability={AVAILABILITY}
        currentParticipantId="p1"
        onToggle={vi.fn()}
        onClose={vi.fn()}
      />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when date is undefined', () => {
    const { container } = render(
      <DayDetailSheet
        date={undefined}
        participants={PARTICIPANTS}
        availability={AVAILABILITY}
        currentParticipantId="p1"
        onToggle={vi.fn()}
        onClose={vi.fn()}
      />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the formatted date heading', () => {
    renderSheet({ date: '2026-04-15' })
    expect(screen.getByText('Wednesday, 15 April')).toBeInTheDocument()
  })

  it('shows the correct free count text', () => {
    renderSheet() // 2 of 3 free
    expect(screen.getByText('2 of 3 free')).toBeInTheDocument()
  })

  it('shows "0 of 0 free" when there are no participants', () => {
    renderSheet({ participants: [], availability: [] })
    expect(screen.getByText('0 of 0 free')).toBeInTheDocument()
  })

  it('lists participants who are free under the "Free" section', () => {
    renderSheet()
    // Alice and Bob are free
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })

  it('lists participants who are not free under "Not marked"', () => {
    renderSheet()
    expect(screen.getByText('Carol')).toBeInTheDocument()
  })

  it('shows "(you)" label next to the current participant', () => {
    renderSheet({ currentParticipantId: 'p1' })
    expect(screen.getByText('(you)')).toBeInTheDocument()
  })

  it('shows "✓ Mark me as free" when current user is NOT free', () => {
    renderSheet({ currentParticipantId: 'p3' }) // Carol is not in availability
    expect(screen.getByText(/mark me as free/i)).toBeInTheDocument()
  })

  it('shows "✕ Remove my availability" when current user IS free', () => {
    renderSheet({ currentParticipantId: 'p1' }) // Alice is free
    expect(screen.getByText(/remove my availability/i)).toBeInTheDocument()
  })

  it('calls onToggle with the date when the toggle button is clicked', async () => {
    const onToggle = vi.fn()
    const user = userEvent.setup()
    renderSheet({ onToggle })

    await user.click(screen.getByText(/remove my availability/i))
    expect(onToggle).toHaveBeenCalledWith('2026-04-15')
  })

  it('does not render the toggle button when currentParticipantId is null', () => {
    renderSheet({ currentParticipantId: null })
    expect(screen.queryByText(/mark me as free/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/remove my availability/i)).not.toBeInTheDocument()
  })

  it('calls onClose when the close button is clicked', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    renderSheet({ onClose })

    await user.click(screen.getByRole('button', { name: '×' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when the backdrop is clicked', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    renderSheet({ onClose })

    // The backdrop is the fixed overlay div behind the sheet
    const backdrop = document.querySelector('.fixed.inset-0.bg-black\\/30')
    await user.click(backdrop)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('renders empty "Free" section without crashing when no one is free', () => {
    renderSheet({ availability: [] })
    // No "Free" label since section is only shown when free count > 0
    expect(screen.queryByText(/^Free$/i)).not.toBeInTheDocument()
    expect(screen.getByText('0 of 3 free')).toBeInTheDocument()
  })

  it('shows first letter of participant name as avatar', () => {
    renderSheet()
    // Alice → 'A', Bob → 'B' visible as avatar text
    const avatars = screen.getAllByText('A')
    expect(avatars.length).toBeGreaterThan(0)
  })
})
