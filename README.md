# Apira Frontend

React (Vite) web app for the [Apira](https://github.com/KMeltzer24/apira) backend. Three pages:

- **Portfolio** — login + holdings via user-service and portfolio-service on `localhost`.
- **Agent Chat** — talks to [apira-agent](https://github.com/KMeltzer24/apira-agent) (LangGraph supervisor + specialists) on port 8100.
- **Recommender** — same agent API; choose **local folder** or **vector DB (pgvector)**.

Runs on your Mac in Docker. Point `.env` at local backends ([apira run-locally.md](https://github.com/KMeltzer24/apira/blob/main/docs/run-locally.md)).

**How it works:** [docs/how-the-frontend-works.md](docs/how-the-frontend-works.md) — the three pages and how each talks to its server.

**Backend repo:** https://github.com/KMeltzer24/apira

**MCP servers:** [apira-mcp](https://github.com/KMeltzer24/apira-mcp) provides backend tools and [apira-rag](https://github.com/KMeltzer24/apira-rag) provides research tools. The frontend talks only to the agent/backend APIs.

**Agent (separate repo):** [apira-agent](https://github.com/KMeltzer24/apira-agent) — LangGraph supervisor graph; powers Agent Chat and Recommender. Both tabs `POST /chat`; the supervisor routes to specialists.

**Logging contract:** [apira/docs/logging.md](https://github.com/KMeltzer24/apira/blob/main/docs/logging.md) — browser JSON events and end-to-end `X-Request-ID` correlation.
**How it works / logging:** [how-logging-works.md](https://github.com/KMeltzer24/apira/blob/main/docs/how-logging-works.md) · [grafana-cloud.md](https://github.com/KMeltzer24/apira/blob/main/docs/grafana-cloud.md).

## Setup

```bash
cp .env.example .env
```

Copy `.env.example` to `.env`. For local backends use `localhost` (see [apira run-locally.md](https://github.com/KMeltzer24/apira/blob/main/docs/run-locally.md)). Rebuild after changing `VITE_*`.

Browser logs go to `VITE_LOG_SERVICE_URL` (`:8300`) → Grafana Cloud Loki.

## Run

```bash
docker compose up -d --build
```

Open [http://localhost:3000](http://localhost:3000).

## Useful commands

```bash
docker compose ps          # status
docker compose logs -f     # live logs
docker compose down        # stop
npm test                   # logging utility tests
npm run lint               # lint source and tests
```

After changing `.env`, rebuild and restart:

```bash
docker compose up -d --build
```

`package.json` is used inside the Docker image only — you do not need Node or npm installed on your Mac.
