"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from "react"
import { useRouter } from "next/navigation"

interface NavigationContextType {
  isNavigating: boolean
  navigate: (href: string) => void
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [isNavigating, setIsNavigating] = useState(false)
  const router = useRouter()

  const navigate = useCallback((href: string) => {
    setIsNavigating(true)
    
    // Use router.push for client-side navigation
    router.push(href)
    
    // Reset navigation state after a short delay
    setTimeout(() => {
      setIsNavigating(false)
    }, 200)
  }, [router])

  return (
    <NavigationContext.Provider value={{ isNavigating, navigate }}>
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  const context = useContext(NavigationContext)
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider')
  }
  return context
}