// Watercolour-style florals drawn in SVG (no image files), inspired by the pink floral reference.
import { useId } from 'react'

const PALETTES = {
  pink: ['#FBC9C6', '#EE8F92'],
  rose: ['#F6A9AE', '#D9667A'],
  peach: ['#FFD9C2', '#F2A07B'],
  blush: ['#FFE6E3', '#F4B6B2'],
}

export function Blossom({ x = 0, y = 0, r = 30, rot = 0, tone = 'pink', centre = '#E9A23B' }) {
  const id = useId().replace(/:/g, '')
  const [a, b] = PALETTES[tone]
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <defs>
        <radialGradient id={id} cx="50%" cy="85%" r="90%">
          <stop offset="0%" stopColor={b} />
          <stop offset="100%" stopColor={a} />
        </radialGradient>
      </defs>
      {[0, 72, 144, 216, 288].map((d) => (
        <ellipse key={d} cx="0" cy={-r * 0.52} rx={r * 0.4} ry={r * 0.58} fill={`url(#${id})`} opacity="0.94" transform={`rotate(${d})`} />
      ))}
      <circle r={r * 0.17} fill={centre} />
      {[0, 60, 120, 180, 240, 300].map((d) => <circle key={d} cx={Math.cos((d * Math.PI) / 180) * r * 0.24} cy={Math.sin((d * Math.PI) / 180) * r * 0.24} r={r * 0.04} fill="#B5651D" />)}
    </g>
  )
}

const Leaf = ({ x, y, rot, s = 1, c = '#9DB58A' }) => (
  <ellipse cx={x} cy={y} rx={14 * s} ry={5.5 * s} fill={c} opacity="0.85" transform={`rotate(${rot} ${x} ${y})`} />
)
const Bud = ({ x, y, rot = 0, c = '#E3695F' }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}><ellipse rx="6" ry="10" fill={c} /><ellipse rx="3" ry="6" cy="-2" fill="#F4A099" opacity=".7" /></g>
)

/** A sprig of blossoms: use as a corner decoration. */
export function FlowerBranch({ className = '', flip = false }) {
  return (
    <svg className={`decor ${className}`} viewBox="0 0 320 360" style={flip ? { transform: 'scaleX(-1)' } : undefined} aria-hidden="true">
      <g fill="none" strokeLinecap="round">
        <path d="M30 350C60 280 90 230 150 190S250 110 285 40" stroke="#B9885F" strokeWidth="3" />
        <path d="M120 230C150 215 190 215 230 170" stroke="#9DB58A" strokeWidth="2.6" />
        <path d="M70 290C40 250 20 230 14 170" stroke="#C97964" strokeWidth="2.6" />
        <path d="M185 160C190 120 170 90 190 40" stroke="#9DB58A" strokeWidth="2.4" />
      </g>
      <Leaf x={105} y={255} rot={-35} /><Leaf x={160} y={190} rot={-60} s={1.1} /><Leaf x={210} y={135} rot={-50} /><Leaf x={55} y={310} rot={-25} s={0.9} />
      <Bud x={14} y={162} rot={-8} /><Bud x={192} y={34} rot={6} /><Bud x={100} y={200} rot={-30} c="#D9667A" />
      <Blossom x={282} y={52} r={36} rot={12} tone="pink" />
      <Blossom x={228} y={160} r={30} rot={-14} tone="blush" />
      <Blossom x={150} y={200} r={26} rot={30} tone="peach" />
      <Blossom x={85} y={265} r={22} rot={-20} tone="rose" />
      <Blossom x={30} y={330} r={18} rot={10} tone="pink" />
    </svg>
  )
}

export function WaxSeal({ className = '', size = 120 }) {
  const id = useId().replace(/:/g, '')
  return (
    <svg className={`decor ${className}`} width={size} height={size} viewBox="0 0 120 120" aria-hidden="true">
      <defs>
        <radialGradient id={id} cx="35%" cy="30%" r="80%"><stop offset="0%" stopColor="#F1BDC0" /><stop offset="100%" stopColor="#CE8590" /></radialGradient>
        <filter id={`${id}s`} x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#8E3B49" floodOpacity=".35" /></filter>
      </defs>
      <path filter={`url(#${id}s)`} fill={`url(#${id})`} d="M60 6c10 0 14 8 24 9s20 2 24 12-3 18-1 28 11 17 7 27-14 12-20 20-8 17-20 17-16-8-26-8-18 11-28 6-9-17-14-26-17-12-17-23 10-17 12-27-6-20 2-28 19-3 28-6 20-1 29-1z" />
      <circle cx="60" cy="60" r="38" fill="none" stroke="#fff" strokeOpacity=".28" strokeWidth="2" />
      <g transform="translate(60 60) scale(.55)" fill="#B96E7C" opacity=".75"><g>{[0, 72, 144, 216, 288].map((d) => <ellipse key={d} cy="-22" rx="14" ry="22" transform={`rotate(${d})`} />)}</g><circle r="9" fill="#EBC2C6" /></g>
    </svg>
  )
}

/** Soft blurred branch shadows for the page background. */
export function ShadowBranch({ className = '' }) {
  return (
    <svg className={`decor shadow-branch ${className}`} viewBox="0 0 400 600" aria-hidden="true">
      <defs><filter id="blurS"><feGaussianBlur stdDeviation="9" /></filter></defs>
      <g filter="url(#blurS)" fill="#4A1A09">
        <path d="M200 600C190 480 210 380 180 280S150 120 190 20" stroke="#4A1A09" strokeWidth="14" fill="none" />
        {[[160, 120, -30], [230, 170, 40], [150, 250, -45], [240, 300, 35], [165, 400, -35], [225, 450, 30], [180, 60, 20]].map(([x, y, r], i) => (
          <ellipse key={i} cx={x} cy={y} rx="38" ry="14" transform={`rotate(${r} ${x} ${y})`} />
        ))}
      </g>
    </svg>
  )
}

/** Notebook-style strip with punched holes, like behind the photo in the reference. */
export const TapeStrip = ({ className = '' }) => <div className={`tape ${className}`} aria-hidden="true" />
