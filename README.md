# Apira Frontend

React (Vite) web app for the [Apira](https://github.com/KMeltzer24/apira) backend. Login and portfolio screens call the User Service and Portfolio Service over HTTP.

Not deployed to EC2. Run locally on your Mac.

**Backend repo:** https://github.com/KMeltzer24/apira

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Backend URLs

By default the app uses `http://localhost:8001` and `http://localhost:8002`. To point at EC2 (or other hosts), copy `.env.example` to `.env` and set:

- `VITE_USER_SERVICE_URL`
- `VITE_PORTFOLIO_SERVICE_URL`

## Docker (optional)

```bash
cp .env.example .env   # set EC2 URLs if backends are not on localhost
docker compose up -d --build
```
