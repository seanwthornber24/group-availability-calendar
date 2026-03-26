import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Calendar from './Calendar'

vi.mock('date-fns', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...(actual as object),
    startOfToday: vi.fn(() => new Date('2026-04-15T12:00:00.000')),
  }
})

// Stub DayCell so we can inspect props without the real colour logic
vi.mock('./DayCell', () => ({
  default: (props: {
    date: string
    freeCount: number
    totalParticipants: number
    isMyDay: boolean
    isBest: boolean
    onTap: (date: string) => void
  }) => (
    <div
      data-testid="day-cell"
      data-date={props.date}
      data-free={props.freeCount}
      data-my={String(props.isMyDay)}
      data-best={String(props.isBest)}
      data-total={props.totalParticipants}
      onClick={() => props.onTap(props.date)}
    />
  ),
}))

const PARTICIPANTS = [
  { id: 'p1', name: 'A', session_id: 's1', local_id: 'l1', created_at: null },
  { id: 'p2', name: 'B', session_id: 's1', local_id: 'l2', created_at: null },
  { id: 'p3', name: 'C', session_id: 's1', local_id: 'l3', created_at: null },
]

function renderCalendar(props = {}) {
  const defaults = {
    month: '2026-04-01',
    participants: PARTICIPANTS,
    availability: [] as { id: string; participant_id: string; date: string }[],
    currentParticipantId: 'p1',
    onDayTap: vi.fn(),
  }
  return render(<Calendar {...defaults} {...props} />)
}

describe('Calendar', () => {
  it('renders the month heading', () => {
    renderCalendar()
    expect(screen.getByText('April 2026')).toBeInTheDocument()
  })

  it('renders 7 weekday headers in Sun–Sat order', () => {
    renderCalendar()
    const headers = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    headers.forEach((h) => expect(screen.getByText(h)).toBeInTheDocument())
  })

  it('renders 30 DayCells for April 2026', () => {
    renderCalendar()
    expect(screen.getAllByTestId('day-cell')).toHaveLength(30)
  })

  it('first cell has date 2026-04-01', () => {
    renderCalendar()
    const cells = screen.getAllByTestId('day-cell')
    expect(cells[0]).toHaveAttribute('data-date', '2026-04-01')
  })

  it('last cell has date 2026-04-30', () => {
    renderCalendar()
    const cells = screen.getAllByTestId('day-cell')
    expect(cells[29]).toHaveAttribute('data-date', '2026-04-30')
  })

  it('passes freeCount=0 to cells with no availability', () => {
    renderCalendar({ availability: [] })
    const cells = screen.getAllByTestId('day-cell')
    cells.forEach((cell) => expect(cell).toHaveAttribute('data-free', '0'))
  })

  it('passes correct freeCount to a cell with availability', () => {
    const availability = [
      { id: 'av1', participant_id: 'p1', date: '2026-04-05' },
      { id: 'av2', participant_id: 'p2', date: '2026-04-05' },
    ]
    renderCalendar({ availability })
    const cell = screen
      .getAllByTestId('day-cell')
      .find((c) => c.getAttribute('data-date') === '2026-04-05')
    expect(cell).toHaveAttribute('data-free', '2')
  })

  it('accumulates freeCount across multiple participants', () => {
    const availability = [
      { id: 'av1', participant_id: 'p1', date: '2026-04-10' },
      { id: 'av2', participant_id: 'p2', date: '2026-04-10' },
      { id: 'av3', participant_id: 'p3', date: '2026-04-10' },
    ]
    renderCalendar({ availability })
    const cell = screen
      .getAllByTestId('day-cell')
      .find((c) => c.getAttribute('data-date') === '2026-04-10')
    expect(cell).toHaveAttribute('data-free', '3')
  })

  it("sets isMyDay=true only for the current participant's dates", () => {
    const availability = [
      { id: 'av1', participant_id: 'p1', date: '2026-04-07' },
      { id: 'av2', participant_id: 'p2', date: '2026-04-08' },
    ]
    renderCalendar({ availability, currentParticipantId: 'p1' })

    const myCell = screen
      .getAllByTestId('day-cell')
      .find((c) => c.getAttribute('data-date') === '2026-04-07')
    const otherCell = screen
      .getAllByTestId('day-cell')
      .find((c) => c.getAttribute('data-date') === '2026-04-08')

    expect(myCell).toHaveAttribute('data-my', 'true')
    expect(otherCell).toHaveAttribute('data-my', 'false')
  })

  it('sets isBest=true for the date with the highest freeCount', () => {
    const availability = [
      { id: 'av1', participant_id: 'p1', date: '2026-04-05' },
      { id: 'av2', participant_id: 'p2', date: '2026-04-05' },
      { id: 'av3', participant_id: 'p1', date: '2026-04-10' },
    ]
    renderCalendar({ availability })

    const bestCell = screen
      .getAllByTestId('day-cell')
      .find((c) => c.getAttribute('data-date') === '2026-04-05')
    const normalCell = screen
      .getAllByTestId('day-cell')
      .find((c) => c.getAttribute('data-date') === '2026-04-10')

    expect(bestCell).toHaveAttribute('data-best', 'true')
    expect(normalCell).toHaveAttribute('data-best', 'false')
  })

  it('sets isBest=false for all cells when availability is empty', () => {
    renderCalendar({ availability: [] })
    const cells = screen.getAllByTestId('day-cell')
    cells.forEach((cell) => expect(cell).toHaveAttribute('data-best', 'false'))
  })

  it('passes totalParticipants equal to participants.length', () => {
    renderCalendar({ participants: PARTICIPANTS })
    const cells = screen.getAllByTestId('day-cell')
    cells.forEach((cell) => expect(cell).toHaveAttribute('data-total', '3'))
  })

  it('calls onDayTap with the date string when a cell is clicked', async () => {
    const onDayTap = vi.fn()
    const user = userEvent.setup()
    renderCalendar({ onDayTap })

    const cell = screen
      .getAllByTestId('day-cell')
      .find((c) => c.getAttribute('data-date') === '2026-04-20')
    await user.click(cell!)
    expect(onDayTap).toHaveBeenCalledWith('2026-04-20')
  })

  it('handles empty participants without crashing', () => {
    renderCalendar({ participants: [] })
    expect(screen.getAllByTestId('day-cell')).toHaveLength(30)
  })

  it('passes totalParticipants=0 when participants is empty', () => {
    renderCalendar({ participants: [] })
    const cells = screen.getAllByTestId('day-cell')
    cells.forEach((cell) => expect(cell).toHaveAttribute('data-total', '0'))
  })
})
