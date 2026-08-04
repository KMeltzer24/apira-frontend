import { errorMetadata, logger, safePath } from './logger.js'

function elapsed(startedAt) {
  return Math.round((performance.now() - startedAt) * 100) / 100
}

function normalizeRequestId(value) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      trimmed,
    )
  ) {
    return null
  }
  return trimmed.toLowerCase()
}

export async function apiFetch(
  url,
  options = {},
  { service = 'unknown', requestId: providedRequestId } = {},
) {
  const requestId =
    normalizeRequestId(providedRequestId) || crypto.randomUUID()
  const method = String(options.method || 'GET').toUpperCase()
  const path = safePath(url)
  const upstream =
    String(service).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 100) || 'unknown'
  const headers = new Headers(options.headers)
  headers.set('X-Request-ID', requestId)
  const startedAt = performance.now()
  const metadata = { request_id: requestId, method, path, upstream }

  try {
    const response = await fetch(url, { ...options, headers })
    const responseMetadata = {
      ...metadata,
      status_code: response.status,
      duration_ms: elapsed(startedAt),
    }

    if (response.ok) {
      logger.info(
        'http_request_completed',
        `HTTP ${method} ${path} completed (${response.status})`,
        responseMetadata,
      )
    } else {
      logger.warning(
        'http_request_failed',
        `HTTP ${method} ${path} returned ${response.status}`,
        responseMetadata,
      )
    }

    return response
  } catch (error) {
    logger.error(
      'http_request_failed',
      `HTTP ${method} ${path} failed`,
      {
        ...metadata,
        duration_ms: elapsed(startedAt),
        ...errorMetadata(error),
      },
    )
    throw error
  }
}
