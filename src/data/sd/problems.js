import { pt, ref } from './helpers.js'

// Guided design problems. Each step asks for a decision first; the learner picks (or tries) before the reveal.
const o = (t, fb, good = false) => ({ t, fb, good })

export const RUBRIC_DIMS = [
  { id: 'requirements', label: 'Requirement gathering' },
  { id: 'architecture', label: 'Architecture choices' },
  { id: 'scalability', label: 'Scalability' },
  { id: 'database', label: 'Database design' },
  { id: 'performance', label: 'Performance' },
  { id: 'reliability', label: 'Reliability' },
  { id: 'tradeoffs', label: 'Trade-off reasoning' },
  { id: 'communication', label: 'Communication and clarity' },
]
export const DIM_LESSONS = {
  requirements: ['framework'], architecture: ['backend-servers', 'load-balancing'], scalability: ['scaling', 'replication-sharding', 'estimation'],
  database: ['databases', 'indexing'], performance: ['caching', 'cdn', 'why-slow'], reliability: ['distributed-intro', 'idempotency-retries', 'queues'],
  tradeoffs: ['cap-consistency', 'framework'], communication: ['framework'],
}

export const PROBLEMS = [
{
  id: 'url-shortener', title: 'Design a URL shortener', level: 'Beginner', stage: 6, prereq: ['http-rest', 'databases', 'caching', 'estimation'],
  prompt: 'Design a service like bit.ly: users submit a long URL and get a short link; visiting the short link redirects to the original. Target: 100 million new links per month, reads far exceeding writes.',
  steps: [
    { title: 'Requirements', q: 'Which set of requirements would you confirm first?', opts: [
      o('Create short link, redirect, optional custom alias and expiry; non-functional: very low redirect latency, high availability, links never collide', 'Right: functional core plus the qualities that actually shape the design (redirect speed, availability, uniqueness).', true),
      o('Build analytics dashboards, QR codes, a mobile app and team accounts', 'These are extras. Starting with them dilutes the core; mention them as out of scope.'),
      o('Only that it should be "fast"', 'Too vague: you need measurable targets and the read/write ratio.')], ideal: 'Core: shorten, redirect. Optional: custom alias, expiry, basic click count. Non-functional: redirect p99 < 100 ms, 99.99% availability for redirects, unpredictable codes optional. Ask about scale: 100M new/month ≈ 40 writes/s and ~100:1 reads ≈ 4,000 reads/s.' },
    { title: 'Estimation', q: '100M new links/month and 100:1 reads. Which conclusion do the numbers support?', opts: [
      o('~40 writes/s, ~4k reads/s, ~600 GB/year: a single DB is adequate, cache the hot links', 'Correct: small scale, so simplicity wins; reads justify a cache.', true),
      o('~4M writes/s, we must shard on day one', 'Miscalculated: 100M/month is about 40/s, not millions.'),
      o('Scale is impossible to estimate', 'It is easy with the 10^5 seconds-per-day rule.')], ideal: '100M/2.5M s ≈ 40 writes/s; reads ≈ 4,000/s (peak ~10k). 100M × ~500 B ≈ 50 GB/month, ~600 GB/year, ~3 TB for 5 years: fits one database comfortably. Reads concentrate on popular links, so a cache gives a large win.' },
    { title: 'Short code generation', q: 'How do you generate the 7-character code?', opts: [
      o('Take an auto-increment ID (from a ranged ID allocator) and base62-encode it; 62^7 ≈ 3.5 trillion codes', 'Good: collision-free, short and simple. Add a random permutation if enumerability matters.', true),
      o('Hash the long URL (MD5) and take the first 7 chars', 'Collisions are possible and need checks and retries; also the same URL maps to the same code (may or may not be wanted).'),
      o('Pick a random 7-char string and hope', 'Collisions grow with the table; you would need a check-and-retry loop on a unique index.')], ideal: 'Counter + base62 gives guaranteed uniqueness. With many app servers, each fetches a block of IDs (e.g. 1,000) from a coordinator (Zookeeper/DB sequence) so there is no per-request coordination. Alternative: random codes with a unique index and retry on conflict, or pre-generated key pool.' },
    { title: 'Architecture', q: 'Where do redirects get served from, and what status code?', opts: [
      o('LB → stateless app servers → Redis cache → DB; return 302 (or 301 if analytics are unnecessary)', 'Good: cache-aside for hot links, stateless servers scale out. 301 is cached by browsers (less load, loses analytics); 302 keeps control.', true),
      o('Every redirect queries the DB directly', 'Works at this scale but wastes the obvious cache win and hurts latency under spikes.'),
      o('Store links in server memory', 'Servers would be stateful and lose data on restart.')], ideal: 'POST /links {url, alias?, ttl?} → 201 {short}. GET /{code} → 302 Location. Data: links(code PK, long_url, user_id, created_at, expires_at). Reads hit Redis first (cache-aside, LRU), then DB (indexed by code, key-value lookup so even NoSQL fits). Rate-limit creation, validate URLs, block malicious targets.' },
    { title: 'Bottlenecks and failure', q: 'A viral link receives 200k requests/s. What protects the system?', opts: [
      o('Cache the hot code in Redis and at a CDN/edge, replicate cache nodes, and use coalescing so only one miss hits the DB', 'Right: reads are tiny and identical; push them to the edge.', true),
      o('Scale the database vertically', 'Does not fix a single hot key and is expensive.'),
      o('Return errors above 10k/s', 'Protects the system but fails users unnecessarily; edge caching serves it cheaply.')], ideal: 'Hot key at the edge: CDN caches the redirect briefly (short TTL for expiry support). Replicate DB for reads and failover; multiple AZs; counters for analytics are written asynchronously through a queue so redirects never wait. Trade-offs: 301 vs 302, expiry freshness vs cache TTL, guessable vs random codes.' },
  ],
  rubric: {
    requirements: [pt('Defines core features and explicit exclusions', 'shorten', 'redirect', 'exclude', 'out of scope'), pt('States non-functional goals (latency, availability) and scale', 'latency', 'availab', 'million', 'scale')],
    architecture: [pt('Stateless app servers behind a load balancer with cache and DB', 'load balancer', 'stateless', 'cache'), pt('Defines API (create, redirect) with 301/302', 'post', 'get', '302', '301', 'redirect')],
    scalability: [pt('Estimates QPS and storage correctly (~40 w/s, ~4k r/s, ~600 GB/yr)', '40', '4,000', '4k', '600', 'gb'), pt('Explains growth path (replicas, sharding by code if needed)', 'replica', 'shard', 'partition')],
    database: [pt('Table/key design with code as primary key and unique index', 'primary key', 'unique', 'code'), pt('Justifies SQL vs NoSQL for key lookup', 'nosql', 'key-value', 'sql', 'postgres', 'dynamo')],
    performance: [pt('Caches hot links (Redis/CDN) with TTL/LRU', 'redis', 'cdn', 'lru', 'ttl'), pt('Asynchronous analytics off the redirect path', 'async', 'queue', 'kafka', 'analytics')],
    reliability: [pt('Replication / multi-AZ / failover', 'replica', 'zone', 'failover'), pt('Handles hot keys or abuse (rate limit, coalescing)', 'hot', 'rate limit', 'coalesc', 'abuse')],
    tradeoffs: [pt('Discusses code-generation trade-offs (counter vs hash vs random)', 'counter', 'hash', 'random', 'collision', 'base62'), pt('Discusses 301 vs 302 or consistency of expiry', '301', '302', 'expir', 'stale')],
    communication: [pt('Presents in a clear order (requirements → numbers → API → data → design → bottlenecks)', 'first', 'then', 'step', 'requirement'), pt('Justifies choices with "because / at the cost of"', 'because', 'cost', 'trade')],
  },
  refs: [ref('System Design Primer: Design Pastebin / URL shortener', 'https://github.com/donnemartin/system-design-primer/blob/master/solutions/system_design/pastebin/README.md', 'A worked, open-source solution to compare against yours (after you try).')],
},
{
  id: 'chat-app', title: 'Design a simple chat application', level: 'Beginner', stage: 6, prereq: ['tcp-udp-ws', 'queues', 'replication-sharding', 'login-flow'],
  prompt: 'Design a chat app supporting one-to-one and small group chats, online/offline delivery, message history and read receipts for 50 million daily active users.',
  steps: [
    { title: 'Requirements', q: 'What must be decided before any boxes are drawn?', opts: [
      o('1:1 and group messaging, delivery when offline, history, ordering within a chat; goals: low latency, no message loss, high availability; clarify group size and media', 'Right: the non-negotiables for chat are delivery guarantees and ordering.', true),
      o('Video calls, stories and payments', 'Scope creep; list them as out of scope.'),
      o('Only that messages should be sent', 'Misses ordering, durability and offline delivery.')], ideal: 'Functional: send/receive text, group chat (cap ~500 members), offline delivery, history, delivered/read status. Non-functional: p99 delivery < 500 ms, durability (never lose an acknowledged message), per-chat ordering, availability over perfect global consistency.' },
    { title: 'Transport', q: 'How do clients receive messages instantly?', opts: [
      o('Persistent WebSocket connections to chat servers, with push notifications when offline', 'Correct: push on demand, fall back to APNs/FCM for offline devices.', true),
      o('Clients poll every second', '50M users polling = tens of millions of wasted requests per second.'),
      o('Email', 'Not real-time.')], ideal: 'WebSocket gateway servers hold connections (stateful). A session registry (Redis: user_id → gateway) tells which gateway holds a user. Heartbeats detect dead clients; reconnect with jittered backoff.' },
    { title: 'Routing across servers', q: 'User A is on gateway 3, user B on gateway 9. How does the message get to B?', opts: [
      o('Persist to the message store/queue, look up B\'s gateway in the registry, forward there (or via pub/sub); if B is offline, store and send a push notification', 'Right: durability first, then delivery.', true),
      o('Broadcast every message to all gateways', 'Wasteful: O(servers) per message.'),
      o('Make A connect to B\'s server', 'Unworkable with many users.')], ideal: 'Flow: A→gateway→Chat service assigns a per-conversation sequence number, writes to the store (and Kafka for fan-out), acks A; delivery service looks up recipients\' gateways (Redis) and pushes; offline recipients get push notifications and pull on reconnect via "messages since seq N".' },
    { title: 'Data and storage', q: 'Which store and key design fit message history at this scale?', opts: [
      o('Wide-column/key-value store partitioned by conversation_id and clustered by message sequence/time; recent messages hot', 'Good: matches "latest N messages of a chat"; write-heavy, append-only.', true),
      o('One relational table, no partitioning', 'Fine at small scale, a single node will not sustain billions of rows.'),
      o('Store messages only in cache', 'Violates durability.')], ideal: 'messages(conversation_id PK, seq CLUSTER, sender_id, body, ts). Users/conversations/membership in relational DB. Hot partitions for huge groups: split by time buckets. Media goes to object storage with a CDN; messages hold only URLs.' },
    { title: 'Failure and delivery guarantees', q: 'The gateway crashes after receiving a message but before acknowledging the sender. What happens?', opts: [
      o('The client retries with the same client-generated message id; the server dedupes (idempotent), so the message appears exactly once', 'Right: at-least-once + idempotency.', true),
      o('The message is lost; users resend manually', 'Violates the no-loss requirement.'),
      o('The server assumes it was delivered', 'Never assume.')], ideal: 'Client message ids + server dedupe; acks at each hop (sent, delivered, read are separate receipts); ordering by per-conversation sequence; replicate the store across zones; reconnect storms handled with backoff; group fan-out via queues, with limits on group size.' },
  ],
  rubric: {
    requirements: [pt('Scope: 1:1, groups, offline, history; exclusions', 'group', 'offline', 'history', 'exclude'), pt('Guarantees: durability, ordering, latency', 'durab', 'order', 'latency', 'loss')],
    architecture: [pt('WebSocket gateway + chat service + registry of connections', 'websocket', 'gateway', 'registry'), pt('Pub/sub or forwarding between gateways', 'pub', 'forward', 'route', 'kafka')],
    scalability: [pt('Estimates connections/messages (e.g. 50M DAU, msgs/s)', 'million', 'qps', 'per second', 'connection'), pt('Scales gateways horizontally; partitions data', 'horizontal', 'partition', 'shard', 'scale')],
    database: [pt('Message store partitioned by conversation with sequence ordering', 'conversation', 'partition', 'seq', 'cassandra'), pt('Separates metadata (SQL) from messages and media (object storage)', 'object', 's3', 'metadata', 'sql')],
    performance: [pt('Push over persistent connections, not polling', 'push', 'websocket', 'polling'), pt('Recent history cached / fetch since seq', 'cache', 'since', 'recent')],
    reliability: [pt('Idempotent message ids and acks / retries', 'idempot', 'dedupe', 'ack', 'retry'), pt('Offline handling with push notifications and replay', 'push notification', 'offline', 'replay', 'apns', 'fcm')],
    tradeoffs: [pt('Ordering per conversation vs global ordering', 'per conversation', 'sequence', 'order'), pt('Large group fan-out cost / availability vs consistency', 'fan-out', 'group', 'consisten', 'availab')],
    communication: [pt('Clear flow from send to delivery', 'flow', 'sender', 'recipient', 'step'), pt('Justifies decisions with trade-offs', 'because', 'cost', 'trade')],
  },
  refs: [ref('Discord: How Discord Stores Billions of Messages', 'https://discord.com/blog/how-discord-stores-billions-of-messages', 'Real partitioning and storage evolution for chat.')],
},
{
  id: 'notification-system', title: 'Design a notification system', level: 'Beginner', stage: 6, prereq: ['queues', 'idempotency-retries', 'rate-limiting'],
  prompt: 'Design a system that sends push, SMS and email notifications for many product teams: millions per hour, user preferences, retries, no duplicates, and protection against spamming users.',
  steps: [
    { title: 'Requirements', q: 'Which requirement most shapes the architecture?', opts: [
      o('Delivery is asynchronous, tolerates delay but must not lose or duplicate notifications, respects user preferences and provider rate limits', 'Right: async + reliability + preferences are the drivers.', true),
      o('Notifications must be sent in the same HTTP request as the action', 'Couples the product to slow providers.'),
      o('Only email is required', 'Multi-channel matters for the design (templates, providers).')], ideal: 'Functional: channels (push/SMS/email), templates, user preferences/quiet hours, scheduled and triggered sends. Non-functional: scale (millions/hour with spikes), at-least-once delivery with dedupe, soft real-time (seconds), provider failover.' },
    { title: 'Decoupling', q: 'How do product services hand notifications to the system?', opts: [
      o('Publish a notification request/event to a durable queue; return immediately', 'Right: producers are decoupled and spikes are absorbed.', true),
      o('Call the SMS provider directly from each service', 'Every team re-implements retries, rate limits and failover.'),
      o('Write to a shared file', 'Not durable or scalable.')], ideal: 'API/queue ingress → validation & preference check → per-channel queues (push, SMS, email) → channel workers → providers (FCM/APNs, Twilio, SES). Separate queues isolate a failing channel from the others.' },
    { title: 'Reliability', q: 'The email provider times out after accepting some messages. How do you avoid duplicates and losses?', opts: [
      o('Unique notification id as the idempotency key; workers record status; retry with backoff; DLQ after N attempts; fail over to a second provider', 'Right: safe retries and fallbacks.', true),
      o('Retry immediately forever', 'Retry storms and duplicate sends.'),
      o('Never retry', 'Silent loss.')], ideal: 'Status table (queued/sent/failed) keyed by notification id with unique constraint. Exponential backoff + jitter, circuit breaker per provider, DLQ with alerts, webhook callbacks for delivery status.' },
    { title: 'Scale and fairness', q: 'A marketing blast of 20M emails is queued. Critical OTP SMS messages must still arrive in seconds. What do you do?', opts: [
      o('Separate priority queues/worker pools, rate-limit bulk traffic per provider, and throttle per user to avoid spam', 'Right: protect critical traffic from bulk.', true),
      o('One FIFO queue for all', 'OTPs wait behind 20M emails.'),
      o('Drop marketing emails', 'Defeats the product; throttle instead.')], ideal: 'Priority lanes (OTP/transactional vs marketing), autoscale workers on queue depth, token-bucket rate limits matched to provider quotas, per-user frequency caps and quiet hours, batching for efficiency.' },
    { title: 'Data and observability', q: 'What do you store and monitor?', opts: [
      o('Preferences and templates (relational/cache), notification log with status (partitioned by time/user), metrics for queue depth, send latency, failure rate per provider', 'Right: you cannot operate what you cannot see.', true),
      o('Nothing; fire and forget', 'No debugging, no audit, no dedupe.'),
      o('Only application logs', 'Insufficient for status queries and alerting.')], ideal: 'Preferences cached with invalidation; log table with TTL/archival; dashboards on RED metrics per channel; alerts on growing queue depth and provider error rates; trace ids from the originating event.' },
  ],
  rubric: {
    requirements: [pt('Channels, preferences, templates, scheduling', 'channel', 'preference', 'template', 'schedul'), pt('At-least-once with dedupe; latency expectations', 'dedupe', 'duplicate', 'at-least', 'latency')],
    architecture: [pt('Queue-based pipeline with per-channel workers', 'queue', 'worker', 'channel'), pt('Third-party providers behind adapters', 'provider', 'twilio', 'fcm', 'apns', 'ses')],
    scalability: [pt('Scale workers on queue depth; partition queues', 'queue depth', 'autoscal', 'partition', 'scale'), pt('Estimates throughput (per hour → per second)', 'per second', 'qps', 'million')],
    database: [pt('Notification log with unique id and status', 'unique', 'status', 'log'), pt('Preferences store with caching', 'preference', 'cache')],
    performance: [pt('Priority lanes for OTP/transactional', 'priority', 'otp', 'lane'), pt('Batching / rate limits matching providers', 'batch', 'rate limit', 'quota')],
    reliability: [pt('Retries with backoff, DLQ, circuit breaker', 'backoff', 'dlq', 'dead', 'circuit'), pt('Provider failover', 'failover', 'second provider', 'fallback')],
    tradeoffs: [pt('Latency vs deduplication/ordering', 'trade', 'latency', 'dedupe'), pt('Spam protection vs delivery (frequency caps)', 'frequency', 'cap', 'spam', 'quiet')],
    communication: [pt('Walks through one notification end to end', 'end to end', 'flow', 'step', 'then'), pt('Explains reasons for choices', 'because', 'cost', 'trade')],
  },
  refs: [ref('System Design Primer: Queues and async', 'https://github.com/donnemartin/system-design-primer#asynchronism', 'Background on the async patterns this design uses.')],
},
{
  id: 'file-upload', title: 'Design a file upload service', level: 'Beginner', stage: 6, prereq: ['cdn', 'queues'],
  prompt: 'Design a service where users upload files (up to 5 GB: photos, videos, documents), share them by link and download them quickly worldwide, with virus scanning and thumbnails.',
  steps: [
    { title: 'Requirements', q: 'Which statement best captures the key constraints?', opts: [
      o('Large files over flaky networks need resumable uploads; durability is critical; downloads should be fast globally; processing (scan/thumbnails) can be async', 'Right.', true),
      o('Upload via a single HTTP POST to the app server', 'Large uploads tie up app servers and fail on flaky networks.'),
      o('Store files in the database as BLOBs', 'Expensive and slow at scale.')], ideal: 'Functional: upload, resume, share link with permissions, download, preview thumbnails. Non-functional: durability (11 nines via object storage), availability, global read latency, cost efficiency, security.' },
    { title: 'Upload path', q: 'How do bytes travel from the client to storage?', opts: [
      o('Client asks the API for a pre-signed URL and uploads directly to object storage in chunks (multipart), then confirms completion', 'Right: app servers never carry the bytes.', true),
      o('Proxy every byte through the app servers', 'Bandwidth and CPU bottleneck.'),
      o('FTP to a single server', 'Single point of failure.')], ideal: 'POST /uploads → upload id + presigned part URLs; client PUTs 5-10 MB chunks (retry per chunk, resume after failure); POST /uploads/{id}/complete assembles. Checksums per chunk verify integrity.' },
    { title: 'Metadata', q: 'Where do file names, owners and permissions live?', opts: [
      o('A relational/NoSQL metadata DB (files, owners, ACL, status); only the object key points into object storage', 'Right: separate small structured metadata from big blobs.', true),
      o('Inside the file objects', 'Hard to query and update.'),
      o('In server memory', 'Lost on restart.')], ideal: 'files(id, owner, name, size, content_type, object_key, status, created_at), shares(file_id, grantee, perm, expires_at). Index by owner for listing. Deduplicate by content hash if cost matters.' },
    { title: 'Processing', q: 'Virus scan and thumbnail generation should…', opts: [
      o('Run asynchronously: object-created event → queue → workers; file is "processing" until the scan passes', 'Right: decoupled, scalable, retryable.', true),
      o('Block the upload response until done', 'Slow and fragile.'),
      o('Be skipped', 'Security risk.')], ideal: 'Storage event notification → queue → scan workers (quarantine bucket until clean) → thumbnail workers → status update. Idempotent workers; DLQ for poison files.' },
    { title: 'Download and scale', q: 'How do you serve popular files worldwide?', opts: [
      o('Authorise via the API, then redirect to a short-lived signed CDN URL; the CDN caches popular objects', 'Right: control access, offload bandwidth.', true),
      o('Stream every download through the app servers', 'Bottleneck and expensive.'),
      o('Make all objects public forever', 'No access control.')], ideal: 'Signed URLs/cookies with expiry; range requests for resumable downloads; storage tiering for cold data; lifecycle rules; cross-region replication for durability; rate limits and quotas per user.' },
  ],
  rubric: {
    requirements: [pt('Max size, resumable upload, sharing, durability stated', 'resum', 'size', 'sharing', 'durab'), pt('Non-functional: global latency, security', 'global', 'latency', 'security')],
    architecture: [pt('Pre-signed direct-to-object-storage uploads', 'presigned', 'pre-signed', 'signed', 'direct'), pt('Async processing pipeline (scan, thumbnails)', 'queue', 'async', 'worker', 'scan')],
    scalability: [pt('Chunked/multipart upload; horizontal workers', 'chunk', 'multipart', 'worker'), pt('Estimates storage/bandwidth', 'tb', 'pb', 'bandwidth', 'gb')],
    database: [pt('Separate metadata DB from blobs with object_key', 'metadata', 'object key', 'object_key'), pt('ACL/share model', 'acl', 'share', 'permission')],
    performance: [pt('CDN with signed URLs; range requests', 'cdn', 'range', 'signed'), pt('Storage tiering for cold data', 'tier', 'cold', 'lifecycle')],
    reliability: [pt('Chunk retry/checksums for integrity', 'checksum', 'retry', 'integrity'), pt('Replication/durability and quarantine of unscanned files', 'replicat', 'quarantine', 'durab')],
    tradeoffs: [pt('Cost vs speed (tiering, dedupe, CDN)', 'cost', 'dedupe', 'tier'), pt('Security vs convenience (signed URL expiry)', 'expir', 'security', 'public')],
    communication: [pt('Describes upload and download flows step by step', 'step', 'flow', 'then'), pt('Gives reasons', 'because', 'cost', 'trade')],
  },
  refs: [ref('AWS: Uploading objects with presigned URLs', 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html', 'Official description of the direct-upload pattern.')],
},
]
