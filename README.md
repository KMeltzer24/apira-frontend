# Apira Frontend

React (Vite) web app for the [Apira](https://github.com/KMeltzer24/apira) backend. Login and portfolio screens call the EC2-hosted User Service and Portfolio Service over HTTP.

Runs on your Mac in Docker. The APIs run on EC2 only — there is no local backend.

**Backend repo:** https://github.com/KMeltzer24/apira

**MCP server (separate repo):** [apira-mcp](https://github.com/KMeltzer24/apira-mcp) — AI tool layer on EC2; this frontend calls the APIs directly and does not use MCP.

## Setup

```bash
cp .env.example .env
```

Edit `.env` and set your EC2 public IP:

```bash
VITE_USER_SERVICE_URL=http://<EC2_PUBLIC_IP>:8001
VITE_PORTFOLIO_SERVICE_URL=http://<EC2_PUBLIC_IP>:8002
```

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
