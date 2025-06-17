import { useState, useEffect } from 'react'
import './App.css'

const API_URL = 'https://api.nasa.gov/planetary/apod'
const API_KEY = 'DEMO_KEY'
const IMAGE_COUNT = 10
const ROTATION_INTERVAL_MS = 60 * 1000 // 60 seconds
const FETCH_INTERVAL_MS = 60 * 60 * 1000 // 60 minutes
const STORAGE_KEY = 'nasa-images'
const STORAGE_TIME_KEY = 'nasa-images-timestamp'

export default function App() {
  const [images, setImages] = useState<string[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)

  const loadImages = async () => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY)
      const ts = localStorage.getItem(STORAGE_TIME_KEY)
      if (cached && ts && Date.now() - parseInt(ts, 10) < FETCH_INTERVAL_MS) {
        setImages(JSON.parse(cached))
        return
      }
      const res = await fetch(
        `${API_URL}?api_key=${API_KEY}&count=${IMAGE_COUNT}`
      )
      const data = await res.json()
      const urls: string[] = Array.isArray(data)
        ? data.map((item: any) => item.url).filter(Boolean)
        : []
      if (urls.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(urls))
        localStorage.setItem(
          STORAGE_TIME_KEY,
          Date.now().toString()
        )
        setImages(urls)
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
    const rotateInt = setInterval(() => {
      setCurrentIdx((idx) => (idx + 1) % images.length)
    }, ROTATION_INTERVAL_MS)
    return () => clearInterval(rotateInt)
  }, [images])

  return (
    <div className="carousel">
      {images.map((url, idx) => (
        <img
          key={url}
          src={url}
          className={`carousel-image${idx === currentIdx ? ' visible' : ''}`}
          alt="NASA APOD"
        />
      ))}
    </div>
  )
}
