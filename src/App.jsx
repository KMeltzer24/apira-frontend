import { useState } from 'react'

const USER_SERVICE_URL = import.meta.env.VITE_USER_SERVICE_URL
const PORTFOLIO_SERVICE_URL = import.meta.env.VITE_PORTFOLIO_SERVICE_URL
const AGENT_URL = import.meta.env.VITE_AGENT_URL

function ConfigError() {
  return (
    <div className="card">
      <h1>Configuration required</h1>
      <p className="error">
        Copy <code>.env.example</code> to <code>.env</code> and set{' '}
        <code>VITE_USER_SERVICE_URL</code> and{' '}
        <code>VITE_PORTFOLIO_SERVICE_URL</code> to your EC2 backend URLs, then
        run <code>docker compose up -d --build</code>.
      </p>
    </div>
  )
}

function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${USER_SERVICE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      if (!res.ok) {
        let message = `Login failed (${res.status})`
        try {
          const err = await res.json()
          if (typeof err.detail === 'string') message = err.detail
        } catch {
          // response had no JSON body; keep the default message
        }
        throw new Error(message)
      }
      const data = await res.json()
      if (data.success) {
        onLogin({ username: data.username, userId: data.user_id })
      } else {
        setError('Login failed')
      }
    } catch (err) {
      setError(err.message || 'Could not reach the user service')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <h1>Sign in</h1>
      <form className="form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Username</span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter any username"
            autoFocus
          />
        </label>
        <label className="field">
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter any password"
          />
        </label>
        <button type="submit" className="btn primary" disabled={loading}>
          {loading ? 'Signing in…' : 'Login'}
        </button>
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  )
}

function PortfolioScreen({ user, onLogout }) {
  const [holdings, setHoldings] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadPortfolio = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await fetch(
        `${PORTFOLIO_SERVICE_URL}/portfolio?user_id=${user.userId}`,
      )
      if (!res.ok) throw new Error(`Request failed (${res.status})`)
      const data = await res.json()
      setHoldings(data.holdings)
    } catch (err) {
      setError(err.message || 'Could not reach the portfolio service')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <h1>Welcome, {user.username}</h1>
      <div className="actions">
        <button className="btn primary" onClick={loadPortfolio} disabled={loading}>
          {loading ? 'Loading…' : 'View My Portfolio'}
        </button>
        <button className="btn ghost" onClick={onLogout}>
          Logout
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {holdings && (
        <ul className="holdings">
          {holdings.map((h) => (
            <li key={h.ticker} className="holding">
              You own <strong>{h.shares}</strong> shares of {h.company} (
              <code>{h.ticker}</code>)
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ChatScreen() {
  const [message, setMessage] = useState('')
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!message.trim()) return
    setError('')
    setReply('')
    setLoading(true)
    try {
      const res = await fetch(`${AGENT_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })
      if (!res.ok) throw new Error(`Request failed (${res.status})`)
      const data = await res.json()
      setReply(data.reply)
    } catch (err) {
      setError(err.message || 'Could not reach the agent')
    } finally {
      setLoading(false)
    }
  }

  if (!AGENT_URL) {
    return (
      <div className="card">
        <h1>Agent Chat</h1>
        <p className="error">
          Set <code>VITE_AGENT_URL</code> in <code>.env</code> to the agent API
          (e.g. <code>http://localhost:8100</code>) and start the agent server.
        </p>
      </div>
    )
  }

  return (
    <div className="card">
      <h1>Agent Chat</h1>
      <form className="form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Your message</span>
          <textarea
            className="chat-input"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="e.g. Log in as alice (password: password) and show my portfolio"
            rows={3}
            autoFocus
          />
        </label>
        <button type="submit" className="btn primary" disabled={loading}>
          {loading ? 'Thinking…' : 'Send'}
        </button>
        {error && <p className="error">{error}</p>}
      </form>

      <label className="field chat-output-field">
        <span>Agent response</span>
        <div className="chat-output">
          {reply ? reply : <span className="chat-placeholder">The agent's reply will appear here.</span>}
        </div>
      </label>
    </div>
  )
}

export default function App() {
  const [view, setView] = useState('portfolio')
  const [user, setUser] = useState(null)

  if (!USER_SERVICE_URL || !PORTFOLIO_SERVICE_URL) {
    return (
      <div className="app">
        <ConfigError />
      </div>
    )
  }

  return (
    <div className="app">
      <div className="shell">
        <nav className="nav">
          <button
            className={`tab ${view === 'portfolio' ? 'active' : ''}`}
            onClick={() => setView('portfolio')}
          >
            Portfolio
          </button>
          <button
            className={`tab ${view === 'chat' ? 'active' : ''}`}
            onClick={() => setView('chat')}
          >
            Agent Chat
          </button>
        </nav>

        {view === 'portfolio' ? (
          user ? (
            <PortfolioScreen user={user} onLogout={() => setUser(null)} />
          ) : (
            <LoginScreen onLogin={setUser} />
          )
        ) : (
          <ChatScreen />
        )}
      </div>
    </div>
  )
}
