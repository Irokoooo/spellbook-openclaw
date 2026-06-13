'use client'

import { useParticles } from '@/contexts/ParticlesContext'
import MagicParticles from './MagicParticles'

export default function MagicParticlesLayer() {
  const { enabled } = useParticles()
  return <MagicParticles enabled={enabled} />
}
