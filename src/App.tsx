import { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'

const API_URL = 'https://api.nasa.gov/planetary/apod'
const API_KEY = 'DEMO_KEY'
const IMAGE_COUNT = 50
const ROTATION_INTERVAL_MS = 60 * 1000
const FETCH_INTERVAL_MS = 20 * 60 * 1000
const STORAGE_KEY = 'nasa-images'
const STORAGE_TIME_KEY = 'nasa-images-timestamp'
const LAST_IMAGE_KEY = 'nasa-last-image-date'

interface ImageData {
  url: string
  title: string
  date: string
  explanation: string
}

const TRANSITION_STYLES = ['fade', 'slide', 'zoom', 'flip'] as const
type TransitionStyle = (typeof TRANSITION_STYLES)[number]
type TransitionMode = 'sequential' | 'random' | 'manual'

export default function App() {
  const [images, setImages] = useState<ImageData[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [styleIdx, setStyleIdx] = useState(0)
  const [transitionMode, setTransitionMode] = useState<TransitionMode>('sequential')
  const [manualStyle, setManualStyle] = useState<TransitionStyle>(TRANSITION_STYLES[0])

  const loadImages = useCallback(async () => {
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
        const savedDate = localStorage.getItem(LAST_IMAGE_KEY)
        const initialIdx =
          savedDate != null
            ? items.findIndex((img) => img.date === savedDate)
            : -1
        setCurrentIdx(initialIdx >= 0 ? initialIdx : 0)
      }
    } catch (err) {
      console.error('Failed to fetch images', err)
    }
  }, [])

  useEffect(() => {
    loadImages()
    const fetchInt = setInterval(loadImages, FETCH_INTERVAL_MS)
    return () => clearInterval(fetchInt)
  }, [loadImages])

  // automatically rotate through unviewed images; when all have been shown, fetch a new batch
  const seenRef = useRef<Set<string>>(new Set())
  useEffect(() => {
    if (images.length === 0) return
    const rotate = () => {
      setCurrentIdx((prevIdx) => {
        seenRef.current.add(images[prevIdx].date)
        // find next unviewed image
        for (let i = 0; i < images.length; i++) {
          const idx = (prevIdx + 1 + i) % images.length
          if (!seenRef.current.has(images[idx].date)) {
            return idx
          }
        }
        // all seen → clear and fetch a new batch
        seenRef.current.clear()
        loadImages()
        return 0
      })
    }
    const rotateInt = setInterval(rotate, ROTATION_INTERVAL_MS)
    return () => clearInterval(rotateInt)
  }, [images, loadImages])

  // when we get new images, reset the seen set
  useEffect(() => {
    seenRef.current.clear()
  }, [images])

  const [overlayVisible, setOverlayVisible] = useState(true)
  const overlayTimer = useRef<number | undefined>(undefined)
  const resetOverlayTimer = () => {
    setOverlayVisible(true)
    if (overlayTimer.current) clearTimeout(overlayTimer.current)
    overlayTimer.current = window.setTimeout(() => setOverlayVisible(false), 5000)
  }

  useEffect(() => {
    if (images.length === 0) return
    resetOverlayTimer()
    // pick transition style based on mode: sequential, random, or manual selection
    switch (transitionMode) {
      case 'sequential':
        setStyleIdx((prev) => (prev + 1) % TRANSITION_STYLES.length)
        break
      case 'random':
        setStyleIdx(
          Math.floor(Math.random() * TRANSITION_STYLES.length)
        )
        break
      case 'manual':
        setStyleIdx(TRANSITION_STYLES.indexOf(manualStyle))
        break
    }
  }, [currentIdx, images, transitionMode, manualStyle])

  // persist last viewed image so we can restore on reload
  useEffect(() => {
    if (images.length === 0) return
    localStorage.setItem(LAST_IMAGE_KEY, images[currentIdx].date)
  }, [currentIdx, images])

  
  const carouselRef = useRef<HTMLDivElement>(null)
  const [isFull, setIsFull] = useState(false)
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      carouselRef.current?.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }
  useEffect(() => {
    const onChange = () => setIsFull(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  // download current image via blob to support cross-origin
  const downloadCurrentImage = async () => {
    const img = images[currentIdx]
    if (!img) return
    try {
      const res = await fetch(img.url)
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = `APOD-${img.date}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(blobUrl)
    } catch (err) {
      console.error('Download failed', err)
    }
  }

  const pageLink = images[currentIdx]
    ? `https://apod.nasa.gov/apod/ap${images[currentIdx].date.replace(/-/g, '').slice(2)}.html`
    : ''

  return (
    <div className={`carousel ${TRANSITION_STYLES[styleIdx]}`} ref={carouselRef} onMouseMove={resetOverlayTimer}>
      {images.length > 0 && (
        <div className={`controls${overlayVisible ? ' visible' : ''}`}> 
          <select
            className="transition-select"
            value={
              transitionMode === 'manual' ? manualStyle : transitionMode
            }
            onChange={(e) => {
              const v = e.target.value as string
              if (v === 'sequential' || v === 'random') {
                setTransitionMode(v)
              } else {
                setTransitionMode('manual')
                setManualStyle(v as TransitionStyle)
              }
            }}
            title="Transition style/mode"
          >
            <option value="sequential">sequential</option>
            <option value="random">random</option>
            {TRANSITION_STYLES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            onClick={toggleFullScreen}
            title={isFull ? 'Exit full screen' : 'Full screen'}
          >
            ⛶
          </button>
          <span className="transition-label" title="Current transition">
            {TRANSITION_STYLES[styleIdx]}
          </span>
          <button
            onClick={downloadCurrentImage}
            className="download-btn"
            title="Download image"
          >
            ⬇️
          </button>
          <a
            href={pageLink}
            target="_blank"
            rel="noopener noreferrer"
            className="download-btn"
            title="View on NASA APOD"
          >
            ℹ️
          </a>
        </div>
      )}
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
