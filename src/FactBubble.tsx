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

  const [pos] = useState(() => ({
    x: Math.random() * 60 + 10,
    y: Math.random() * 60 + 10,
  }))

  return (
    <div
      className={`fact-bubble${exiting ? ' exiting' : ''}`}
      style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
    >
      {fact}
    </div>
  )
}