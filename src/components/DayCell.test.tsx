import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DayCell from './DayCell'

vi.mock('date-fns', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...(actual as object),
    // Return noon so format(startOfToday(), 'yyyy-MM-dd') is unambiguously '2026-04-15'
    // regardless of the test environment's timezone
    startOfToday: vi.fn(() => new Date('2026-04-15T12:00:00.000')),
  }
})

const defaultProps = {
  date: '2026-04-20', // future day
  freeCount: 0,
  totalParticipants: 0,
  isMyDay: false,
  isBest: false,
  onTap: vi.fn(),
}

function renderCell(props = {}) {
  return render(<DayCell {...defaultProps} {...props} />)
}

describe('DayCell', () => {
  it('renders the day number', () => {
    renderCell({ date: '2026-04-20' })
    expect(screen.getByText('20')).toBeInTheDocument()
  })

  it('renders a past day as disabled', () => {
    renderCell({ date: '2026-04-14' })
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('past day has gray background classes', () => {
    renderCell({ date: '2026-04-14' })
    expect(screen.getByRole('button').className).toContain('bg-gray-100')
  })

  it('today (2026-04-15) is NOT disabled (boundary: today is interactive)', () => {
    renderCell({ date: '2026-04-15', totalParticipants: 0 })
    expect(screen.getByRole('button')).not.toBeDisabled()
  })

  it('does NOT call onTap when a past day is clicked', async () => {
    const onTap = vi.fn()
    const user = userEvent.setup()
    renderCell({ date: '2026-04-14', onTap })
    await user.click(screen.getByRole('button'))
    expect(onTap).not.toHaveBeenCalled()
  })

  it('calls onTap with the date string when a future day is clicked', async () => {
    const onTap = vi.fn()
    const user = userEvent.setup()
    renderCell({ date: '2026-04-20', onTap })
    await user.click(screen.getByRole('button'))
    expect(onTap).toHaveBeenCalledWith('2026-04-20')
  })

  it('has neutral background when totalParticipants is 0', () => {
    renderCell({ date: '2026-04-20', freeCount: 0, totalParticipants: 0 })
    expect(screen.getByRole('button').className).toContain('bg-gray-50')
  })

  it('has neutral background when freeCount is 0', () => {
    renderCell({ date: '2026-04-20', freeCount: 0, totalParticipants: 3 })
    expect(screen.getByRole('button').className).toContain('bg-gray-50')
  })

  it('has amber-100 background when ratio < 0.5 (1/3)', () => {
    renderCell({ date: '2026-04-20', freeCount: 1, totalParticipants: 3 })
    expect(screen.getByRole('button').className).toContain('bg-amber-100')
  })

  it('has amber-400 background when ratio = 0.5 (1/2)', () => {
    renderCell({ date: '2026-04-20', freeCount: 1, totalParticipants: 2 })
    expect(screen.getByRole('button').className).toContain('bg-amber-400')
  })

  it('has amber-400 background when ratio > 0.5 but not 1 (2/3)', () => {
    renderCell({ date: '2026-04-20', freeCount: 2, totalParticipants: 3 })
    expect(screen.getByRole('button').className).toContain('bg-amber-400')
  })

  it('has green-500 background when ratio = 1.0 (all free)', () => {
    renderCell({ date: '2026-04-20', freeCount: 3, totalParticipants: 3 })
    expect(screen.getByRole('button').className).toContain('bg-green-500')
  })

  it('has ring-blue-500 class when isMyDay is true', () => {
    renderCell({ date: '2026-04-20', isMyDay: true })
    expect(screen.getByRole('button').className).toContain('ring-blue-500')
  })

  it('does not have ring class when isMyDay is false', () => {
    renderCell({ date: '2026-04-20', isMyDay: false })
    expect(screen.getByRole('button').className).not.toContain('ring-blue-500')
  })

  it('renders the star emoji when isBest is true', () => {
    renderCell({ date: '2026-04-20', freeCount: 3, totalParticipants: 3, isBest: true })
    expect(screen.getByText('⭐')).toBeInTheDocument()
  })

  it('does not render the star emoji when isBest is false', () => {
    renderCell({ date: '2026-04-20', isBest: false })
    expect(screen.queryByText('⭐')).not.toBeInTheDocument()
  })

  it('shows the count label when freeCount > 0 on a future day', () => {
    renderCell({ date: '2026-04-20', freeCount: 2, totalParticipants: 4 })
    expect(screen.getByText('2/4')).toBeInTheDocument()
  })

  it('hides the count label when freeCount is 0', () => {
    renderCell({ date: '2026-04-20', freeCount: 0, totalParticipants: 4 })
    expect(screen.queryByText(/\d+\/\d+/)).not.toBeInTheDocument()
  })

  it('hides the count label on past days', () => {
    renderCell({ date: '2026-04-14', freeCount: 2, totalParticipants: 4 })
    expect(screen.queryByText('2/4')).not.toBeInTheDocument()
  })

  it('aria-label includes the date', () => {
    renderCell({ date: '2026-04-20' })
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', expect.stringContaining('2026-04-20'))
  })

  it('aria-label includes free count when freeCount > 0', () => {
    renderCell({ date: '2026-04-20', freeCount: 2, totalParticipants: 4 })
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', expect.stringContaining('2 free'))
  })
})
