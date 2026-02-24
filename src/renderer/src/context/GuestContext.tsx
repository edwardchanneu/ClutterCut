import { createContext, useContext, useState } from 'react'

interface GuestContextValue {
  isGuest: boolean
  setIsGuest: (value: boolean) => void
}

export const GuestContext = createContext<GuestContextValue>({
  isGuest: false,
  setIsGuest: () => {}
})

interface GuestProviderProps {
  children: React.ReactNode
}

export function GuestProvider({ children }: GuestProviderProps): React.JSX.Element {
  const [isGuest, setIsGuest] = useState(false)

  return <GuestContext.Provider value={{ isGuest, setIsGuest }}>{children}</GuestContext.Provider>
}

export function useGuest(): GuestContextValue {
  return useContext(GuestContext)
}
