import { useEffect, useMemo, useRef, useState } from 'react'
import { Play, Pause, Zap, Skull, HeartPulse, RotateCcw } from 'lucide-react'
import { sdGo } from './useSd.js'
import {
  rng, makeLb, lbTick, makeCache, cacheGet, hitRatio, zipfKey, cacheLatency, makeRepl, replWrite, replTick, replRead, replFailover,
  distribution, rangeDistribution, movedFraction, makeQueue, qProduce, qTick, makeLimiter, allow, estimate, playground, PG_DEFAULT,
} from '../../domain/sd/sim.js'

export const LABS = [
  { id: 'lb', title: 'Load balancer', lesson: 'load-balancing', blurb: 'Send traffic, kill servers, compare algorithms.' },
  { id: 'cache', title: 'Cache', lesson: 'caching', blurb: 'Hits, misses, eviction policies and TTL.' },
  { id: 'replication', title: 'Replication', lesson: 'replication-sharding', blurb: 'Replica lag, stale reads and failover.' },
  { id: 'sharding', title: 'Sharding', lesson: 'replication-sharding', blurb: 'Where data lands, and what moves when you add a shard.' },
  { id: 'queue', title: 'Message queue', lesson: 'queues', blurb: 'Producers, consumers, crashes and redelivery.' },
  { id: 'ratelimit', title: 'Rate limiter', lesson: 'rate-limiting', blurb: 'Token bucket, leaky bucket and window counters.' },
  { id: 'estimate', title: 'Estimator', lesson: 'estimation', blurb: 'Turn users into QPS, storage and bandwidth.' },
  { id: 'playground', title: 'Architecture playground', lesson: 'scaling', blurb: 'Add components and watch the bottleneck move.' },
]

function useTicker(fn, ms, on) {
  const ref = useRef(fn); ref.current = fn
  useEffect(() => { if (!on) return undefined; const t = setInterval(() => ref.current(), ms); return () => clearInterval(t) }, [ms, on])
}
function useUse(S, id, n = 4) {
  const c = useRef(0)
  return () => { c.current += 1; if (c.current === n) S.labUsed(id) }
}
const Stat = ({ k, v, tone }) => <div className={`stat ${tone || ''}`}><dd>{v}</dd><dt>{k}</dt></div>
const Frame = ({ lab, children, tries }) => (
  <section className="lab" aria-labelledby="lab-h">
    <header><p className="kicker">Lab · {lab.blurb}</p><h2 id="lab-h">{lab.title}</h2></header>
    {children}
    {tries && <aside className="tries"><b>Try this</b><ol>{tries.map((t, i) => <li key={i}>{t}</li>)}</ol></aside>}
    <button className="link" onClick={() => sdGo(`lesson/${lab.lesson}`)}>Read the lesson behind this lab →</button>
  </section>
)

function LbLab({ S, lab }) {
  const [, force] = useState(0)
  const sim = useRef(makeLb(4, 6)); const r = useRef(rng(7))
  const [algo, setAlgo] = useState('rr'); const [auto, setAuto] = useState(false); const [rate, setRate] = useState(4); const [slow, setSlow] = useState(false); const [last, setLast] = useState(null)
  const used = useUse(S, 'lb')
  const send = (n) => { const arr = Array.from({ length: n }, (_, i) => ({ dur: slow && Math.random() < 0.3 ? 10 : 2, key: `user${Math.floor(Math.random() * 6)}` })); const log = lbTick(sim.current, algo, arr, r.current); setLast(log.slice(-1)[0]); used(); force((x) => x + 1) }
  useTicker(() => send(rate), 500, auto)
  const lb = sim.current
  const tot = lb.servers.reduce((a, s) => ({ ok: a.ok + s.served, drop: a.drop + s.dropped, err: a.err + s.errors }), { ok: 0, drop: 0, err: 0 })
  return (
    <Frame lab={lab} tries={['Kill server 2 with health checks ON, then OFF. Compare errors.', 'Turn on "some requests are slow", then compare round robin with least connections: which drops fewer?', 'Choose "hash by user": which servers does each user stick to?']}>
      <div className="controls">
        <label>Algorithm<select value={algo} onChange={(e) => setAlgo(e.target.value)}><option value="rr">Round robin</option><option value="least">Least connections</option><option value="random">Random</option><option value="hash">Hash by user (sticky)</option></select></label>
        <label className="chk"><input type="checkbox" checked={lb.healthChecks} onChange={(e) => { lb.healthChecks = e.target.checked; force((x) => x + 1) }} /> Health checks</label>
        <label className="chk"><input type="checkbox" checked={slow} onChange={(e) => setSlow(e.target.checked)} /> Some requests are slow</label>
        <label>Auto traffic: {rate} req/tick<input type="range" min="1" max="14" value={rate} onChange={(e) => setRate(+e.target.value)} /></label>
        <div className="row"><button className="btn primary sm" onClick={() => send(1)}><Zap size={14} /> Send 1</button><button className="btn ghost sm" onClick={() => send(20)}>Burst of 20</button><button className="btn ghost sm" onClick={() => setAuto(!auto)} aria-pressed={auto}>{auto ? <Pause size={14} /> : <Play size={14} />} {auto ? 'Stop' : 'Auto traffic'}</button><button className="btn ghost sm" onClick={() => { sim.current = makeLb(4, 6); setLast(null); force((x) => x + 1) }}><RotateCcw size={14} /> Reset</button></div>
      </div>
      <div className="servers">
        {lb.servers.map((s) => (
          <div key={s.id} className={`srv ${s.up ? '' : 'down'}`}>
            <b>Server {s.id + 1}</b>
            <div className="slots" aria-label={`${s.active.length} of ${s.cap} connections busy`}>{Array.from({ length: s.cap }, (_, i) => <i key={i} className={i < s.active.length ? 'on' : ''} />)}</div>
            <small>served {s.served} · full-drops {s.dropped} · errors {s.errors}</small>
            <button className="btn ghost sm" onClick={() => { s.up = !s.up; force((x) => x + 1) }}>{s.up ? <><Skull size={13} /> Kill</> : <><HeartPulse size={13} /> Revive</>}</button>
          </div>))}
      </div>
      <dl className="stats"><Stat k="requests" v={lb.total} /><Stat k="served" v={tot.ok} tone="ok" /><Stat k="dropped (server full)" v={tot.drop} tone={tot.drop ? 'no' : ''} /><Stat k="errors (dead server)" v={tot.err} tone={tot.err ? 'no' : ''} /></dl>
      <p className="muted" role="status">{last ? (last.ok ? `Last request went to server ${last.id + 1}.` : last.id < 0 ? 'No healthy server: everything failed.' : last.why === 'down' ? `Sent to dead server ${last.id + 1}: an error. Turn health checks on.` : `Server ${last.id + 1} was full: dropped.`) : 'Send some traffic.'}</p>
    </Frame>
  )
}

function CacheLab({ S, lab }) {
  const [, force] = useState(0)
  const [cap, setCap] = useState(5); const [policy, setPolicy] = useState('lru'); const [ttl, setTtl] = useState(0)
  const c = useRef(makeCache(5, 'lru', 0)); const r = useRef(rng(11)); const [last, setLast] = useState(null)
  const used = useUse(S, 'cache')
  const cfg = (nc, np, nt) => { c.current = makeCache(nc, np, nt); setLast(null); force((x) => x + 1) }
  const get = (k) => { setLast({ k, ...cacheGet(c.current, k) }); used(); force((x) => x + 1) }
  const flood = (n, skew) => { for (let i = 0; i < n; i++) cacheGet(c.current, skew ? zipfKey(60, 1.05, r.current) : `k${1 + Math.floor(r.current() * 60)}`); used(); setLast(null); force((x) => x + 1) }
  const lat = cacheLatency(c.current)
  const total = c.current.hits + c.current.misses
  return (
    <Frame lab={lab} tries={['Capacity 3 and keys k1..k4 in a loop: what happens to the hit ratio under LRU vs FIFO?', 'Fire 300 "popular keys" requests, then 300 "uniform" ones. Why does popularity make caching work?', 'Set a short TTL and watch hits turn into misses.']}>
      <div className="controls">
        <label>Capacity: {cap}<input type="range" min="2" max="30" value={cap} onChange={(e) => { setCap(+e.target.value); cfg(+e.target.value, policy, ttl) }} /></label>
        <label>Eviction<select value={policy} onChange={(e) => { setPolicy(e.target.value); cfg(cap, e.target.value, ttl) }}><option value="lru">LRU (least recently used)</option><option value="lfu">LFU (least frequently used)</option><option value="fifo">FIFO (oldest first)</option></select></label>
        <label>TTL (requests): {ttl || 'none'}<input type="range" min="0" max="60" value={ttl} onChange={(e) => { setTtl(+e.target.value); cfg(cap, policy, +e.target.value) }} /></label>
      </div>
      <div className="keys" role="group" aria-label="Request a key">{Array.from({ length: 8 }, (_, i) => <button key={i} className="btn ghost sm" onClick={() => get(`k${i + 1}`)}>GET k{i + 1}</button>)}<button className="btn primary sm" onClick={() => flood(300, true)}>300 popular-skewed</button><button className="btn ghost sm" onClick={() => flood(300, false)}>300 uniform</button><button className="btn ghost sm" onClick={() => cfg(cap, policy, ttl)}><RotateCcw size={14} /> Empty</button></div>
      <div className="cachebox" aria-label="Cache contents">{[...c.current.map.keys()].map((k) => <span key={k} className={`slot ${last?.k === k ? 'hot' : ''}`}>{k}{policy === 'lfu' && <sup>{c.current.freq.get(k)}</sup>}</span>)}{Array.from({ length: Math.max(0, cap - c.current.map.size) }, (_, i) => <span key={i} className="slot empty" />)}</div>
      <p role="status" className="muted">{last ? `${last.k}: ${last.hit ? 'HIT, served from memory (~1 ms).' : `MISS, loaded from the database (~50 ms)${last.evicted ? `; evicted ${last.evicted}` : ''}.`}` : 'Request a key.'}</p>
      <dl className="stats"><Stat k="hits" v={c.current.hits} tone="ok" /><Stat k="misses" v={c.current.misses} /><Stat k="hit ratio" v={`${Math.round(hitRatio(c.current) * 100)}%`} /><Stat k="avg latency with cache" v={`${total ? lat.withCache : '–'} ms`} /><Stat k="without cache" v="50 ms" /><Stat k="DB load vs no cache" v={total ? `${Math.round((1 - hitRatio(c.current)) * 100)}%` : '–'} /></dl>
    </Frame>
  )
}

function ReplLab({ S, lab }) {
  const [, force] = useState(0)
  const [mode, setMode] = useState('async'); const [lag, setLag] = useState(3); const [auto, setAuto] = useState(true)
  const s = useRef(makeRepl(2, 3, 'async')); const n = useRef(0); const [msg, setMsg] = useState('Write a value, then read it from a replica straight away.')
  const used = useUse(S, 'replication', 3)
  const reset = (m, l) => { s.current = makeRepl(2, l, m); n.current = 0; setMsg('Reset.'); force((x) => x + 1) }
  useTicker(() => { replTick(s.current); force((x) => x + 1) }, 800, auto)
  const write = () => { n.current += 1; const ok = replWrite(s.current, 'balance', n.current * 100); setMsg(ok ? `Wrote balance = ${n.current * 100} to the primary${mode === 'sync' ? ' and waited for all replicas.' : '; replicas will catch up in ~' + lag + ' ticks.'}` : 'No primary: promote one first.'); used(); force((x) => x + 1) }
  const read = (node) => { const res = replRead(s.current, node, 'balance'); setMsg(!res.ok ? `${node} is down.` : `${node} says balance = ${res.value ?? 'nothing yet'}${res.stale ? '. STALE: the primary has a newer value.' : '. Fresh.'}`); used(); force((x) => x + 1) }
  const kill = () => { const f = replFailover(s.current); setMsg(f.promoted ? `Primary died. ${f.promoted} promoted. ${f.lost ? `${f.lost} acknowledged write(s) were LOST because the replica had not received them.` : 'No acknowledged writes lost.'}` : 'No replica to promote!'); used(); force((x) => x + 1) }
  const nodes = [s.current.primary, ...s.current.replicas]
  return (
    <Frame lab={lab} tries={['Async: write, then read R1 immediately. Wait a few ticks and read again.', 'Write 2-3 times quickly and kill the primary. How many writes were lost? Repeat in sync mode.', 'Raise replica lag and see how long stale reads last.']}>
      <div className="controls">
        <label>Mode<select value={mode} onChange={(e) => { setMode(e.target.value); reset(e.target.value, lag) }}><option value="async">Asynchronous (fast writes)</option><option value="sync">Synchronous (waits for replicas)</option></select></label>
        <label>Replica lag: {lag} ticks<input type="range" min="1" max="10" value={lag} onChange={(e) => { setLag(+e.target.value); reset(mode, +e.target.value) }} /></label>
        <label className="chk"><input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} /> Time passes</label>
      </div>
      <div className="row"><button className="btn primary sm" onClick={write}>Write a new balance</button>{nodes.map((x) => <button key={x.id} className="btn ghost sm" onClick={() => read(x.id)}>Read from {x.id}</button>)}<button className="btn ghost sm" onClick={() => { replTick(s.current); force((x) => x + 1) }}>Advance 1 tick</button><button className="btn ghost sm danger" onClick={kill}><Skull size={13} /> Kill primary</button><button className="btn ghost sm" onClick={() => reset(mode, lag)}><RotateCcw size={14} /> Reset</button></div>
      <div className="servers">{nodes.map((x, i) => <div key={x.id} className={`srv ${i === 0 ? 'primary' : ''}`}><b>{x.id}{i === 0 ? ' · primary' : ' · replica'}</b><span className="sd-big">{x.data.balance ?? '–'}</span><small>applied version {x.seq}</small></div>)}</div>
      <dl className="stats"><Stat k="writes acknowledged" v={s.current.acked} /><Stat k="replication in flight" v={s.current.pending.length} /><Stat k="writes lost to failover" v={s.current.lost} tone={s.current.lost ? 'no' : ''} /></dl>
      <p className="muted" role="status">{msg}</p>
    </Frame>
  )
}

function ShardLab({ S, lab }) {
  const [n, setN] = useState(4); const [strat, setStrat] = useState('ring'); const [skew, setSkew] = useState(false)
  const used = useUse(S, 'sharding', 3)
  const keys = useMemo(() => Array.from({ length: 2000 }, (_, i) => (skew ? `${['a', 'a', 'a', 'm', 's', 's', 'b', 'c'][i % 8]}user${i}` : `user${i}`)), [skew])
  const dist = strat === 'range' ? rangeDistribution(keys, n) : distribution(keys, n, strat)
  const max = Math.max(...Object.values(dist), 1)
  const moveMod = movedFraction(keys, n, n + 1, 'mod'), moveRing = movedFraction(keys, n, n + 1, 'ring')
  return (
    <Frame lab={lab} tries={['Switch to "range" and tick skewed keys: which shard becomes hot?', 'Look at the table: how much data moves when you add a shard with mod vs consistent hashing?', 'Add shards until the spread evens out; does hashing stay even?']}>
      <div className="controls">
        <label>Shards: {n}<input type="range" min="2" max="10" value={n} onChange={(e) => { setN(+e.target.value); used() }} /></label>
        <label>Strategy<select value={strat} onChange={(e) => { setStrat(e.target.value); used() }}><option value="ring">Consistent hashing</option><option value="mod">hash(key) mod N</option><option value="range">Range (by first letter)</option></select></label>
        <label className="chk"><input type="checkbox" checked={skew} onChange={(e) => { setSkew(e.target.checked); used() }} /> Skewed keys (many start with "a" and "s")</label>
      </div>
      <div className="bars" role="img" aria-label="Keys per shard">{Object.entries(dist).map(([k, v]) => <div key={k} className="sd-bar"><i style={{ height: `${(v / max) * 100}%` }} className={v > (2000 / n) * 1.5 ? 'hot' : ''} /><b>{k}</b><small>{v}</small></div>)}</div>
      <table className="mtable"><caption>If you add one more shard ({n} → {n + 1}) with 2,000 keys</caption><thead><tr><th>Strategy</th><th>Keys that must move</th></tr></thead><tbody><tr><td>hash(key) mod N</td><td><b>{Math.round(moveMod * 100)}%</b> of keys</td></tr><tr><td>Consistent hashing</td><td><b>{Math.round(moveRing * 100)}%</b> of keys (about 1/{n + 1})</td></tr></tbody></table>
    </Frame>
  )
}

function QueueLab({ S, lab }) {
  const [, force] = useState(0)
  const q = useRef(makeQueue(2)); const [rate, setRate] = useState(1); const [auto, setAuto] = useState(false); const [work, setWork] = useState(3)
  const used = useUse(S, 'queue', 4)
  const step = () => { if (auto) qProduce(q.current, rate > 0 ? (Math.random() < rate / 2 ? 1 : 0) + Math.floor(rate / 2) : 0); qTick(q.current, work); force((x) => x + 1) }
  useTicker(step, 600, auto)
  const Q = q.current
  return (
    <Frame lab={lab} tries={['Raise the producer rate above what 2 consumers can do: watch the queue depth grow.', 'Kill a consumer mid-job. The message returns after the visibility timeout. Count redelivered.', 'Turn the dead consumer back on. Are any messages processed twice?']}>
      <div className="controls">
        <label>Producer rate: {rate}<input type="range" min="0" max="6" value={rate} onChange={(e) => setRate(+e.target.value)} /></label>
        <label>Work per message: {work} ticks<input type="range" min="1" max="8" value={work} onChange={(e) => setWork(+e.target.value)} /></label>
        <label>Ack timeout: {Q.vis} ticks<input type="range" min="2" max="12" value={Q.vis} onChange={(e) => { Q.vis = +e.target.value; force((x) => x + 1) }} /></label>
        <div className="row"><button className="btn primary sm" onClick={() => { qProduce(Q, 1); used(); force((x) => x + 1) }}>Produce 1</button><button className="btn ghost sm" onClick={() => { qProduce(Q, 10); used(); force((x) => x + 1) }}>Burst of 10</button><button className="btn ghost sm" onClick={() => { qTick(Q, work); used(); force((x) => x + 1) }}>Advance 1 tick</button><button className="btn ghost sm" onClick={() => setAuto(!auto)} aria-pressed={auto}>{auto ? <Pause size={14} /> : <Play size={14} />} {auto ? 'Stop' : 'Run'}</button><button className="btn ghost sm" onClick={() => { q.current = makeQueue(2); force((x) => x + 1) }}><RotateCcw size={14} /> Reset</button></div>
      </div>
      <div className="queuev">
        <div className="qbox"><b>Queue</b><div className="msgs">{Q.ready.slice(0, 24).map((m) => <i key={m.id}>{m.id}</i>)}{Q.ready.length > 24 && <em>+{Q.ready.length - 24}</em>}</div></div>
        <div className="servers">{Q.consumers.map((c) => <div key={c.id} className={`srv ${c.up ? '' : 'down'}`}><b>{c.id}</b><span className="sd-big">{c.job ? `msg ${c.job.msg.id}` : 'idle'}</span><small>{c.job ? `${Math.max(0, c.job.left)} ticks left${c.up ? '' : ' (crashed, no ack)'}` : ''}</small><button className="btn ghost sm" onClick={() => { c.up = !c.up; used(); force((x) => x + 1) }}>{c.up ? <><Skull size={13} /> Crash</> : <><HeartPulse size={13} /> Restart</>}</button></div>)}</div>
      </div>
      <dl className="stats"><Stat k="waiting (depth)" v={Q.ready.length} tone={Q.ready.length > 15 ? 'no' : ''} /><Stat k="in flight" v={Q.inflight.length} /><Stat k="done" v={Q.done.length} tone="ok" /><Stat k="redelivered" v={Q.redelivered} /><Stat k="processed twice" v={Q.duplicates} tone={Q.duplicates ? 'no' : ''} /><Stat k="dead-lettered" v={Q.dead.length} /></dl>
    </Frame>
  )
}

function RateLab({ S, lab }) {
  const [, force] = useState(0)
  const [kind, setKind] = useState('token'); const [p, setP] = useState({ rate: 2, burst: 5, limit: 5, window: 5 })
  const L = useRef(makeLimiter('token', p)); const t = useRef(0); const [log, setLog] = useState([]); const [auto, setAuto] = useState(false)
  const used = useUse(S, 'ratelimit', 5)
  const reset = (k, pp) => { L.current = makeLimiter(k, pp); t.current = 0; setLog([]); force((x) => x + 1) }
  const send = (n = 1) => { const out = []; for (let i = 0; i < n; i++) out.push({ t: t.current, ok: allow(L.current, t.current) }); setLog((l) => [...l, ...out].slice(-60)); used(); force((x) => x + 1) }
  const wait = (s) => { t.current += s; force((x) => x + 1) }
  useTicker(() => { t.current += 0.5; send(1) }, 500, auto)
  const okN = log.filter((x) => x.ok).length
  return (
    <Frame lab={lab} tries={['Token bucket: send a burst of 10 immediately, then wait 2s and send again.', 'Fixed window: send 5, wait until just after the window edge, send 5 more. Count how many pass in a short time.', 'Switch to sliding window and repeat the edge trick.']}>
      <div className="controls">
        <label>Algorithm<select value={kind} onChange={(e) => { setKind(e.target.value); reset(e.target.value, p) }}><option value="token">Token bucket</option><option value="leaky">Leaky bucket</option><option value="fixed">Fixed window</option><option value="sliding">Sliding window log</option></select></label>
        {(kind === 'token' || kind === 'leaky') ? <><label>Refill/leak rate: {p.rate}/s<input type="range" min="1" max="10" value={p.rate} onChange={(e) => { const np = { ...p, rate: +e.target.value }; setP(np); reset(kind, np) }} /></label><label>Bucket size: {p.burst}<input type="range" min="1" max="20" value={p.burst} onChange={(e) => { const np = { ...p, burst: +e.target.value }; setP(np); reset(kind, np) }} /></label></> : <><label>Limit: {p.limit} per window<input type="range" min="1" max="15" value={p.limit} onChange={(e) => { const np = { ...p, limit: +e.target.value }; setP(np); reset(kind, np) }} /></label><label>Window: {p.window}s<input type="range" min="2" max="20" value={p.window} onChange={(e) => { const np = { ...p, window: +e.target.value }; setP(np); reset(kind, np) }} /></label></>}
      </div>
      <div className="row"><button className="btn primary sm" onClick={() => send(1)}>Send request</button><button className="btn ghost sm" onClick={() => send(10)}>Burst of 10</button><button className="btn ghost sm" onClick={() => wait(1)}>Wait 1s</button><button className="btn ghost sm" onClick={() => wait(5)}>Wait 5s</button><button className="btn ghost sm" onClick={() => setAuto(!auto)} aria-pressed={auto}>{auto ? <Pause size={14} /> : <Play size={14} />} {auto ? 'Stop' : '2 req/s steady'}</button><button className="btn ghost sm" onClick={() => reset(kind, p)}><RotateCcw size={14} /> Reset</button></div>
      <p className="sd-clock">Clock: <b>{t.current.toFixed(1)}s</b>{kind === 'token' && <> · tokens in bucket: <b>{Math.min(p.burst, L.current.tokens + (t.current - L.current.last) * p.rate).toFixed(1)}</b></>}</p>
      <div className="sd-strip" role="img" aria-label="Recent requests, green allowed, red blocked">{log.map((x, i) => <i key={i} className={x.ok ? 'ok' : 'no'} title={`${x.t.toFixed(1)}s ${x.ok ? 'allowed' : 'blocked (429)'}`} />)}</div>
      <dl className="stats"><Stat k="allowed" v={okN} tone="ok" /><Stat k="blocked (HTTP 429)" v={log.length - okN} tone={log.length - okN ? 'no' : ''} /></dl>
    </Frame>
  )
}

const PRESETS = {
  shortener: { name: 'URL shortener', dau: 3300000, actionsPerUser: 30, readRatio: 100, bytesPerItem: 500, retentionYears: 5, replication: 3, peakFactor: 3 },
  chat: { name: 'Chat app', dau: 50000000, actionsPerUser: 40, readRatio: 1, bytesPerItem: 200, retentionYears: 3, replication: 3, peakFactor: 3 },
  photos: { name: 'Photo sharing', dau: 50000000, actionsPerUser: 50, readRatio: 250, bytesPerItem: 400000, retentionYears: 5, replication: 1.5, peakFactor: 2 },
}
const fmt = (n) => (n >= 1e9 ? `${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : n.toFixed(n < 10 ? 1 : 0))
function EstLab({ S, lab }) {
  const [v, setV] = useState(PRESETS.shortener)
  const used = useUse(S, 'estimate', 3)
  const set = (k, x) => { const n = Number(x); if (Number.isFinite(n) && n >= 0) { setV({ ...v, [k]: n }); used() } }
  const e = estimate(v)
  const verdict = [e.writeQps < 1000 ? `${fmt(e.writeQps)} writes/s: a single relational primary is plenty for writes.` : `${fmt(e.writeQps)} writes/s: one node will struggle; consider sharding or a queue.`, e.peakReadQps > 5000 ? `${fmt(e.peakReadQps)} reads/s at peak: cache and read replicas (and a CDN for static data) are justified.` : `${fmt(e.peakReadQps)} reads/s at peak: modest, a cache is optional.`, e.totalTB > 100 ? `${fmt(e.totalTB)} TB stored: object storage and tiering, not one database.` : e.totalTB > 5 ? `${fmt(e.totalTB)} TB: plan for partitioning eventually.` : `${e.totalTB.toFixed(2)} TB: fits comfortably on one machine with backups.`]
  const f = (k, label, step = 1) => <label key={k}>{label}<input type="number" min="0" step={step} value={v[k]} onChange={(ev) => set(k, ev.target.value)} /></label>
  return (
    <Frame lab={lab} tries={['Load each preset and read the three verdicts. What does each tell you to build or not build?', 'Double the daily users: which number grows, and does your verdict change?', 'Set the read:write ratio to 1 and see what happens to the cache argument.']}>
      <div className="row">{Object.entries(PRESETS).map(([k, x]) => <button key={k} className="btn ghost sm" onClick={() => setV(x)}>{x.name}</button>)}</div>
      <div className="controls grid">{f('dau', 'Daily active users')}{f('actionsPerUser', 'Actions per user per day')}{f('readRatio', 'Reads per write')}{f('bytesPerItem', 'Bytes per item')}{f('retentionYears', 'Retention (years)')}{f('replication', 'Replication factor', 0.5)}{f('peakFactor', 'Peak vs average', 0.5)}</div>
      <dl className="stats"><Stat k="average QPS" v={fmt(e.qps)} /><Stat k="peak QPS" v={fmt(e.peakQps)} /><Stat k="write QPS" v={fmt(e.writeQps)} /><Stat k="peak read QPS" v={fmt(e.peakReadQps)} /><Stat k="new data per year" v={`${fmt(e.storageYearGB)} GB`} /><Stat k="total stored" v={`${fmt(e.totalTB)} TB`} /><Stat k="peak egress" v={`${fmt(e.egressMBps)} MB/s`} /></dl>
      <ul className="verdicts">{verdict.map((x, i) => <li key={i}>{x}</li>)}</ul>
      <p className="muted">Rule used: a day is about 10⁵ seconds (86,400). Estimates are for reasoning about orders of magnitude, not exact capacity.</p>
    </Frame>
  )
}

function PlayLab({ S, lab }) {
  const [load, setLoad] = useState(1500); const [c, setC] = useState(PG_DEFAULT)
  const used = useUse(S, 'playground', 4)
  const set = (patch) => { setC({ ...c, ...patch }); used() }
  const p = playground(load, c)
  const Tog = ({ k, label }) => <label className="chk"><input type="checkbox" checked={c[k]} onChange={(e) => set({ [k]: e.target.checked })} /> {label}</label>
  return (
    <Frame lab={lab} tries={['At 3,000 req/s with nothing added, find the bottleneck. Fix only that tier.', 'Add a cache. Which tier is relieved? Which tier is not?', 'Remove the load balancer but keep 6 servers: why does capacity not rise?']}>
      <div className="controls">
        <label>Incoming load: {load} requests/s<input type="range" min="100" max="12000" step="100" value={load} onChange={(e) => { setLoad(+e.target.value); used() }} /></label>
        <Tog k="cdn" label="CDN for static content" /><Tog k="lb" label="Load balancer" /><Tog k="cache" label="Cache in front of the database" /><Tog k="queue" label="Queue for writes" />
        <label>App servers: {c.servers}<input type="range" min="1" max="12" value={c.servers} onChange={(e) => set({ servers: +e.target.value })} /></label>
        <label>Database replicas: {c.replicas}<input type="range" min="0" max="4" value={c.replicas} onChange={(e) => set({ replicas: +e.target.value })} /></label>
      </div>
      <ol className="tiers">{p.tiers.filter((t) => t.on).map((t) => { const u = t.cap === Infinity ? 0 : t.util; return (
        <li key={t.id} className={u > 1 ? 'over' : u > 0.8 ? 'hot' : ''}><span>{t.name}</span><div className="meter" role="img" aria-label={`${Math.round(u * 100)}% utilised`}><i style={{ width: `${Math.min(100, u * 100)}%` }} /></div><small>{t.cap === Infinity ? 'absorbs static traffic' : `${Math.round(t.load)} / ${Math.round(t.cap)} per s${t.buffered ? ' (buffered by queue)' : ''}`}</small></li>) })}</ol>
      <dl className="stats"><Stat k="requests served" v={`${p.served}%`} tone={p.ok ? 'ok' : 'no'} /><Stat k="bottleneck" v={p.bottleneck?.name || '–'} /><Stat k="est. latency" v={`${p.latency} ms`} /><Stat k="est. availability" v={`${(p.availability * 100).toFixed(3)}%`} />{p.queued > 0 && <Stat k="writes waiting in queue /s" v={p.queued} />}</dl>
      {p.spofs.length > 0 && <ul className="verdicts bad">{p.spofs.map((x) => <li key={x}>{x}</li>)}</ul>}
      <p className="muted">A simplified model on purpose: 60% of requests are static, 90% of dynamic requests are reads, each server handles 400 req/s, the database 800 reads/s (+800 per replica) and 300 writes/s. Real capacity needs load testing.</p>
    </Frame>
  )
}

const BY = { lb: LbLab, cache: CacheLab, replication: ReplLab, sharding: ShardLab, queue: QueueLab, ratelimit: RateLab, estimate: EstLab, playground: PlayLab }

export default function Labs({ S, id }) {
  const lab = LABS.find((l) => l.id === id)
  if (!id) return (
    <div className="labs">
      <header className="p-head"><p className="kicker">Interactive lab</p><h1>Break it on purpose.</h1><p className="lede">These are working simulations, not animations. Every number comes from the same logic the tests check. Change a setting, predict what will happen, then watch.</p></header>
      <ol className="lab-list">{LABS.map((l, i) => <li key={l.id}><button onClick={() => sdGo(`lab/${l.id}`)}><span className="n">{String(i + 1).padStart(2, '0')}</span><span><b>{l.title}</b><small>{l.blurb}</small></span><em>{S.sd.labs[l.id] ? `used ${S.sd.labs[l.id]}` : 'not tried'}</em></button></li>)}</ol>
    </div>
  )
  if (!lab) return <p className="empty">No such lab. <button className="link" onClick={() => sdGo('lab')}>See all labs</button></p>
  const Comp = BY[id]
  return <div className="labs"><button className="link back" onClick={() => sdGo('lab')}>← All labs</button><Comp S={S} lab={lab} /></div>
}
