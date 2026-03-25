import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SharePanel from './SharePanel'

vi.mock('qrcode.react', () => ({
  QRCodeSVG: ({ value }: { value: string }) => <div data-testid="qr-code" data-value={value} />,
}))

beforeEach(() => {
  // Use vi.spyOn so toHaveBeenCalledWith works correctly
  vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined)
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

function renderPanel(sessionId = 'abc12345') {
  return render(<SharePanel sessionId={sessionId} />)
}

describe('SharePanel', () => {
  it('starts collapsed — URL and QR not visible', () => {
    renderPanel()
    expect(screen.queryByTestId('qr-code')).not.toBeInTheDocument()
  })

  it('renders the share toggle button', () => {
    renderPanel()
    expect(screen.getByText(/share this session/i)).toBeInTheDocument()
  })

  it('expands when the toggle button is clicked', async () => {
    const user = userEvent.setup()
    renderPanel()
    await user.click(screen.getByText(/share this session/i))
    expect(screen.getByTestId('qr-code')).toBeInTheDocument()
  })

  it('shows the session URL in expanded state', async () => {
    const user = userEvent.setup()
    renderPanel('abc12345')
    await user.click(screen.getByText(/share this session/i))
    expect(screen.getByText(`${window.location.origin}/session/abc12345`)).toBeInTheDocument()
  })

  it('QR code receives the correct URL as value prop', async () => {
    const user = userEvent.setup()
    renderPanel('abc12345')
    await user.click(screen.getByText(/share this session/i))
    expect(screen.getByTestId('qr-code')).toHaveAttribute(
      'data-value',
      `${window.location.origin}/session/abc12345`
    )
  })

  it('copy button calls navigator.clipboard.writeText with the URL', async () => {
    renderPanel('abc12345')
    fireEvent.click(screen.getByText(/share this session/i))

    await act(async () => {
      fireEvent.click(screen.getByText('Copy'))
    })

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      `${window.location.origin}/session/abc12345`
    )
  })

  it('shows "✓ Copied" immediately after clicking copy', async () => {
    renderPanel()
    fireEvent.click(screen.getByText(/share this session/i))

    await act(async () => {
      fireEvent.click(screen.getByText('Copy'))
    })

    expect(screen.getByText('✓ Copied')).toBeInTheDocument()
  })

  it('reverts copy button text to "Copy" after 2 seconds', async () => {
    vi.useFakeTimers()
    renderPanel()
    fireEvent.click(screen.getByText(/share this session/i))

    await act(async () => {
      fireEvent.click(screen.getByText('Copy'))
    })

    expect(screen.getByText('✓ Copied')).toBeInTheDocument()

    act(() => vi.advanceTimersByTime(2000))
    expect(screen.getByText('Copy')).toBeInTheDocument()
  })

  it('collapses when the toggle button is clicked a second time', async () => {
    const user = userEvent.setup()
    renderPanel()
    // Expand
    await user.click(screen.getByText(/share this session/i))
    expect(screen.getByTestId('qr-code')).toBeInTheDocument()
    // Collapse — click the "▲ Hide" text
    await user.click(screen.getByText(/hide/i))
    expect(screen.queryByTestId('qr-code')).not.toBeInTheDocument()
  })
})
