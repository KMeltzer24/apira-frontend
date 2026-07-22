import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiFetch } from './api.js'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('apiFetch', () => {
  it('injects a unique request ID without changing existing headers', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)
    vi.spyOn(console, 'info').mockImplementation(() => {})

    await apiFetch(
      'https://api.example.test/login?username=alice',
      { method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { service: 'user-service' },
    )

    const [, options] = fetchMock.mock.calls[0]
    expect(options.headers.get('Content-Type')).toBe('application/json')
    expect(options.headers.get('X-Request-ID')).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    )

    const events = console.info.mock.calls.map(([entry]) => JSON.parse(entry))
    expect(events).toHaveLength(2)
    expect(events[0]).toMatchObject({
      event: 'http_request_started',
      path: '/login',
      upstream: 'user-service',
      request_id: options.headers.get('X-Request-ID'),
    })
    expect(JSON.stringify(events)).not.toContain('alice')
  })

  it('logs HTTP failure status without consuming the response', async () => {
    const response = new Response(JSON.stringify({ detail: 'Login failed' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response))
    vi.spyOn(console, 'info').mockImplementation(() => {})
    const warningSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const result = await apiFetch('https://api.example.test/login', {}, {
      service: 'user-service',
    })

    expect(result).toBe(response)
    expect(await result.json()).toEqual({ detail: 'Login failed' })
    const event = JSON.parse(warningSpy.mock.calls[0][0])
    expect(event).toMatchObject({
      event: 'http_request_failed',
      path: '/login',
      status_code: 401,
    })
    expect(event).not.toHaveProperty('detail')
  })

  it('logs safe metadata and rethrows network failures', async () => {
    const failure = new TypeError('secret response contents')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(failure))
    vi.spyOn(console, 'info').mockImplementation(() => {})
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await expect(
      apiFetch('https://api.example.test/chat?prompt=secret', {}, {
        service: 'agent',
      }),
    ).rejects.toBe(failure)

    const event = JSON.parse(errorSpy.mock.calls[0][0])
    expect(event).toMatchObject({
      event: 'http_request_failed',
      path: '/chat',
      error_type: 'TypeError',
    })
    expect(JSON.stringify(event)).not.toContain('secret')
  })
})
