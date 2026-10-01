import { useRef, useEffect, useState } from 'react'
import { X } from 'lucide-react'

export function Ring({ pct, size = 120, stroke = 10, children }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const [shown, setShown] = useState(0)
  useEffect(() => { const t = requestAnimationFrame(() => setShown(pct)); return () => cancelAnimationFrame(t) }, [pct])
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--taupe)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--cocoa)" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (c * Math.min(100, shown)) / 100} transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: 'stroke-dashoffset 1s cubic-bezier(.2,.8,.2,1)' }} />
      </svg>
      <div className="ring-label">{children}</div>
    </div>
  )
}

export function Bar({ pct, tone = 'cocoa' }) {
  return <div className="bar"><span className={tone} style={{ width: `${Math.min(100, pct)}%` }} /></div>
}

/** Card with a subtle pointer-follow tilt and glow. */
export function Card({ children, className = '', tilt = true, as: Tag = 'div', ...rest }) {
  const ref = useRef(null)
  const move = (e) => {
    if (!tilt) return
    const el = ref.current
    const b = el.getBoundingClientRect()
    const x = (e.clientX - b.left) / b.width - 0.5
    const y = (e.clientY - b.top) / b.height - 0.5
    el.style.setProperty('--rx', `${(-y * 3).toFixed(2)}deg`)
    el.style.setProperty('--ry', `${(x * 3).toFixed(2)}deg`)
    el.style.setProperty('--mx', `${(x + 0.5) * 100}%`)
    el.style.setProperty('--my', `${(y + 0.5) * 100}%`)
  }
  const leave = () => { const el = ref.current; el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg') }
  return <Tag ref={ref} className={`card ${tilt ? 'tilt' : ''} ${className}`} onPointerMove={move} onPointerLeave={leave} {...rest}>{children}</Tag>
}

export function PageHead({ script, title, sub, right }) {
  return (
    <header className="page-head">
      <div>
        <span className="script">{script}</span>
        <h1>{title}</h1>
        {sub && <p className="sub">{sub}</p>}
      </div>
      {right}
    </header>
  )
}

export function Chip({ children, tone = '', onClick, active }) {
  const Tag = onClick ? 'button' : 'span'
  return <Tag className={`chip ${tone} ${active ? 'active' : ''}`} onClick={onClick}>{children}</Tag>
}

export function Empty({ icon, title, children }) {
  return <div className="empty">{icon}<h3>{title}</h3><p>{children}</p></div>
}

export function Modal({ title, onClose, children }) {
  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])
  return (
    <div className="modal-back" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-label={title}>
        <div className="modal-head"><h2>{title}</h2><button className="icon-btn" onClick={onClose} aria-label="Close"><X size={20} /></button></div>
        {children}
      </div>
    </div>
  )
}
