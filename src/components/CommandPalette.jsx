import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, CornerDownLeft } from 'lucide-react'

/** Ctrl/⌘+K quick-jump, Figma-style. */
export default function CommandPalette({ open, onClose, items }) {
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const input = useRef(null)
  const list = useMemo(() => items.filter((i) => i.label.toLowerCase().includes(q.toLowerCase())), [items, q])

  useEffect(() => { if (open) { setQ(''); setSel(0); setTimeout(() => input.current?.focus(), 30) } }, [open])
  useEffect(() => setSel(0), [q])
  if (!open) return null

  const run = (it) => { it.run(); onClose() }
  const key = (e) => {
    if (e.key === 'Escape') onClose()
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(list.length - 1, s + 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(0, s - 1)) }
    if (e.key === 'Enter' && list[sel]) run(list[sel])
  }

  return (
    <div className="modal-back" onMouseDown={onClose}>
      <div className="palette" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-label="Command palette">
        <div className="palette-in"><Search size={18} /><input ref={input} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={key} placeholder="Jump to a page or do something…" /></div>
        <ul>
          {list.map((it, i) => (
            <li key={it.label} className={i === sel ? 'sel' : ''} onMouseEnter={() => setSel(i)} onClick={() => run(it)}>
              {it.icon}<span>{it.label}</span>{i === sel && <CornerDownLeft size={15} />}
            </li>
          ))}
          {!list.length && <li className="none">Nothing matches “{q}”.</li>}
        </ul>
      </div>
    </div>
  )
}
