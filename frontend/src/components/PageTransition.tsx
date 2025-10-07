"use client"

import { ReactNode } from "react"

interface PageTransitionProps {
  children: ReactNode
}

export default function PageTransition({ children }: PageTransitionProps) {
  return (
    <div className="w-full h-full transition-opacity duration-200 ease-in-out">
      {children}
    </div>
  )
}