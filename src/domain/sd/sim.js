// Deterministic simulation logic behind the Labs. Pure functions + tiny state objects so they are testable.
// The UI only draws these; every number it shows is computed here.

/** Small seeded RNG (mulberry32) so a demo can be repeated. */
export function rng(seed = 1) {
  let a = seed >>> 0
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}
export function hashStr(s) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }
  return h >>> 0
}

// ---------------- load balancer ----------------
export const makeLb = (n = 4, cap = 6) => ({ servers: Array.from({ length: n }, (_, i) => ({ id: i, up: true, cap, active: [], served: 0, dropped: 0, errors: 0 })), rr: 0, total: 0, healthChecks: true, tick: 0 })

/** Choose a backend index, or -1 if none is eligible. */
export function pickServer(lb, algo, key, rand) {
  const ok = lb.servers.filter((s) => (lb.healthChecks ? s.up : true))
  if (!ok.length) return -1
  if (algo === 'rr') { lb.rr = (lb.rr + 1) % ok.length; return ok[lb.rr].id }
  if (algo === 'least') return ok.reduce((b, s) => (s.active.length < b.active.length ? s : b)).id
  if (algo === 'hash') return ok[hashStr(String(key)) % ok.length].id
  return ok[Math.floor(rand() * ok.length)].id
}
/** One tick: finish work, then route `arrivals` (array of {dur,key}). */
export function lbTick(lb, algo, arrivals, rand) {
  lb.tick += 1
  for (const s of lb.servers) s.active = s.active.map((r) => r - 1).filter((r) => r > 0)
  const log = []
  for (const a of arrivals) {
    lb.total += 1
    const id = pickServer(lb, algo, a.key, rand)
    if (id < 0) { log.push({ id: -1, ok: false }); continue }
    const s = lb.servers[id]
    if (!s.up) { s.errors += 1; log.push({ id, ok: false, why: 'down' }); continue }
    if (s.active.length >= s.cap) { s.dropped += 1; log.push({ id, ok: false, why: 'full' }); continue }
    s.active.push(a.dur); s.served += 1; log.push({ id, ok: true })
  }
  return log
}

// ---------------- cache ----------------
export const makeCache = (cap = 8, policy = 'lru', ttl = 0) => ({ cap, policy, ttl, map: new Map(), freq: new Map(), hits: 0, misses: 0, evictions: 0, now: 0 })
export function cacheGet(c, key) {
  c.now += 1
  const e = c.map.get(key)
  if (e && (!c.ttl || c.now - e.t <= c.ttl)) {
    c.hits += 1
    if (c.policy === 'lru') { c.map.delete(key); c.map.set(key, e) }
    c.freq.set(key, (c.freq.get(key) || 0) + 1)
    return { hit: true, evicted: null }
  }
  c.misses += 1
  if (e) c.map.delete(key) // expired
  let evicted = null
  if (c.map.size >= c.cap) {
    if (c.policy === 'lfu') evicted = [...c.map.keys()].reduce((b, k) => ((c.freq.get(k) || 0) < (c.freq.get(b) || 0) ? k : b))
    else evicted = c.map.keys().next().value // oldest insertion/use for FIFO and LRU
    c.map.delete(evicted); c.freq.delete(evicted); c.evictions += 1
  }
  c.map.set(key, { t: c.now }); c.freq.set(key, 1)
  return { hit: false, evicted }
}
export const hitRatio = (c) => (c.hits + c.misses ? c.hits / (c.hits + c.misses) : 0)
/** Zipf-like popularity: a few keys get most of the traffic. */
export function zipfKey(n, s, rand) {
  const weights = Array.from({ length: n }, (_, i) => 1 / Math.pow(i + 1, s))
  const sum = weights.reduce((a, b) => a + b, 0)
  let r = rand() * sum
  for (let i = 0; i < n; i++) { r -= weights[i]; if (r <= 0) return `k${i + 1}` }
  return `k${n}`
}
/** Average latency with and without the cache (ms). */
export const cacheLatency = (c, cacheMs = 1, dbMs = 50) => { const h = hitRatio(c); return { withCache: +(h * cacheMs + (1 - h) * (dbMs + cacheMs)).toFixed(1), without: dbMs } }

// ---------------- replication ----------------
export const makeRepl = (replicas = 2, lag = 3, mode = 'async') => ({
  mode, lag, tick: 0, seq: 0, primary: { id: 'P', up: true, data: {}, seq: 0 },
  replicas: Array.from({ length: replicas }, (_, i) => ({ id: `R${i + 1}`, up: true, data: {}, seq: 0 })),
  pending: [], acked: 0, lost: 0, log: [],
})
export function replWrite(s, key, value) {
  if (!s.primary.up) { s.log.push('Write rejected: no primary'); return false }
  s.seq += 1
  const w = { seq: s.seq, key, value }
  s.primary.data[key] = value; s.primary.seq = w.seq
  if (s.mode === 'sync') { for (const r of s.replicas) if (r.up) { r.data[key] = value; r.seq = w.seq }; s.acked = w.seq }
  else { s.acked = w.seq; for (const r of s.replicas) s.pending.push({ ...w, to: r.id, at: s.tick + s.lag }) }
  return true
}
export function replTick(s) {
  s.tick += 1
  const due = s.pending.filter((p) => p.at <= s.tick)
  s.pending = s.pending.filter((p) => p.at > s.tick)
  for (const p of due) { const r = s.replicas.find((x) => x.id === p.to); if (r?.up) { r.data[p.key] = p.value; r.seq = Math.max(r.seq, p.seq) } }
}
export function replRead(s, node, key) {
  const n = node === 'P' ? s.primary : s.replicas.find((r) => r.id === node)
  if (!n || !n.up) return { ok: false }
  const truth = s.primary.up ? s.primary.data[key] : undefined
  return { ok: true, value: n.data[key], stale: s.primary.up && n.data[key] !== truth }
}
/** Primary dies: promote the most up-to-date replica; anything it had not received is lost. */
export function replFailover(s) {
  s.primary.up = false
  const best = s.replicas.filter((r) => r.up).sort((a, b) => b.seq - a.seq)[0]
  if (!best) return { promoted: null, lost: s.acked }
  const lost = Math.max(0, s.acked - best.seq)
  s.lost += lost
  s.replicas = s.replicas.filter((r) => r !== best)
  s.primary = { id: best.id, up: true, data: best.data, seq: best.seq }
  s.pending = s.pending.filter((p) => s.replicas.some((r) => r.id === p.to))
  s.acked = best.seq
  return { promoted: best.id, lost }
}

// ---------------- sharding ----------------
export const modShard = (key, n) => hashStr(String(key)) % n
export function makeRing(nodes, vnodes = 120) {
  const ring = []
  for (const n of nodes) for (let v = 0; v < vnodes; v++) ring.push({ h: hashStr(`${n}#${v}`), n })
  return ring.sort((a, b) => a.h - b.h)
}
export function ringLookup(ring, key) {
  const h = hashStr(String(key))
  let lo = 0, hi = ring.length - 1
  if (h > ring[hi].h) return ring[0].n
  while (lo < hi) { const m = (lo + hi) >> 1; if (ring[m].h >= h) hi = m; else lo = m + 1 }
  return ring[lo].n
}
export const shardNames = (n) => Array.from({ length: n }, (_, i) => `S${i + 1}`)
/** Fraction of keys that change shard when going from `a` shards to `b` shards. */
export function movedFraction(keys, a, b, strategy) {
  let moved = 0
  if (strategy === 'mod') for (const k of keys) { if (modShard(k, a) !== modShard(k, b)) moved++ }
  else { const ra = makeRing(shardNames(a)), rb = makeRing(shardNames(b)); for (const k of keys) { if (ringLookup(ra, k) !== ringLookup(rb, k)) moved++ } }
  return keys.length ? moved / keys.length : 0
}
export function distribution(keys, n, strategy) {
  const counts = Object.fromEntries(shardNames(n).map((s) => [s, 0]))
  if (strategy === 'mod') for (const k of keys) counts[`S${modShard(k, n) + 1}`]++
  else { const r = makeRing(shardNames(n)); for (const k of keys) counts[ringLookup(r, k)]++ }
  return counts
}
/** Range sharding by first letter of the key (shows hot spots for skewed keys). */
export function rangeDistribution(keys, n) {
  const counts = Object.fromEntries(shardNames(n).map((s) => [s, 0]))
  for (const k of keys) { const c = Math.min(25, Math.max(0, String(k).toLowerCase().charCodeAt(0) - 97)); counts[`S${Math.min(n - 1, Math.floor((c * n) / 26)) + 1}`]++ }
  return counts
}

// ---------------- message queue ----------------
export const makeQueue = (consumers = 2) => ({ tick: 0, nextId: 1, ready: [], inflight: [], done: [], dead: [], processed: {}, duplicates: 0, produced: 0, redelivered: 0, vis: 6,
  consumers: Array.from({ length: consumers }, (_, i) => ({ id: `C${i + 1}`, up: true, speed: 1, job: null })), maxAttempts: 3 })
export function qProduce(q, n = 1) { for (let i = 0; i < n; i++) { q.ready.push({ id: q.nextId++, attempts: 0 }); q.produced += 1 } }
/** work = ticks of work per message (before speed). Consumers that go down mid-job do not ack. */
export function qTick(q, work = 3) {
  q.tick += 1
  // visibility timeout: unacked messages come back
  for (const f of q.inflight.filter((x) => x.deadline <= q.tick)) {
    q.inflight = q.inflight.filter((x) => x !== f)
    if (f.msg.attempts >= q.maxAttempts) q.dead.push(f.msg); else { q.ready.unshift(f.msg); q.redelivered += 1 }
    const c = q.consumers.find((x) => x.job?.msg.id === f.msg.id && !x.up); if (c) c.job = null
  }
  for (const c of q.consumers) {
    if (!c.up) continue
    if (c.job) { c.job.left -= c.speed; if (c.job.left <= 0) {
      const id = c.job.msg.id
      q.inflight = q.inflight.filter((x) => x.msg.id !== id) // ack
      q.processed[id] = (q.processed[id] || 0) + 1
      if (q.processed[id] === 2) q.duplicates += 1
      if (q.processed[id] === 1) q.done.push(id)
      c.job = null } }
    if (!c.job && q.ready.length) {
      const msg = q.ready.shift(); msg.attempts += 1
      c.job = { msg, left: work }
      q.inflight.push({ msg, deadline: q.tick + q.vis })
    }
  }
}

// ---------------- rate limiter ----------------
/** kind: token | leaky | fixed | sliding. t is a fake clock in seconds (float ok). */
export function makeLimiter(kind, { rate = 2, burst = 5, limit = 5, window = 5 } = {}) {
  return { kind, rate, burst, limit, window, tokens: burst, last: 0, level: 0, count: 0, start: 0, log: [] }
}
export function allow(l, t) {
  if (l.kind === 'token') {
    l.tokens = Math.min(l.burst, l.tokens + (t - l.last) * l.rate); l.last = t
    if (l.tokens >= 1) { l.tokens -= 1; return true } return false
  }
  if (l.kind === 'leaky') {
    l.level = Math.max(0, l.level - (t - l.last) * l.rate); l.last = t
    if (l.level + 1 <= l.burst) { l.level += 1; return true } return false
  }
  if (l.kind === 'fixed') {
    if (t - l.start >= l.window) { l.start = Math.floor(t / l.window) * l.window; l.count = 0 }
    if (l.count < l.limit) { l.count += 1; return true } return false
  }
  l.log = l.log.filter((x) => x > t - l.window)
  if (l.log.length < l.limit) { l.log.push(t); return true } return false
}

// ---------------- estimation ----------------
export function estimate({ dau, actionsPerUser, readRatio, bytesPerItem, retentionYears, replication, peakFactor }) {
  const SEC = 86400
  const total = dau * actionsPerUser
  const rw = readRatio >= 1 ? readRatio : 1
  const writes = total / (1 + rw)
  const reads = total - writes
  const wq = writes / SEC, rq = reads / SEC
  const bytesPerYear = writes * 365 * bytesPerItem
  return {
    qps: total / SEC, peakQps: (total / SEC) * peakFactor, writeQps: wq, readQps: rq, peakReadQps: rq * peakFactor,
    storageYearGB: bytesPerYear / 1e9, totalTB: (bytesPerYear * retentionYears * replication) / 1e12,
    egressMBps: (rq * peakFactor * bytesPerItem) / 1e6,
  }
}

// ---------------- architecture playground ----------------
const AVAIL = 0.999
export const PG_DEFAULT = { cdn: false, lb: false, servers: 1, cache: false, replicas: 0, queue: false }
/** Simplified capacity model: what each tier can carry versus what arrives. */
export function playground(load, c) {
  const staticShare = 0.6
  const cdnHit = c.cdn ? 0.95 : 0
  const appLoad = load * staticShare * (1 - cdnHit) + load * (1 - staticShare)
  const effServers = c.lb ? c.servers : 1
  const appCap = effServers * 400
  const dynamicReads = load * (1 - staticShare) * 0.9
  const dynamicWrites = load * (1 - staticShare) * 0.1
  const dbReadLoad = dynamicReads * (c.cache ? 0.1 : 1) + load * staticShare * (1 - cdnHit) * 0.05
  const dbReadCap = 800 + c.replicas * 800
  const writeCap = 300
  const writeOver = Math.max(0, dynamicWrites - writeCap)
  const tiers = [
    { id: 'cdn', name: 'CDN', on: c.cdn, load: load * staticShare, cap: c.cdn ? Infinity : 0 },
    { id: 'app', name: 'App servers', on: true, load: appLoad, cap: appCap },
    { id: 'dbr', name: 'Database reads', on: true, load: dbReadLoad, cap: dbReadCap },
    { id: 'dbw', name: 'Database writes', on: true, load: dynamicWrites, cap: c.queue ? writeCap * 1.0 : writeCap, buffered: c.queue },
  ].map((t) => ({ ...t, util: t.cap === Infinity ? 0 : t.cap ? t.load / t.cap : 0 }))
  const failing = tiers.filter((t) => t.on && t.util > 1 && !(t.buffered && t.id === 'dbw'))
  const bottleneck = [...tiers].filter((t) => t.on && t.cap !== Infinity).sort((a, b) => b.util - a.util)[0]
  const queued = c.queue ? writeOver : 0
  const ok = failing.length === 0
  const served = ok ? 100 : Math.max(0, Math.round(100 * Math.min(1, ...failing.map((t) => 1 / t.util))))
  const spofs = [!c.lb || c.servers < 2 ? 'App tier has a single point of failure' : null, c.replicas < 1 ? 'Database has no standby: one failure stops everything' : null, !c.lb ? 'No load balancer: traffic goes to one server' : null].filter(Boolean)
  const tierAvail = (n) => 1 - Math.pow(1 - AVAIL, Math.max(1, n))
  const availability = tierAvail(c.lb ? c.servers : 1) * tierAvail(1 + c.replicas) * (c.lb ? AVAIL : 1)
  const latency = Math.min(2000, Math.round(20 + (c.cdn ? 0 : 30) + (c.cache ? 5 : 40) + (bottleneck && bottleneck.util > 0.8 ? 120 * (bottleneck.util - 0.8) * 5 : 0)))
  return { tiers, bottleneck, ok, served, queued: Math.round(queued), spofs, availability, latency, dbReadLoad: Math.round(dbReadLoad), appLoad: Math.round(appLoad) }
}
