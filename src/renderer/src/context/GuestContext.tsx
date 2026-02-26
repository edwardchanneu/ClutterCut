import { createContext, useContext } from 'react'

interface GuestContextValue {
  isGuest: boolean
  setIsGuest: (value: boolean) => void
}

export const GuestContext = createContext<GuestContextValue>({
  isGuest: false,
  setIsGuest: () => {}
})

export function useGuest(): GuestContextValue {
  const context = useContext(GuestContext)
  if (context === undefined) {
    throw new Error('useGuest must be used within a GuestProvider')
  }
  return context
}
