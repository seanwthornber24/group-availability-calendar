import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Home from './Home'
import { createSession } from '../lib/session'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('../lib/session', () => ({ createSession: vi.fn() }))

vi.mock('date-fns', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    // Fix "today" to 2026-03-25 so default month is April 2026
    startOfMonth: vi.fn().mockImplementation(actual.startOfMonth),
    addMonths: vi.fn().mockImplementation((date, amount) => {
      // If the base date is "new Date()" we want 2026-04-01
      return actual.addMonths(new Date('2026-03-25'), amount)
    }),
  }
})

function renderHome() {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  )
}

describe('Home', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the session name input', () => {
    renderHome()
    expect(screen.getByPlaceholderText(/summer bbq/i)).toBeInTheDocument()
  })

  it('renders the creator name input', () => {
    renderHome()
    expect(screen.getByPlaceholderText(/alex/i)).toBeInTheDocument()
  })

  it('renders the month input', () => {
    renderHome()
    expect(document.querySelector('input[type="month"]')).toBeInTheDocument()
  })

  it('submit button is disabled when all fields are empty', () => {
    renderHome()
    expect(screen.getByRole('button', { name: /create session/i })).toBeDisabled()
  })

  it('submit button is disabled when only session name is filled', async () => {
    const user = userEvent.setup()
    renderHome()
    await user.type(screen.getByPlaceholderText(/summer bbq/i), 'Test')
    expect(screen.getByRole('button', { name: /create session/i })).toBeDisabled()
  })

  it('submit button is disabled when only creator name is filled', async () => {
    const user = userEvent.setup()
    renderHome()
    await user.type(screen.getByPlaceholderText(/alex/i), 'Alice')
    expect(screen.getByRole('button', { name: /create session/i })).toBeDisabled()
  })

  it('submit button is enabled when all fields are filled', async () => {
    const user = userEvent.setup()
    renderHome()
    await user.type(screen.getByPlaceholderText(/summer bbq/i), 'BBQ')
    await user.type(screen.getByPlaceholderText(/alex/i), 'Alice')
    // Month has a default value so button should now be enabled
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /create session/i })).not.toBeDisabled()
    )
  })

  it('submit calls createSession with trimmed name and creatorName', async () => {
    createSession.mockResolvedValue('newid123')
    const user = userEvent.setup()
    renderHome()

    await user.type(screen.getByPlaceholderText(/summer bbq/i), '  BBQ  ')
    await user.type(screen.getByPlaceholderText(/alex/i), '  Alice  ')
    await user.click(screen.getByRole('button', { name: /create session/i }))

    await waitFor(() => expect(createSession).toHaveBeenCalled())
    const args = createSession.mock.calls[0][0]
    expect(args.name).toBe('BBQ')
    expect(args.creatorName).toBe('Alice')
  })

  it('navigates to /session/<id> after successful createSession', async () => {
    createSession.mockResolvedValue('newid123')
    const user = userEvent.setup()
    renderHome()

    await user.type(screen.getByPlaceholderText(/summer bbq/i), 'BBQ')
    await user.type(screen.getByPlaceholderText(/alex/i), 'Alice')
    await user.click(screen.getByRole('button', { name: /create session/i }))

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/session/newid123'))
  })

  it('shows "Creating…" on the button while the request is pending', async () => {
    let resolve
    createSession.mockReturnValue(new Promise((r) => { resolve = r }))
    const user = userEvent.setup()
    renderHome()

    await user.type(screen.getByPlaceholderText(/summer bbq/i), 'BBQ')
    await user.type(screen.getByPlaceholderText(/alex/i), 'Alice')
    await user.click(screen.getByRole('button', { name: /create session/i }))

    expect(screen.getByRole('button')).toHaveTextContent('Creating…')
    resolve('id')
  })

  it('button is disabled while creating', async () => {
    let resolve
    createSession.mockReturnValue(new Promise((r) => { resolve = r }))
    const user = userEvent.setup()
    renderHome()

    await user.type(screen.getByPlaceholderText(/summer bbq/i), 'BBQ')
    await user.type(screen.getByPlaceholderText(/alex/i), 'Alice')
    await user.click(screen.getByRole('button', { name: /create session/i }))

    expect(screen.getByRole('button')).toBeDisabled()
    resolve('id')
  })

  it('shows an error message when createSession rejects', async () => {
    createSession.mockRejectedValue(new Error('DB error'))
    const user = userEvent.setup()
    renderHome()

    await user.type(screen.getByPlaceholderText(/summer bbq/i), 'BBQ')
    await user.type(screen.getByPlaceholderText(/alex/i), 'Alice')
    await user.click(screen.getByRole('button', { name: /create session/i }))

    await waitFor(() =>
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    )
  })

  it('does not navigate on error', async () => {
    createSession.mockRejectedValue(new Error('DB error'))
    const user = userEvent.setup()
    renderHome()

    await user.type(screen.getByPlaceholderText(/summer bbq/i), 'BBQ')
    await user.type(screen.getByPlaceholderText(/alex/i), 'Alice')
    await user.click(screen.getByRole('button', { name: /create session/i }))

    await waitFor(() => screen.getByText(/something went wrong/i))
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('button re-enables after an error', async () => {
    createSession.mockRejectedValue(new Error('DB error'))
    const user = userEvent.setup()
    renderHome()

    await user.type(screen.getByPlaceholderText(/summer bbq/i), 'BBQ')
    await user.type(screen.getByPlaceholderText(/alex/i), 'Alice')
    await user.click(screen.getByRole('button', { name: /create session/i }))

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /create session/i })).not.toBeDisabled()
    )
  })
})
