import { useEffect, useRef, useState, Children } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * Scroll-snap carousel: drag with the mouse, swipe on touch, arrows, dots,
 * optional autoplay that pauses on hover/focus. `peek` shows neighbouring cards.
 */
export default function Carousel({ children, autoplay = 0, peek = false, className = '', arrows = true, dots = true }) {
  const ref = useRef(null)
  const drag = useRef({ down: false, x: 0, left: 0, moved: false })
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const items = Children.toArray(children)

  const go = (i) => {
    const el = ref.current
    if (!el) return
    const n = items.length
    const next = (i + n) % n
    const child = el.children[next]
    if (child) el.scrollTo({ left: child.offsetLeft - el.offsetLeft, behavior: 'smooth' })
    setIndex(next)
  }

  useEffect(() => {
    if (!autoplay || paused || items.length < 2) return
    const t = setInterval(() => go(index + 1), autoplay)
    return () => clearInterval(t)
  })

  const onScroll = () => {
    const el = ref.current
    if (!el) return
    let best = 0, dist = Infinity
    ;[...el.children].forEach((c, i) => {
      const d = Math.abs(c.offsetLeft - el.offsetLeft - el.scrollLeft)
      if (d < dist) { dist = d; best = i }
    })
    setIndex(best)
  }

  const onDown = (e) => {
    if (e.pointerType === 'touch') return
    drag.current = { down: true, x: e.clientX, left: ref.current.scrollLeft, moved: false }
  }
  const onMove = (e) => {
    const d = drag.current
    if (!d.down) return
    const dx = e.clientX - d.x
    if (Math.abs(dx) > 4) d.moved = true
    ref.current.style.scrollSnapType = 'none'
    ref.current.scrollLeft = d.left - dx
  }
  const onUp = () => {
    if (!drag.current.down) return
    drag.current.down = false
    ref.current.style.scrollSnapType = ''
    onScroll()
    go(index)
  }

  return (
    <div className={`carousel ${peek ? 'peek' : ''} ${className}`} onMouseEnter={() => setPaused(true)} onMouseLeave={() => { setPaused(false); onUp() }} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      <div ref={ref} className="carousel-track" onScroll={onScroll} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onClickCapture={(e) => { if (drag.current.moved) { e.stopPropagation(); e.preventDefault(); drag.current.moved = false } }}>
        {items.map((c, i) => <div className="carousel-slide" key={i}>{c}</div>)}
      </div>
      {(arrows || dots) && items.length > 1 && (
        <div className="carousel-ui">
          {dots && (
            <div className="dots">
              {items.map((_, i) => <button key={i} aria-label={`Slide ${i + 1}`} className={i === index ? 'on' : ''} onClick={() => go(i)} />)}
            </div>
          )}
          {arrows && (
            <div className="arrows">
              <button aria-label="Previous" onClick={() => go(index - 1)}><ChevronLeft size={18} /></button>
              <button aria-label="Next" onClick={() => go(index + 1)}><ChevronRight size={18} /></button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
