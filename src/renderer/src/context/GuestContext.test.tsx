import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useGuest } from './GuestContext'
import { GuestProvider } from './GuestProvider'

function ReadGuest(): React.JSX.Element {
  const { isGuest } = useGuest()
  return <div data-testid="is-guest">{String(isGuest)}</div>
}

function ToggleGuest(): React.JSX.Element {
  const { setIsGuest } = useGuest()
  return (
    <button type="button" onClick={() => setIsGuest(true)}>
      Set Guest
    </button>
  )
}

describe('GuestContext', () => {
  it('provides isGuest as false by default', () => {
    render(
      <GuestProvider>
        <ReadGuest />
      </GuestProvider>
    )

    expect(screen.getByTestId('is-guest').textContent).toBe('false')
  })

  it('updates isGuest to true when setIsGuest(true) is called', () => {
    render(
      <GuestProvider>
        <ReadGuest />
        <ToggleGuest />
      </GuestProvider>
    )

    expect(screen.getByTestId('is-guest').textContent).toBe('false')

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /set guest/i }))
    })

    expect(screen.getByTestId('is-guest').textContent).toBe('true')
  })
})
