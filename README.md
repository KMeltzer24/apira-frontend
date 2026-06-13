# Apira Frontend

React (Vite) web app for the [Apira](https://github.com/KMeltzer24/apira) backend. Login and portfolio screens call the EC2-hosted User Service and Portfolio Service over HTTP.

The UI runs locally on your Mac. The APIs run on EC2 only — there is no local backend.

**Backend repo:** https://github.com/KMeltzer24/apira

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
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Docker (optional)

```bash
cp .env.example .env   # required — set EC2 URLs
docker compose up -d --build
```
