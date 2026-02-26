import { useState } from 'react'
import { GuestContext } from './GuestContext'

interface GuestProviderProps {
  children: React.ReactNode
}

export function GuestProvider({ children }: GuestProviderProps): React.JSX.Element {
  const [isGuest, setIsGuest] = useState(false)

  return <GuestContext.Provider value={{ isGuest, setIsGuest }}>{children}</GuestContext.Provider>
}
