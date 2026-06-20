# Apira Frontend

React (Vite) web app for the [Apira](https://github.com/KMeltzer24/apira) backend. Two pages:

- **Portfolio** — login + portfolio screens that call the EC2-hosted User Service and Portfolio Service over HTTP.
- **Agent Chat** — an input/output chat box that talks to the [apira-agent](https://github.com/KMeltzer24/apira-agent) API (a LangGraph + Ollama agent). The agent runs locally on your Mac, so this page needs the agent server running.

Runs on your Mac in Docker. The portfolio APIs run on EC2 only — there is no local backend.

**How it works:** [docs/how-the-frontend-works.md](docs/how-the-frontend-works.md) — the two pages and how each talks to its server.

**Backend repo:** https://github.com/KMeltzer24/apira

**MCP server (separate repo):** [apira-mcp](https://github.com/KMeltzer24/apira-mcp) — AI tool layer on EC2; this frontend calls the APIs directly and does not use MCP.

**Agent (separate repo):** [apira-agent](https://github.com/KMeltzer24/apira-agent) — powers the Agent Chat page.

## Setup

```bash
cp .env.example .env
```

Edit `.env` and set your EC2 public IP (and the local agent URL for the chat page):

```bash
VITE_USER_SERVICE_URL=http://<EC2_PUBLIC_IP>:8001
VITE_PORTFOLIO_SERVICE_URL=http://<EC2_PUBLIC_IP>:8002
VITE_AGENT_URL=http://localhost:8100
```

The Agent Chat page only works while the apira-agent server is running locally. The simplest way is `docker compose up -d --build` in the [apira-agent](https://github.com/KMeltzer24/apira-agent) repo (it auto-restarts and reaches host Ollama). The Portfolio page works without it.

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
```

After changing `.env`, rebuild and restart:

```bash
docker compose up -d --build
```

`package.json` is used inside the Docker image only — you do not need Node or npm installed on your Mac.
