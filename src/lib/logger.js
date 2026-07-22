const LEVELS = {
  DEBUG: 10,
  INFO: 20,
  WARNING: 30,
  ERROR: 40,
}

const configuredLevel = String(import.meta.env.VITE_LOG_LEVEL || 'INFO').toUpperCase()
const minimumLevel = LEVELS[configuredLevel] ?? LEVELS.INFO
const environment = import.meta.env.VITE_ENVIRONMENT || import.meta.env.MODE || 'development'

const SAFE_FIELDS = new Set([
  'request_id',
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
])

function safeValue(value) {
  if (typeof value === 'string') return value.slice(0, 200)
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'boolean' || value === null) return value
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
}

export const logger = {
  debug: (event, message, metadata) => log('DEBUG', event, message, metadata),
  info: (event, message, metadata) => log('INFO', event, message, metadata),
  warning: (event, message, metadata) =>
    log('WARNING', event, message, metadata),
  error: (event, message, metadata) => log('ERROR', event, message, metadata),
}
