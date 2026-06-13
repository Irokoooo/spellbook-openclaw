'use client'

import { useEffect, useRef, useCallback } from 'react'

interface Particle {
  x: number
  y: number
  vy: number      // fall speed
  vx: number      // horizontal drift
  size: number
  opacity: number
  rotation: number
  rotSpeed: number
  symbol: string
  color: string
}

const SYMBOLS: Record<string, string[]> = {
  default: ['✦', '✧', '⋆', '·', '✦', '✦'],
  grimoire: ['✦', '✧', '⊹', '✶', '⁕', '⊕', '⊛'],
  studio: ['•', '◦', '○', '◌', '·', '◎'],
}

const COLORS: Record<string, string[]> = {
  default: ['#4ade80', '#22c55e', '#16a34a', '#86efac', '#bbf7d0'],
  grimoire: ['#d4a92a', '#e8c96b', '#f0d98c', '#b8960f', '#fde68a'],
  studio:   ['#f97316', '#fb923c', '#fdba74', '#c2410c', '#fed7aa'],
}

function getTheme(): string {
  if (typeof document === 'undefined') return 'default'
  return document.documentElement.getAttribute('data-theme') ?? 'default'
}

function createParticle(canvas: HTMLCanvasElement, symbols: string[], colors: string[]): Particle {
  return {
    x: Math.random() * canvas.width,
    y: -20 - Math.random() * 100,
    vy: 0.5 + Math.random() * 0.8,
    vx: (Math.random() - 0.5) * 0.4,
    size: 10 + Math.random() * 10,
    opacity: 0.4 + Math.random() * 0.5,
    rotation: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.02,
    symbol: symbols[Math.floor(Math.random() * symbols.length)],
    color: colors[Math.floor(Math.random() * colors.length)],
  }
}

export default function MagicParticles({ enabled }: { enabled: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const rafRef = useRef<number>(0)
  const enabledRef = useRef(enabled)
  enabledRef.current = enabled

  const animate = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const theme = getTheme()
    const symbols = SYMBOLS[theme] ?? SYMBOLS.default
    const colors = COLORS[theme] ?? COLORS.default

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Spawn new particles to maintain density (~18 on screen)
    if (enabledRef.current && particlesRef.current.length < 18) {
      if (Math.random() < 0.08) {
        particlesRef.current.push(createParticle(canvas, symbols, colors))
      }
    }

    particlesRef.current = particlesRef.current.filter((p) => {
      p.y += p.vy
      p.x += p.vx
      p.rotation += p.rotSpeed

      // Fade out near bottom
      const fadeStart = canvas.height * 0.75
      if (p.y > fadeStart) {
        p.opacity = Math.max(0, p.opacity - 0.008)
      }

      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rotation)
      ctx.globalAlpha = p.opacity
      ctx.font = `${p.size}px sans-serif`
      ctx.fillStyle = p.color
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(p.symbol, 0, 0)
      ctx.restore()

      return p.y < canvas.height + 30 && p.opacity > 0.01
    })

    rafRef.current = requestAnimationFrame(animate)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    function resize() {
      if (!canvas) return
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    rafRef.current = requestAnimationFrame(animate)
    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(rafRef.current)
    }
  }, [animate])

  // Drain particles when disabled
  useEffect(() => {
    if (!enabled) {
      particlesRef.current = []
    }
  }, [enabled])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-10"
      style={{ opacity: enabled ? 1 : 0, transition: 'opacity 0.6s ease' }}
    />
  )
}
