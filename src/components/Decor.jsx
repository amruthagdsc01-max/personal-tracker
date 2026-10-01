// Decorative motifs borrowed from the reference language: soft blobs with an
// offset outline stroke, topographic contour lines, four-point sparkles.

export function Blob({ className = '', fill = 'var(--blush)', stroke = 'var(--cocoa)', flip = false }) {
  return (
    <svg className={`decor ${className}`} viewBox="0 0 240 200" style={flip ? { transform: 'scaleX(-1)' } : undefined} aria-hidden="true">
      <path d="M20 40c10-30 60-40 95-25 30 13 55 8 80 28 30 24 20 70-10 90-28 19-50 5-80 22-35 21-90 15-98-25-6-31-1-60 13-90z" fill={fill} />
      <path d="M0 78c30-34 66 10 100-10 30-18 50-45 90-40 24 3 40 18 50 35" fill="none" stroke={stroke} strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}

export function Contours({ className = '', color = 'var(--blush)' }) {
  const rings = [0, 1, 2, 3, 4, 5]
  return (
    <svg className={`decor ${className}`} viewBox="0 0 240 240" aria-hidden="true">
      {rings.map((i) => (
        <path
          key={i}
          d={`M${120 - i * 18} ${40 + i * 8}c${30 - i * 3} -${28 - i * 2} ${80 - i * 8} -${10 - i} ${96 - i * 12} ${28 + i * 3}c${12 - i} ${40} -${40 - i * 4} ${96 - i * 10} -${90 - i * 12} ${104 - i * 12}c-${50 - i * 6} ${8} -${74 - i * 10} -${50 - i * 6} -${50 - i * 8} -${92 - i * 14}c4 -${24} ${20 - i} -${34 - i * 3} ${44 - i * 4} -${40 - i * 2}z`}
          fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round"
        />
      ))}
    </svg>
  )
}

export function Sparkle({ className = '', size = 28, color = 'var(--cocoa)' }) {
  return (
    <svg className={`sparkle ${className}`} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 0c.8 6.6 2.9 9.2 12 12-9.1 2.8-11.2 5.4-12 12-.8-6.6-2.9-9.2-12-12C9.100 9.200 11.200 6.600 12 0z" fill={color} />
    </svg>
  )
}
