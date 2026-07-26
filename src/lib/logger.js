const LEVELS = {
  DEBUG: 10,
  INFO: 20,
  WARNING: 30,
  ERROR: 40,
}

const configuredLevel = String(import.meta.env.VITE_LOG_LEVEL || 'INFO').toUpperCase()
const minimumLevel = LEVELS[configuredLevel] ?? LEVELS.INFO
const environment = import.meta.env.VITE_ENVIRONMENT || import.meta.env.MODE || 'development'
const logServiceUrl = String(import.meta.env.VITE_LOG_SERVICE_URL || '').replace(/\/$/, '')

const SAFE_FIELDS = new Set([
  'request_id',
  'user_id',
  'method',
  'path',
  'status_code',
  'duration_ms',
  'upstream',
  'error_type',
  'error_code',
  'source_path',
  'line_number',
  'column_number',
  'holdings_count',
  'tickers',
])

const logContext = {
  user_id: null,
}

const pending = []
const MAX_BATCH = 20
const FLUSH_MS = 2000
let flushTimer = null
let flushHooked = false

export function setLogContext({ userId } = {}) {
  if (userId === null || userId === undefined || userId === '') {
    logContext.user_id = null
    return
  }
  const numeric = Number(userId)
  logContext.user_id = Number.isFinite(numeric) ? numeric : null
}

export function getLogContext() {
  return { ...logContext }
}

function safeValue(value) {
  if (typeof value === 'string') return value.slice(0, 200)
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'boolean' || value === null) return value
  if (Array.isArray(value)) {
    const items = value
      .slice(0, 20)
      .map((item) => safeValue(item))
      .filter((item) => item !== undefined)
    return items
  }
  return undefined
}

export function safePath(url) {
  try {
    const base =
      typeof window === 'undefined' ? 'http://localhost' : window.location.origin
    return new URL(url, base).pathname || '/'
  } catch {
    return '/'
  }
}

export function errorMetadata(error) {
  const metadata = {
    error_type:
      error instanceof Error
        ? error.name || 'Error'
        : error === null
          ? 'null'
          : typeof error,
  }

  if (
    error &&
    typeof error === 'object' &&
    typeof error.code === 'string' &&
    error.code.length <= 100
  ) {
    metadata.error_code = error.code
  }

  return metadata
}

function ensureFlushHooks() {
  if (flushHooked || typeof window === 'undefined') return
  flushHooked = true
  window.addEventListener('pagehide', () => {
    void flushLogs({ keepalive: true })
  })
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      void flushLogs({ keepalive: true })
    }
  })
}

function scheduleFlush() {
  if (!logServiceUrl || flushTimer != null) return
  flushTimer = setTimeout(() => {
    flushTimer = null
    void flushLogs()
  }, FLUSH_MS)
}

export async function flushLogs({ keepalive = false } = {}) {
  if (!logServiceUrl || pending.length === 0) return
  if (flushTimer != null) {
    clearTimeout(flushTimer)
    flushTimer = null
  }

  const batch = pending.splice(0, pending.length)
  const body = JSON.stringify({ events: batch })
  const endpoint = `${logServiceUrl}/v1/logs`

  try {
    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive,
      mode: 'cors',
    })
  } catch {
    // Cloud shipping is best-effort; console already has the events.
  }
}

function enqueueRemote(entry) {
  if (!logServiceUrl) return
  ensureFlushHooks()
  pending.push(entry)
  if (pending.length >= MAX_BATCH) {
    void flushLogs()
    return
  }
  scheduleFlush()
}

export function log(level, event, message, metadata = {}) {
  const normalizedLevel = String(level).toUpperCase()
  if ((LEVELS[normalizedLevel] ?? LEVELS.INFO) < minimumLevel) return

  const entry = {
    timestamp: new Date().toISOString(),
    level: normalizedLevel,
    service: 'apira-frontend',
    environment,
    event: String(event).slice(0, 100),
    message: String(message).slice(0, 200),
    request_id: null,
  }

  if (logContext.user_id !== null) {
    entry.user_id = logContext.user_id
  }

  for (const [key, value] of Object.entries(metadata)) {
    if (!SAFE_FIELDS.has(key)) continue
    const sanitized =
      (key === 'path' || key === 'source_path') && typeof value === 'string'
        ? safePath(value)
        : safeValue(value)
    if (sanitized !== undefined) entry[key] = sanitized
  }

  const method =
    normalizedLevel === 'ERROR'
      ? 'error'
      : normalizedLevel === 'WARNING'
        ? 'warn'
        : normalizedLevel === 'DEBUG'
          ? 'debug'
          : 'info'
  console[method](JSON.stringify(entry))
  enqueueRemote(entry)
}

export const logger = {
  debug: (event, message, metadata) => log('DEBUG', event, message, metadata),
  info: (event, message, metadata) => log('INFO', event, message, metadata),
  warning: (event, message, metadata) =>
    log('WARNING', event, message, metadata),
  error: (event, message, metadata) => log('ERROR', event, message, metadata),
}
