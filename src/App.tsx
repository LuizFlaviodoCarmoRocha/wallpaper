import { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'
import FactBubble from './FactBubble'
import { useLLMFacts } from './hooks/useLLMFacts'
const AmbientIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6a6 6 0 0 1-6 6c-3.31 0-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
  </svg>
)

const MenuIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" />
  </svg>
)

const FullscreenIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M3 3h6v2H5v4H3V3zm14 0v6h-2V5h-4V3h6zM3 13h2v4h4v2H3v-6zm14 8h-6v-2h4v-4h2v6z" />
  </svg>
)

const LightBulbIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M9 21h6v-1.5H9V21zm3-19C8.13 2 5 5.13 5 9c0 3.08 1.64 5.64 4 6.8V20h2v-4.2c2.36-1.16 4-3.72 4-6.8 0-3.87-3.13-7-7-7z" />
  </svg>
)

const API_URL = 'https://api.nasa.gov/planetary/apod'
const API_KEY = 'DEMO_KEY'
const IMAGE_COUNT = 50
// rotationSec controls how many seconds each image is shown (slider adjustable)
const DEFAULT_ROTATION_SEC = 60
const FETCH_INTERVAL_MS = 20 * 60 * 1000
// overlay display timing (initial based on text length vs user-activated)
// shorter display durations in development for faster iteration
const MIN_INITIAL_MS = import.meta.env.DEV ? 2000 : 5000
const MAX_INITIAL_MS = import.meta.env.DEV ? 8000 : 20000
const MS_PER_WORD    = import.meta.env.DEV ? 200  : 400

// trivia pop-up delays (ms)
// longer delays in development to avoid overlapping pop-ups
const TRIVIA_START_DELAY_MIN_MS = import.meta.env.DEV ? 3000 : 3000
const TRIVIA_START_DELAY_MAX_MS = import.meta.env.DEV ? 6000 : 8000
const TRIVIA_ROTATION_DELAY_MIN_MS = import.meta.env.DEV ? 6000 : 13000
const TRIVIA_ROTATION_DELAY_MAX_MS = import.meta.env.DEV ? 12000 : 27000
// skip pop-up if image transition occurs within next 10s
const POPUP_TRANSITION_GAP_MS = 10000
const STORAGE_KEY = 'nasa-images'
const STORAGE_TIME_KEY = 'nasa-images-timestamp'
const LAST_IMAGE_KEY = 'nasa-last-image-date'
const FAVORITES_KEY = 'nasa-favorites'

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
  const [rotationSec, setRotationSec] = useState(DEFAULT_ROTATION_SEC)
  const [styleIdx, setStyleIdx] = useState(0)
  const [transitionMode, setTransitionMode] = useState<TransitionMode>('sequential')
  const [manualStyle, setManualStyle] = useState<TransitionStyle>(TRANSITION_STYLES[0])
  // favorite images by date
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [controlsVisible, setControlsVisible] = useState(false)
  const controlsTimer = useRef<number | undefined>(undefined)
  const showControls = () => {
    setControlsVisible(true)
    if (controlsTimer.current) clearTimeout(controlsTimer.current)
    controlsTimer.current = window.setTimeout(() => {
      setControlsVisible(false)
      setMenuOpen(false)
    }, MIN_INITIAL_MS)
  }
  const [cursorVisible, setCursorVisible] = useState(true)
  const cursorTimer = useRef<number | undefined>(undefined)
  const showCursor = () => {
    setCursorVisible(true)
    if (cursorTimer.current) clearTimeout(cursorTimer.current)
    cursorTimer.current = window.setTimeout(() => {
      setCursorVisible(false)
    }, 3000)
  }

  // experimental ambient movement (toggle via button or 'M' key)
  const [ambientMovement, setAmbientMovement] = useState(true)
  const toggleAmbient = () => setAmbientMovement((v) => !v)
  // pop-up trivia toggle (light bulb icon)
  const [popUpEnabled, setPopUpEnabled] = useState(true)
  const togglePopUp = () => setPopUpEnabled((v) => !v)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if (key === 'm') toggleAmbient()
      else if (key === 'p') togglePopUp()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
}, [toggleAmbient, togglePopUp])

  // hamburger menu open/close (alternate controls)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuBtnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const toggleMenu = () => setMenuOpen((v) => !v)
  // close menu when clicking outside
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (menuOpen) {
        const target = e.target as Node
        if (
          menuRef.current && !menuRef.current.contains(target) &&
          menuBtnRef.current && !menuBtnRef.current.contains(target)
        ) {
          setMenuOpen(false)
        }
      }
    }
    window.addEventListener('mousedown', onClickOutside)
    return () => window.removeEventListener('mousedown', onClickOutside)
  }, [menuOpen])

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
    const rotateInt = setInterval(rotate, rotationSec * 1000)
    return () => clearInterval(rotateInt)
  }, [images, loadImages, rotationSec])

  // when we get new images, reset the seen set
  useEffect(() => {
    seenRef.current.clear()
  }, [images])

  // load saved favorites from localStorage
  useEffect(() => {
    const fav = localStorage.getItem(FAVORITES_KEY)
    if (fav) {
      try {
        setFavorites(new Set<string>(JSON.parse(fav)))
      } catch {}
    }
  }, [])

  // persist favorites to localStorage when changed
  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(favorites)))
  }, [favorites])

  const [overlayVisible, setOverlayVisible] = useState(true)
  const overlayTimer = useRef<number | undefined>(undefined)
  // show overlay; if initial, duration scales to text length, else fixed
  const showOverlay = (initial: boolean = false) => {
    setOverlayVisible(true)
    if (overlayTimer.current) clearTimeout(overlayTimer.current)
    let timeout = initial
      ? (() => {
          const words = images[currentIdx]?.explanation?.split(/\s+/).length || 0
          return Math.min(
            MAX_INITIAL_MS,
            Math.max(MIN_INITIAL_MS, words * MS_PER_WORD)
          )
        })()
      : MIN_INITIAL_MS
    overlayTimer.current = window.setTimeout(
      () => setOverlayVisible(false),
      timeout
    )
  }

  useEffect(() => {
    if (images.length === 0) return
    showOverlay(true)
    // hide controls on new image, user must mouse-move to show them
    setControlsVisible(false)
    // pick next transition style
    switch (transitionMode) {
      case 'sequential':
        setStyleIdx((prev) => (prev + 1) % TRANSITION_STYLES.length)
        break
      case 'random':
        setStyleIdx(Math.floor(Math.random() * TRANSITION_STYLES.length))
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

  // prefetch next image to detect broken links and skip them in rotation
  useEffect(() => {
    if (images.length === 0) return
    const nextIdx = (currentIdx + 1) % images.length
    const nextData = images[nextIdx]
    const img = new Image()
    img.src = nextData.url
    img.onerror = () => {
      console.warn('Failed to preload image, skipping', nextData.url)
      seenRef.current.add(nextData.date)
    }
    return () => {
      img.onload = null
      img.onerror = null
    }
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

  // allow left/right arrow for navigation, F for fullscreen, D for download
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!images.length) return
      const key = e.key.toLowerCase()
      if (key === 'arrowleft') {
        setCurrentIdx((i) => (i - 1 + images.length) % images.length)
        showOverlay(false)
        showControls()
        showCursor()
      } else if (key === 'arrowright') {
        setCurrentIdx((i) => (i + 1) % images.length)
        showOverlay(false)
        showControls()
        showCursor()
      } else if (key === 'f') {
        toggleFullScreen()
      } else if (key === 'd') {
        downloadCurrentImage()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [images])

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

  // Pop‑Up Video: fetch and cycle trivia facts for the current image
  const currentImage = images[currentIdx]
  const descWithDate = currentImage
    ? `${currentImage.explanation} (Image posted on ${currentImage.date})`
    : ''
  const facts = useLLMFacts(
    currentImage?.title || '',
    descWithDate
  )
  const [currentFactIdx, setCurrentFactIdx] = useState<number>(-1)
  const lastFactIdxRef = useRef<number>(-1)
  const popUpTimeoutsRef = useRef<number[]>([])
  const lastImageChangeMsRef = useRef<number>(Date.now())

  // schedule pop-up trivia after overlay hides for this image (shortcut key P)
  useEffect(() => {
    if (!popUpEnabled || facts.length === 0 || overlayVisible) return
    lastImageChangeMsRef.current = Date.now()
    console.debug(
      '[Trivia] scheduling pop-ups for image',
      currentIdx,
      { popUpEnabled, overlayVisible, factsLength: facts.length }
    )
    setCurrentFactIdx(-1)
    lastFactIdxRef.current = -1

    const startDelay =
      Math.random() * (TRIVIA_START_DELAY_MAX_MS - TRIVIA_START_DELAY_MIN_MS) +
      TRIVIA_START_DELAY_MIN_MS
    const startTimer = window.setTimeout(() => {
      const elapsed = Date.now() - lastImageChangeMsRef.current
      const timeToNext = rotationSec * 1000 - elapsed
      if (timeToNext < POPUP_TRANSITION_GAP_MS) {
        console.debug('[Trivia] skipping initial pop-up; transition in', timeToNext, 'ms')
        return
      }
      setCurrentFactIdx(0)
      lastFactIdxRef.current = 0
      new Audio('/assets/pop.mp3').play().catch(() => {})

      function scheduleNext() {
        const rnd =
          Math.random() * (TRIVIA_ROTATION_DELAY_MAX_MS - TRIVIA_ROTATION_DELAY_MIN_MS) +
          TRIVIA_ROTATION_DELAY_MIN_MS
        console.debug('[Trivia] scheduling rotation timeout ms', Math.round(rnd))
        const t = window.setTimeout(() => {
          const elapsedInner = Date.now() - lastImageChangeMsRef.current
          const timeLeft = rotationSec * 1000 - elapsedInner
          if (timeLeft < POPUP_TRANSITION_GAP_MS) {
            console.debug('[Trivia] skipping next pop-up; transition in', timeLeft, 'ms')
            return
          }
          const prevIdx = lastFactIdxRef.current
          const next = (prevIdx + 1) % facts.length
          lastFactIdxRef.current = next
          setCurrentFactIdx(next)
          new Audio('/assets/pop.mp3').play().catch(() => {})
          scheduleNext()
        }, rnd)
        popUpTimeoutsRef.current.push(t)
      }

      scheduleNext()
    }, startDelay)
    popUpTimeoutsRef.current.push(startTimer)
    return () => {
      popUpTimeoutsRef.current.forEach(clearTimeout)
      popUpTimeoutsRef.current = []
    }
  }, [overlayVisible, facts, popUpEnabled, currentIdx, rotationSec])


  const pageLink = images[currentIdx]
    ? `https://apod.nasa.gov/apod/ap${images[currentIdx].date.replace(/-/g, '').slice(2)}.html`
    : ''

  return (
    <div
      className={`carousel ${TRANSITION_STYLES[styleIdx]}${
        cursorVisible ? '' : ' hide-cursor'
      }${ambientMovement ? ' ambient' : ''}`}
      ref={carouselRef}
      onMouseMove={() => {
        showOverlay(false)
        showControls()
        showCursor()
      }}
    >
{popUpEnabled && currentFactIdx >= 0 && facts[currentFactIdx] && (
        <FactBubble
          fact={facts[currentFactIdx]}
          onDone={() => setCurrentFactIdx(-1)}
        />
      )}
      {images.length > 0 && (
        <div className={`controls${controlsVisible ? ' visible' : ''}`}> 
          <button
            ref={menuBtnRef}
            onClick={toggleMenu}
            className="menu-btn"
            title="Menu"
          >
            <MenuIcon />
          </button>
          <div className="right-controls">
            <button
              onClick={togglePopUp}
              className={`download-btn trivia-btn${popUpEnabled ? ' active' : ''}`}
              title={`Pop‑Up Trivia: ${popUpEnabled ? 'On' : 'Off'} (P)`}
            >
              <LightBulbIcon />
            </button>
            <button
              onClick={toggleAmbient}
              className={`download-btn ambient-btn${ambientMovement ? ' active' : ''}`}
              title={`Ambient movement: ${ambientMovement ? 'On' : 'Off'} (M)`}
            >
              <AmbientIcon />
            </button>
            <button
              onClick={toggleFullScreen}
              className={`download-btn full-screen-btn${isFull ? ' active' : ''}`}
              title={`Full screen: ${isFull ? 'On' : 'Off'} (F)`}
            >
              <FullscreenIcon />
            </button>
          </div>
        </div>
      )}
      {menuOpen && (
        <div ref={menuRef} className="menu-dropdown">
          <button
            className="menu-item top-level"
            onClick={() => {
              window.open(pageLink, '_blank')
              setMenuOpen(false)
            }}
          >
            Get Info
          </button>
          <button
            className="menu-item top-level"
            onClick={() => {
              downloadCurrentImage()
              setMenuOpen(false)
            }}
          >
            Download
          </button>
          <div className="menu-item has-submenu">
            &gt; Duration
            <div className="submenu">
              {[15, 30, 60, 120, 180, 240, 300].map((sec) => (
                <button
                  key={sec}
                  className={`menu-item${rotationSec === sec ? ' active' : ''}`}
                  onClick={() => {
                    setRotationSec(sec)
                    setMenuOpen(false)
                  }}
                >
                  {sec < 60 ? `${sec}s` : `${sec / 60}m`}
                </button>
              ))}
            </div>
          </div>
          <div className="menu-item has-submenu">
            &gt; Transition
            <div className="submenu">
              <button
                className={`menu-item${transitionMode === 'sequential' ? ' active' : ''}`}
                onClick={() => {
                  setTransitionMode('sequential')
                  setMenuOpen(false)
                }}
              >
                sequential
              </button>
              <button
                className={`menu-item${transitionMode === 'random' ? ' active' : ''}`}
                onClick={() => {
                  setTransitionMode('random')
                  setMenuOpen(false)
                }}
              >
                random
              </button>
              {TRANSITION_STYLES.map((s) => (
                <button
                  key={s}
                  className={`menu-item${transitionMode === 'manual' && manualStyle === s ? ' active' : ''}`}
                  onClick={() => {
                    setTransitionMode('manual')
                    setManualStyle(s)
                    setMenuOpen(false)
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
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
