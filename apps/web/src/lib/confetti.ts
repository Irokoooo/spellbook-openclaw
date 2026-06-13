import confetti from 'canvas-confetti'

export function fireSkillConfetti() {
  const duration = 1200
  const end = Date.now() + duration

  // Left cannon
  const leftCannon = () => confetti({
    particleCount: 5,
    angle: 60,
    spread: 55,
    origin: { x: 0, y: 0.65 },
    colors: ['#4ade80', '#22c55e', '#86efac', '#fde68a', '#a78bfa', '#ffffff'],
    scalar: 0.9,
    ticks: 200,
  })

  // Right cannon
  const rightCannon = () => confetti({
    particleCount: 5,
    angle: 120,
    spread: 55,
    origin: { x: 1, y: 0.65 },
    colors: ['#4ade80', '#22c55e', '#86efac', '#fde68a', '#a78bfa', '#ffffff'],
    scalar: 0.9,
    ticks: 200,
  });

  (function frame() {
    leftCannon()
    rightCannon()
    if (Date.now() < end) {
      requestAnimationFrame(frame)
    }
  })()
}
