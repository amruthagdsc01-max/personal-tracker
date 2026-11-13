import { describe, it, expect } from 'vitest'
import { rng, makeLb, lbTick, makeCache, cacheGet, hitRatio, zipfKey, makeRepl, replWrite, replTick, replRead, replFailover, movedFraction, distribution, makeQueue, qProduce, qTick, makeLimiter, allow, estimate, playground, PG_DEFAULT } from './sim.js'

describe('load balancer', () => {
  it('round robin spreads evenly; hash is sticky; health checks avoid dead servers', () => {
    const r = rng(1)
    const lb = makeLb(4, 100)
    lbTick(lb, 'rr', Array.from({ length: 40 }, () => ({ dur: 1, key: 'x' })), r)
    expect(lb.servers.map((s) => s.served)).toEqual([10, 10, 10, 10])
    const h = makeLb(4, 100)
    lbTick(h, 'hash', Array.from({ length: 20 }, () => ({ dur: 1, key: 'user-7' })), r)
    expect(h.servers.filter((s) => s.served > 0)).toHaveLength(1)
    const d = makeLb(3, 100); d.servers[1].up = false
    lbTick(d, 'rr', Array.from({ length: 30 }, () => ({ dur: 1, key: 'k' })), r)
    expect(d.servers[1].errors + d.servers[1].served).toBe(0)
    d.healthChecks = false
    lbTick(d, 'rr', Array.from({ length: 30 }, () => ({ dur: 1, key: 'k' })), r)
    expect(d.servers[1].errors).toBeGreaterThan(0)
  })
  it('least-connections drops no more than round robin when durations vary', () => {
    const run = (algo) => { const r = rng(5); const lb = makeLb(3, 4); for (let t = 0; t < 60; t++) lbTick(lb, algo, [{ dur: t % 3 === 0 ? 9 : 1, key: t }, { dur: 1, key: t + 1 }], r); return lb.servers.reduce((a, s) => a + s.dropped, 0) }
    expect(run('least')).toBeLessThanOrEqual(run('rr'))
  })
})

describe('cache', () => {
  it('LRU keeps recently used keys; FIFO does not', () => {
    const lru = makeCache(2, 'lru'); ['a', 'b', 'a', 'c'].forEach((k) => cacheGet(lru, k))
    expect(cacheGet(lru, 'a').hit).toBe(true)
    const fifo = makeCache(2, 'fifo'); ['a', 'b', 'a', 'c'].forEach((k) => cacheGet(fifo, k))
    expect(cacheGet(fifo, 'a').hit).toBe(false)
  })
  it('LFU evicts the least frequently used; TTL expires entries', () => {
    const c = makeCache(2, 'lfu'); ['a', 'a', 'a', 'b', 'c'].forEach((k) => cacheGet(c, k))
    expect(c.map.has('a')).toBe(true); expect(c.map.has('b')).toBe(false)
    const t = makeCache(5, 'lru', 2); cacheGet(t, 'x'); cacheGet(t, 'y'); cacheGet(t, 'z')
    expect(cacheGet(t, 'x').hit).toBe(false)
  })
  it('a bigger cache raises the hit ratio on skewed traffic', () => {
    const ratio = (cap) => { const r = rng(3); const c = makeCache(cap, 'lru'); for (let i = 0; i < 3000; i++) cacheGet(c, zipfKey(100, 1.1, r)); return hitRatio(c) }
    expect(ratio(40)).toBeGreaterThan(ratio(5))
  })
})

describe('replication', () => {
  it('async replicas are briefly stale; sync replicas are not', () => {
    const a = makeRepl(2, 3, 'async'); replWrite(a, 'k', 1)
    expect(replRead(a, 'R1', 'k').stale).toBe(true)
    for (let i = 0; i < 3; i++) replTick(a)
    expect(replRead(a, 'R1', 'k').stale).toBe(false)
    const s = makeRepl(2, 3, 'sync'); replWrite(s, 'k', 1)
    expect(replRead(s, 'R2', 'k').stale).toBe(false)
  })
  it('failover with async replication can lose acknowledged writes', () => {
    const a = makeRepl(2, 5, 'async'); replWrite(a, 'a', 1); replWrite(a, 'b', 2)
    expect(replFailover(a).lost).toBe(2)
    const s = makeRepl(2, 5, 'sync'); replWrite(s, 'a', 1)
    expect(replFailover(s).lost).toBe(0)
  })
})

describe('sharding', () => {
  const keys = Array.from({ length: 5000 }, (_, i) => `user${i}`)
  it('mod hashing moves most keys on resize; consistent hashing moves far fewer', () => {
    expect(movedFraction(keys, 4, 5, 'mod')).toBeGreaterThan(0.6)
    expect(movedFraction(keys, 4, 5, 'ring')).toBeLessThan(0.35)
  })
  it('spreads keys across all shards', () => {
    const d = distribution(keys, 4, 'ring')
    expect(Object.values(d).reduce((a, b) => a + b, 0)).toBe(5000)
    expect(Math.min(...Object.values(d))).toBeGreaterThan(450)
  })
})

describe('queue', () => {
  it('a consumer crash mid-job causes redelivery, and every message is eventually processed', () => {
    const q = makeQueue(2); q.vis = 3; qProduce(q, 2)
    qTick(q, 4)
    q.consumers[0].up = false
    for (let i = 0; i < 4; i++) qTick(q, 4)
    q.consumers[0].up = true
    for (let i = 0; i < 20; i++) qTick(q, 2)
    expect(q.redelivered).toBeGreaterThan(0)
    expect(q.done.length).toBe(2)
  })
  it('queue depth grows when producers outpace consumers', () => {
    const q = makeQueue(1)
    for (let i = 0; i < 20; i++) { qProduce(q, 2); qTick(q, 2) }
    expect(q.ready.length).toBeGreaterThan(10)
  })
})

describe('rate limiter', () => {
  const burst = (l, n, t) => Array.from({ length: n }, () => allow(l, t)).filter(Boolean).length
  it('token bucket allows a burst then the steady rate', () => {
    const l = makeLimiter('token', { rate: 2, burst: 5 })
    expect(burst(l, 10, 0)).toBe(5)
    expect(burst(l, 10, 1)).toBe(2)
  })
  it('fixed window allows a double burst at the window edge; sliding log does not', () => {
    const f = makeLimiter('fixed', { limit: 5, window: 10 })
    expect(burst(f, 10, 9.9) + burst(f, 10, 10.1)).toBe(10)
    const s = makeLimiter('sliding', { limit: 5, window: 10 })
    expect(burst(s, 10, 9.9) + burst(s, 10, 10.1)).toBe(5)
  })
})

describe('estimation and playground', () => {
  it('splits reads and writes by ratio', () => {
    const e = estimate({ dau: 3.3e6, actionsPerUser: 1, readRatio: 100, bytesPerItem: 500, retentionYears: 1, replication: 1, peakFactor: 2 })
    expect(e.readQps / e.writeQps).toBeCloseTo(100, 0)
    expect(e.peakQps).toBeCloseTo(e.qps * 2, 5)
  })
  it('adding components removes the bottleneck and raises availability', () => {
    const base = playground(3000, PG_DEFAULT)
    expect(base.ok).toBe(false)
    const full = playground(3000, { cdn: true, lb: true, servers: 6, cache: true, replicas: 2, queue: true })
    expect(full.ok).toBe(true)
    expect(full.availability).toBeGreaterThan(base.availability)
    expect(full.spofs.length).toBeLessThan(base.spofs.length)
  })
})
