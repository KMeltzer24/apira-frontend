# Apira Frontend

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://docs.docker.com/compose/)

React UI for Apira (**Portfolio**, **Agent Chat**, **Stock Recommender**). Chat goes to the LangGraph supervisor; MCP/RAG stay on the agent side.

Apira is four repos. **Clone + run order:** [apira README](https://github.com/KMeltzer24/apira). Start this repo last.

## Talks to

| Env | Service |
|-----|---------|
| `VITE_USER_SERVICE_URL` | [apira](https://github.com/KMeltzer24/apira) `:8001` |
| `VITE_PORTFOLIO_SERVICE_URL` | [apira](https://github.com/KMeltzer24/apira) `:8002` |
| `VITE_AGENT_URL` | [apira-agent](https://github.com/KMeltzer24/apira-agent) `:8100` |
| `VITE_LOG_SERVICE_URL` | [apira](https://github.com/KMeltzer24/apira) `:8300` |

Does not call [apira-rag](https://github.com/KMeltzer24/apira-rag). MCP is used by the agent.

Vite bakes `VITE_*` at image build time. After changing `.env`, rebuild the container.

## Run

Need [Docker Desktop](https://www.docker.com/products/docker-desktop/). Start backend, rag, and agent first.

```bash
git clone https://github.com/KMeltzer24/apira-frontend.git
cd apira-frontend
cp .env.example .env
docker compose up -d --build
```

Open [http://localhost:3000](http://localhost:3000). Seed login: `alice` / `password`.

Or with Node 20: `npm ci && npm run dev`.
