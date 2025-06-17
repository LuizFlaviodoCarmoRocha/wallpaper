import { useState, useEffect, useRef } from 'react'
import './App.css'

const API_URL = 'https://api.nasa.gov/planetary/apod'
const API_KEY = 'DEMO_KEY'
const IMAGE_COUNT = 10
const ROTATION_INTERVAL_MS = 60 * 1000
const FETCH_INTERVAL_MS = 60 * 60 * 1000
const STORAGE_KEY = 'nasa-images'
const STORAGE_TIME_KEY = 'nasa-images-timestamp'

interface ImageData {
  url: string
  title: string
  date: string
  explanation: string
}

export default function App() {
  const [images, setImages] = useState<ImageData[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)

  const loadImages = async () => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY)
      const ts = localStorage.getItem(STORAGE_TIME_KEY)
      if (cached && ts && Date.now() - Number(ts) < FETCH_INTERVAL_MS) {
        try {
          const parsed = JSON.parse(cached)
          if (
            Array.isArray(parsed) &&
            parsed.length > 0 &&
            typeof parsed[0] === 'object' &&
            'url' in parsed[0]
          ) {
            setImages(parsed)
            return
          }
        } catch {}
      }
      const res = await fetch(
        `${API_URL}?api_key=${API_KEY}&count=${IMAGE_COUNT}`
      )
      const data = await res.json()
      const items: ImageData[] = Array.isArray(data)
        ? data
            .filter((item: any) => item.url)
            .map((item: any) => ({
              url: item.url,
              title: item.title || '',
              date: item.date || '',
              explanation: item.explanation || '',
            }))
        : []
      if (items.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
        localStorage.setItem(STORAGE_TIME_KEY, Date.now().toString())
        setImages(items)
        setCurrentIdx(0)
      }
    } catch (err) {
      console.error('Failed to fetch images', err)
    }
  }

  useEffect(() => {
    loadImages()
    const fetchInt = setInterval(loadImages, FETCH_INTERVAL_MS)
    return () => clearInterval(fetchInt)
  }, [])

  useEffect(() => {
    if (images.length === 0) return
    const rotateInt = setInterval(
      () => setCurrentIdx((idx) => (idx + 1) % images.length),
      ROTATION_INTERVAL_MS
    )
    return () => clearInterval(rotateInt)
  }, [images])

  const [overlayVisible, setOverlayVisible] = useState(true)
  const overlayTimer = useRef<number | undefined>(undefined)
  const resetOverlayTimer = () => {
    setOverlayVisible(true)
    if (overlayTimer.current) clearTimeout(overlayTimer.current)
    overlayTimer.current = window.setTimeout(
      () => setOverlayVisible(false),
      5000
    )
  }

  useEffect(() => {
    if (images.length === 0) return
    resetOverlayTimer()
  }, [currentIdx, images])

  return (
    <div className="carousel" onMouseMove={resetOverlayTimer}>
      {images.map((img, idx) => (
        <img
          key={img.url}
          src={img.url}
          className={`carousel-image${idx === currentIdx ? ' visible' : ''}`}
          alt={img.title || 'NASA APOD'}
        />
      ))}
      {images.length > 0 && (
        <div className={`overlay${overlayVisible ? ' visible' : ''}`}> 
          <h2>{images[currentIdx].title}</h2>
          <p className="date">{images[currentIdx].date}</p>
          <p className="explanation">{images[currentIdx].explanation}</p>
        </div>
      )}
    </div>
  )
}
