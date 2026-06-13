'use client'

import { createContext, useContext, useState, useEffect } from 'react'

interface ParticlesContextValue {
  enabled: boolean
  toggle: () => void
}

const ParticlesContext = createContext<ParticlesContextValue>({
  enabled: true,
  toggle: () => {},
})

export function ParticlesProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(true)

  // Persist preference to localStorage
  useEffect(() => {
    const saved = localStorage.getItem('spellbook_particles')
    if (saved !== null) setEnabled(saved === 'true')
  }, [])

  function toggle() {
    setEnabled((prev) => {
      localStorage.setItem('spellbook_particles', String(!prev))
      return !prev
    })
  }

  return (
    <ParticlesContext.Provider value={{ enabled, toggle }}>
      {children}
    </ParticlesContext.Provider>
  )
}

export function useParticles() {
  return useContext(ParticlesContext)
}
