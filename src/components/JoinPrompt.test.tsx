import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import JoinPrompt from './JoinPrompt'

function renderPrompt(props = {}) {
  const defaults = { sessionName: 'Summer BBQ', onJoin: vi.fn(), loading: false }
  return render(<JoinPrompt {...defaults} {...props} />)
}

describe('JoinPrompt', () => {
  it('renders the session name in quotes', () => {
    renderPrompt({ sessionName: 'Summer BBQ' })
    expect(screen.getByText('"Summer BBQ"')).toBeInTheDocument()
  })

  it('renders fallback text when sessionName is not provided', () => {
    renderPrompt({ sessionName: null })
    expect(screen.getByText(/enter your name/i)).toBeInTheDocument()
  })

  it('renders fallback text when sessionName is empty string', () => {
    renderPrompt({ sessionName: '' })
    expect(screen.getByText(/enter your name/i)).toBeInTheDocument()
  })

  it('submit button is disabled when input is empty', () => {
    renderPrompt()
    expect(screen.getByRole('button', { name: /join/i })).toBeDisabled()
  })

  it('submit button is disabled when input is whitespace only', async () => {
    const user = userEvent.setup()
    renderPrompt()
    await user.type(screen.getByRole('textbox'), '   ')
    expect(screen.getByRole('button', { name: /join/i })).toBeDisabled()
  })

  it('submit button is enabled when input has valid text', async () => {
    const user = userEvent.setup()
    renderPrompt()
    await user.type(screen.getByRole('textbox'), 'Alice')
    expect(screen.getByRole('button', { name: /join/i })).not.toBeDisabled()
  })

  it('calls onJoin with trimmed name on submit', async () => {
    const onJoin = vi.fn()
    const user = userEvent.setup()
    renderPrompt({ onJoin })

    await user.type(screen.getByRole('textbox'), '  Alice  ')
    await user.click(screen.getByRole('button', { name: /join/i }))

    expect(onJoin).toHaveBeenCalledWith('Alice')
    expect(onJoin).toHaveBeenCalledTimes(1)
  })

  it('does NOT call onJoin when name is whitespace only', async () => {
    const onJoin = vi.fn()
    const user = userEvent.setup()
    renderPrompt({ onJoin })

    await user.type(screen.getByRole('textbox'), '   ')
    fireEvent.submit(screen.getByRole('textbox').closest('form')!)

    expect(onJoin).not.toHaveBeenCalled()
  })

  it('submits via Enter key', async () => {
    const onJoin = vi.fn()
    const user = userEvent.setup()
    renderPrompt({ onJoin })

    const input = screen.getByRole('textbox')
    await user.type(input, 'Alice')
    await user.keyboard('{Enter}')

    expect(onJoin).toHaveBeenCalledWith('Alice')
  })

  it('shows "Joining…" text when loading is true', () => {
    renderPrompt({ loading: true })
    expect(screen.getByRole('button')).toHaveTextContent('Joining…')
  })

  it('disables the button when loading is true', () => {
    renderPrompt({ loading: true })
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('input has a maxLength of 30', () => {
    renderPrompt()
    expect(screen.getByRole('textbox')).toHaveAttribute('maxLength', '30')
  })
})
