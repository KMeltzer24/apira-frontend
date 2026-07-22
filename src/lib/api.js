import { errorMetadata, logger, safePath } from './logger.js'

function elapsed(startedAt) {
  return Math.round((performance.now() - startedAt) * 100) / 100
}

export async function apiFetch(url, options = {}, { service = 'unknown' } = {}) {
  const requestId = crypto.randomUUID()
  const method = String(options.method || 'GET').toUpperCase()
  const path = safePath(url)
  const upstream = String(service).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 100) || 'unknown'
  const headers = new Headers(options.headers)
  headers.set('X-Request-ID', requestId)
  const startedAt = performance.now()
  const metadata = { request_id: requestId, method, path, upstream }

  logger.info('http_request_started', 'API request started', metadata)

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
        'API request completed',
        responseMetadata,
      )
    } else {
      logger.warning(
        'http_request_failed',
        'API request returned an error status',
        responseMetadata,
      )
    }

    return response
  } catch (error) {
    logger.error('http_request_failed', 'API request failed', {
      ...metadata,
      duration_ms: elapsed(startedAt),
      ...errorMetadata(error),
    })
    throw error
  }
}
