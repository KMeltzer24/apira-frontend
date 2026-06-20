# How the Frontend Works

A React (Vite) single-page app with two views selected by a top nav bar. Each view is an independent screen that calls a different backend; they share no state.

| View | Purpose | Backend | Transport |
|------|---------|---------|-----------|
| **Portfolio** | Login, then list holdings | EC2 user-service (`:8001`), portfolio-service (`:8002`) | REST/JSON |
| **Agent Chat** | Send a prompt, render the reply | apira-agent API on EC2 (`:8100`) | REST/JSON |

---

## Structure

`src/App.jsx` holds the whole UI. `App` keeps two pieces of state:

- `view` — `'portfolio'` or `'chat'`, toggled by the nav buttons
- `user` — the logged-in user for the Portfolio view (unchanged from the original app)

Components:

| Component | Responsibility |
|-----------|----------------|
| `LoginScreen` | `POST /login`, lift `user_id` to `App` |
| `PortfolioScreen` | `GET /portfolio?user_id=`, render holdings |
| `ChatScreen` | `POST /chat`, render the agent's reply |
| `ConfigError` | Shown if the EC2 service URLs are missing |

## Configuration

Service URLs are injected at build time from `.env` via Vite's `import.meta.env`:

```bash
VITE_USER_SERVICE_URL=http://<EC2_PUBLIC_IP>:8001
VITE_PORTFOLIO_SERVICE_URL=http://<EC2_PUBLIC_IP>:8002
VITE_AGENT_URL=http://<EC2_PUBLIC_IP>:8100
```

All three point at EC2: the agent is deployed there too (it uses the Gemini API, so it needs no local model).

---

## Portfolio view

1. `LoginScreen` submits `POST {VITE_USER_SERVICE_URL}/login` with `{ username, password }`.
2. On `success`, the returned `user_id` is stored in `App` state.
3. `PortfolioScreen` calls `GET {VITE_PORTFOLIO_SERVICE_URL}/portfolio?user_id=<id>` and renders `holdings`.

This is the original flow and is unchanged by the chat feature.

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

The frontend has no knowledge of how the agent produces its answer — it sends text and renders text. The agent (LangGraph + Gemini, calling the MCP tools) lives in [apira-agent](https://github.com/KMeltzer24/apira-agent); this app is just an HTTP client of its `/chat` endpoint.

---

## Running

```bash
docker compose up -d --build      # serves at http://localhost:3000
```

`package.json` is used only inside the Docker image — Node/npm are not required on the host.

Both pages work whenever EC2 is reachable — the portfolio APIs, MCP server, and agent are all deployed there. No local server is required.

---

## Separation of concerns

The chat feature follows the same client/server split as the rest of the project: the UI lives here (frontend), and the agent server lives in [apira-agent](https://github.com/KMeltzer24/apira-agent) (backend). The frontend only ever speaks HTTP to its backends; it contains no agent, model, or MCP logic.
