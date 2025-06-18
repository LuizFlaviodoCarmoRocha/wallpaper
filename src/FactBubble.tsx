import { useEffect, useState } from 'react'
import './App.css'

interface FactBubbleProps {
  fact: string
  onDone?: () => void
}

/**
 * Displays a floating fact bubble at a random position and auto-dismisses after a timeout.
 */
const DISPLAY_DURATION_MS = import.meta.env.DEV ? 3000 : 5000
const EXIT_DURATION_MS = 1000

export default function FactBubble({ fact, onDone }: FactBubbleProps) {
  const [exiting, setExiting] = useState(false)
  useEffect(() => {
    let hideTimer: number
    const timer = window.setTimeout(() => {
      setExiting(true)
      hideTimer = window.setTimeout(() => onDone?.(), EXIT_DURATION_MS)
    }, DISPLAY_DURATION_MS)
    return () => {
      clearTimeout(timer)
      clearTimeout(hideTimer)
    }
  }, [onDone])

  const [pos] = useState(() => {
    let x: number
    let y: number
    let attempts = 0
    // only allow positions in outer zones (0–20% or ≥65%) on both axes
    do {
      // only pick positions in the range 0–75% on both axes
      x = Math.random() * 75
      y = Math.random() * 75
      attempts++
    } while (!((x <= 20 || x >= 65) && (y <= 20 || y >= 65)))
    console.debug(
      `[FactBubble] chosen pos x=${x.toFixed(1)}% y=${y.toFixed(1)}% after ${attempts} attempt${
        attempts === 1 ? '' : 's'
      }`
    )
    return { x, y }
  })

  return (
    <div
      className={`fact-bubble${exiting ? ' exiting' : ''}`}
      style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
    >
      {fact}
    </div>
  )
}