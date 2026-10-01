const pad = (n) => String(n).padStart(2, '0')

export const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const today = () => toISO(new Date())
export const parse = (iso) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export const addDays = (iso, n) => {
  const d = parse(iso)
  d.setDate(d.getDate() + n)
  return toISO(d)
}
export const daysBetween = (a, b) => Math.round((parse(b) - parse(a)) / 86400000)
export const fmt = (iso, opts = { day: 'numeric', month: 'short' }) =>
  iso ? parse(iso).toLocaleDateString('en-IN', opts) : '—'
export const weekday = (iso) => parse(iso).toLocaleDateString('en-IN', { weekday: 'long' })
