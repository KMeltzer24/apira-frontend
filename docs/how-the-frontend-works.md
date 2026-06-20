# How the Frontend Works

The Apira frontend is **one React app with two pages**, switched by a nav bar at the top:

| Page | What it does | Talks to |
|------|--------------|----------|
| **Portfolio** | Login, then view your holdings | EC2 backend (`:8001` / `:8002`) |
| **Agent Chat** | Type a message, get an answer | The local agent API (`:8100`) |

The two pages are independent — switching tabs just swaps which screen is shown. The Portfolio page does not use the agent, and the chat page does not use the EC2 APIs.

---

## How a page "talks to" a server

Every page does the same basic thing: the browser makes an HTTP request to a URL and shows the response. The only difference between pages is **which URL** they call.

The URLs come from `.env` (read at build time):

```bash
VITE_USER_SERVICE_URL=http://<EC2_PUBLIC_IP>:8001   # Portfolio: login
VITE_PORTFOLIO_SERVICE_URL=http://<EC2_PUBLIC_IP>:8002  # Portfolio: holdings
VITE_AGENT_URL=http://localhost:8100                # Agent Chat
```

Note the chat URL is `localhost`, not EC2 — the agent runs on your Mac because it needs a local LLM (Ollama).

---

## Portfolio page

1. You enter a username/password and hit **Login**.
2. The browser sends `POST /login` to the user service.
3. On success it gets back a `user_id`.
4. **View My Portfolio** sends `GET /portfolio?user_id=...` to the portfolio service.
5. The holdings are listed on screen.

This is the original flow and is unchanged.

---

## Agent Chat page

1. You type a message and hit **Send**.
2. The browser sends `POST /chat` to the agent API with your text.
3. The agent (a separate program) logs in and fetches the portfolio using its tools, then replies with text.
4. The reply appears in the output box.

The actual request is a single `fetch`:

```javascript
const res = await fetch(`${AGENT_URL}/chat`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message }),
})
const data = await res.json()
setReply(data.reply)
```

The agent itself lives in a separate repo, [apira-agent](https://github.com/KMeltzer24/apira-agent). This frontend only sends text and shows the answer — it knows nothing about how the agent works.

---

## Running it

```bash
docker compose up -d --build      # serves the app at http://localhost:3000
```

- The **Portfolio** page works as long as EC2 is up.
- The **Agent Chat** page also needs the agent server running locally:
  ```bash
  # in the apira-agent repo
  uvicorn server:app --host 127.0.0.1 --port 8100
  ```
  If the agent server is not running, the chat page will show a connection error; the Portfolio page still works.

---

## Why the chat needs a separate server

The frontend can only talk to things over HTTP. The agent was originally a terminal script, so it had no web address. The [apira-agent](https://github.com/KMeltzer24/apira-agent) repo adds a small server (`/chat` endpoint) that gives the agent a web address this page can call. The frontend (UI) and the agent server (backend) stay in separate repos — the same client/server split as the Portfolio page and the EC2 backend.
