import { afterEach, describe, expect, it, vi } from 'vitest'
import { errorMetadata, log, safePath, setLogContext } from './logger.js'

afterEach(() => {
  setLogContext({ userId: null })
  vi.restoreAllMocks()
})

describe('logger', () => {
  it('writes one structured JSON argument and drops unsafe metadata', () => {
    const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {})

    log('INFO', 'test_event', 'Safe message', {
      request_id: 'request-123',
      path: 'https://api.example.test/login?username=alice',
      username: 'alice',
      password: 'secret',
      prompt: 'private prompt',
      body: { reply: 'private reply' },
    })

    expect(consoleSpy).toHaveBeenCalledTimes(1)
    expect(consoleSpy.mock.calls[0]).toHaveLength(1)
    const entry = JSON.parse(consoleSpy.mock.calls[0][0])
    expect(entry).toMatchObject({
      level: 'INFO',
      service: 'apira-frontend',
      event: 'test_event',
      message: 'Safe message',
      request_id: 'request-123',
      path: '/login',
    })
    expect(entry).not.toHaveProperty('username')
    expect(entry).not.toHaveProperty('password')
    expect(entry).not.toHaveProperty('prompt')
    expect(entry).not.toHaveProperty('body')
  })

  it('removes origins, query strings, and fragments from URLs', () => {
    expect(
      safePath('https://api.example.test/portfolio?user_id=42#holdings'),
    ).toBe('/portfolio')
    expect(safePath('not a valid absolute URL?password=secret')).toBe(
      '/not%20a%20valid%20absolute%20URL',
    )
  })

  it('reports safe error metadata without an error message', () => {
    const error = new TypeError('username alice failed')
    error.code = 'NETWORK_ERROR'

    expect(errorMetadata(error)).toEqual({
      error_type: 'TypeError',
      error_code: 'NETWORK_ERROR',
    })
  })

  it('includes user_id context and safe ticker lists', () => {
    const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {})

    setLogContext({ userId: 1 })
    log('INFO', 'portfolio_loaded', 'Portfolio holdings loaded in UI', {
      tickers: ['AAPL', 'TSLA'],
      holdings_count: 2,
      password: 'secret',
    })

    const entry = JSON.parse(consoleSpy.mock.calls[0][0])
    expect(entry.user_id).toBe(1)
    expect(entry.tickers).toEqual(['AAPL', 'TSLA'])
    expect(entry.holdings_count).toBe(2)
    expect(entry).not.toHaveProperty('password')
  })
})
