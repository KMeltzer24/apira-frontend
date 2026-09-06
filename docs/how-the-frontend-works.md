# How the Frontend Works

A React (Vite) single-page app with three views selected by a top nav bar. Each view is an independent screen that calls a different backend; they share no state.

| View | Purpose | Backend | Transport |
|------|---------|---------|-----------|
| **Portfolio** | Login, then list holdings | user-service (`:8001`), portfolio-service (`:8002`) | REST/JSON |
| **Agent Chat** | Send a prompt, render the reply | apira-agent API (`:8100`) | REST/JSON |
| **Recommender** | Trigger stock recommendations | apira-agent API (`:8100`) | REST/JSON |

---

## Structure

`src/App.jsx` holds the whole UI. `App` keeps two pieces of state:

- `view` — `'portfolio'`, `'chat'`, or `'recommender'`, toggled by the nav buttons
- `user` — the logged-in user for the Portfolio view (unchanged from the original app)

Components:

| Component | Responsibility |
|-----------|----------------|
| `LoginScreen` | `POST /login`, lift `user_id` to `App` |
| `PortfolioScreen` | `GET /portfolio?user_id=`, render holdings |
| `ChatScreen` | `POST /chat`, render the agent's reply |
| `StockRecommenderScreen` | `POST /chat` with a structured recommendation prompt |
| `ConfigError` | Shown if the service URLs are missing |

## Configuration

Service URLs are injected at build time from `.env` via Vite's `import.meta.env`:

```bash
# Local (apira/docs/run-locally.md)
VITE_USER_SERVICE_URL=http://localhost:8001
VITE_PORTFOLIO_SERVICE_URL=http://localhost:8002
VITE_AGENT_URL=http://localhost:8100
VITE_LOG_SERVICE_URL=http://localhost:8300
```

Vite bakes `VITE_*` at **image build** time. Rebuild after changing `.env`. For local work see [apira: run-locally.md](https://github.com/KMeltzer24/apira/blob/main/docs/run-locally.md).

---

## Portfolio view

1. `LoginScreen` submits `POST {VITE_USER_SERVICE_URL}/login` with `{ username, password }`.
2. On `success`, the returned `user_id` is stored in `App` state.
3. `PortfolioScreen` calls `GET {VITE_PORTFOLIO_SERVICE_URL}/portfolio?user_id=<id>` and renders `holdings`.

This is the original flow and is unchanged by the agent features.

---

## Agent Chat view

`ChatScreen` is a controlled form: a textarea for the prompt and a read-only output area for the reply. On submit it issues one request:

```javascript
const res = await fetch(`${AGENT_URL}/chat`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message }),
})
const data = await res.json()
setReply(data.reply)
```

The response shape is `{ "reply": string }`. Loading and error states are handled locally in the component. If `VITE_AGENT_URL` is unset, the view renders a configuration hint instead of the form.

The frontend has no knowledge of how the agent produces its answer — it sends text and renders text. [apira-agent](https://github.com/KMeltzer24/apira-agent) is a LangGraph supervisor (the chat agent) plus portfolio and research specialists that call MCP tools; this app is just an HTTP client of `/chat`.

## Browser logging and request correlation

All API calls go through `src/lib/api.js`. The wrapper generates a new UUID,
sends it as `X-Request-ID`, measures latency, and emits structured JSON events
through `src/lib/logger.js`. Uncaught browser errors and rejected promises are
also logged by handlers registered in `src/main.jsx`.

Logs contain endpoint paths, status codes, durations, service names, and safe
error types. They never contain passwords, usernames, prompts, replies,
portfolio data, request/response bodies, query values, or environment secrets.
Use DevTools Console and the response/request ID to correlate a browser event
with local container logs. See the canonical
[logging contract](https://github.com/KMeltzer24/apira/blob/main/docs/logging.md).

---

## Stock Recommender view

`StockRecommenderScreen` collects username, password, and a **research search mode** (radio buttons):

- **Local folder** — agent uses `searchLocalFolder` only
- **Vector DB** — agent uses `searchVectorDB` only (pgvector on local Postgres)

On submit it sends one `POST /chat` request with a structured prompt that tells the agent which research tool to use, then log in, fetch the portfolio, and return hold/add/trim recommendations. The supervisor typically runs the **portfolio** specialist then the **research** specialist; the frontend still only sees `{ reply }`.

Like Agent Chat, this view is independent of the Portfolio tab — credentials are entered here, not reused from a Portfolio login session.

Full feature write-up: [apira-rag/docs/how-stock-recommender-works.md](https://github.com/KMeltzer24/apira-rag/blob/main/docs/how-stock-recommender-works.md).

---

## Running

```bash
docker compose up -d --build      # serves at http://localhost:3000
```

`package.json` is used only inside the Docker image — Node/npm are not required on the host.

All three pages work when the URLs in `.env` are reachable — local Compose ([apira run-locally.md](https://github.com/KMeltzer24/apira/blob/main/docs/run-locally.md)).

---

## Separation of concerns

Agent Chat and the Recommender follow the same client/server split as the rest of the project: the UI lives here (frontend), and the agent server lives in [apira-agent](https://github.com/KMeltzer24/apira-agent) (backend). The frontend only ever speaks HTTP to its backends; it contains no agent, model, or MCP logic.
