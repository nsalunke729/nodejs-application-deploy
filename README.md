# Node.js Fullstack Microservice App

A fullstack microservice Node.js application deployed on **Vercel** with a **GitHub Actions CI/CD pipeline**. Demonstrates a production-grade architecture including REST APIs, PostgreSQL, Redis, Docker, Kubernetes, and Prometheus + Grafana observability — all in a single monorepo.

---

## Architecture

```
GitHub (push to master)
        ↓
GitHub Actions → npm ci → vercel build → vercel deploy --prod
        ↓
Vercel (Serverless)
        ↓
┌──────────────────────────────────┐
│  public/index.html  (Dashboard)  │  ← Static UI
├──────────────────────────────────┤
│  api/users.js                    │  ← Serverless functions
│  api/products.js                 │
│  api/health.js                   │
│  api/metrics.js                  │
└────────────────┬─────────────────┘
                 │
         Neon PostgreSQL (cloud)
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 22, ESM (`"type": "module"`) |
| Framework | Express 5 |
| Database | PostgreSQL (Neon cloud) via `pg` |
| Caching | Redis via `ioredis` |
| Metrics | `prom-client` (Prometheus format) |
| Frontend | Vanilla HTML/CSS/JS (dark-theme dashboard) |
| Testing | Jest + Supertest (8 tests) |
| Containers | Docker + Docker Compose (7 services) |
| Orchestration | Kubernetes manifests (deployments, ingress, StatefulSet) |
| Observability | Prometheus + Grafana (local Docker stack) |
| Deployment | Vercel (serverless) |
| CI/CD | GitHub Actions |

---

## Project Structure

```
├── index.js                        # Express API gateway (local dev)
├── vercel.json                     # Vercel routing rules
├── package.json
├── Dockerfile
├── docker-compose.yml              # Full local stack (7 services)
│
├── api/                            # Vercel serverless functions
│   ├── users.js
│   ├── products.js
│   ├── health.js
│   └── metrics.js
│
├── lib/
│   ├── db.js                       # PostgreSQL pool (singleton, max:2 for serverless)
│   └── metrics.js                  # Prometheus registry + counters/histograms
│
├── public/                         # Static frontend (served by Vercel)
│   ├── index.html                  # Dashboard UI
│   ├── styles.css
│   └── app.js
│
├── db/
│   ├── schema.sql                  # users + products tables
│   ├── seed.sql                    # Sample data
│   └── init.js                     # Node.js DB initializer (no psql CLI needed)
│
├── services/
│   ├── user-service/               # Standalone microservice (port 3001)
│   └── product-service/            # Standalone microservice (port 3002)
│
├── k8s/                            # Kubernetes manifests
│   ├── namespace.yaml
│   ├── postgres.yaml               # StatefulSet + schema ConfigMap
│   ├── redis.yaml
│   ├── user-service.yaml
│   ├── product-service.yaml
│   ├── ingress.yaml                # nginx Ingress (Prefix pathType)
│   └── prometheus.yaml
│
├── observability/
│   ├── prometheus.yml              # Scrape config (api-gateway, user-service, product-service)
│   └── grafana/
│       ├── provisioning/           # Auto-provisions Prometheus datasource
│       └── dashboards/             # app-dashboard.json (HTTP reqs, p99 latency, memory)
│
├── tests/
│   └── app.test.js                 # 8 Jest tests (all passing)
│
└── .github/
    └── workflows/deploy.yml        # CI/CD: test → build → deploy to Vercel
```

---

## Getting Started

### Prerequisites

- Node.js 22+
- npm
- Docker Desktop (for local observability stack)

### Install dependencies

```bash
npm ci
```

### Set up environment variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required variables:

```
DATABASE_URL=postgresql://...        # Neon connection string
POSTGRES_DB=mydb
POSTGRES_USER=myuser
POSTGRES_PASSWORD=secret
REDIS_URL=redis://localhost:6379
GF_SECURITY_ADMIN_USER=admin
GF_SECURITY_ADMIN_PASSWORD=admin
```

### Initialize the database

```bash
npm run db:init        # create tables
npm run db:seed        # (optional) insert sample data
```

### Run locally

```bash
npm start              # http://localhost:8080
npm run dev            # with --watch (auto-reload)
```

---

## API Endpoints

### Gateway / Local

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/` | Hello message |
| GET | `/health` | Service health + uptime |
| GET | `/metrics` | Prometheus metrics |
| GET | `/api/users` | List users |
| GET | `/api/users/:id` | Get user by ID |
| POST | `/api/users` | Create user `{ name, role }` |

### Vercel Serverless (`api/`)

| Method | Route | Description |
|--------|-------|-------------|
| GET/POST | `/api/users` | Users CRUD (PostgreSQL) |
| GET/POST | `/api/products` | Products CRUD (PostgreSQL) |
| GET | `/api/health` | Health check |
| GET | `/api/metrics` | Prometheus metrics |

---

## Testing

```bash
npm test
```

8 tests covering all Express routes (GET /, GET /health, GET /api/users, GET /api/users/:id, POST /api/users, unknown routes).

---

## Docker (Local Stack)

Runs all 7 services: PostgreSQL, Redis, user-service, product-service, api-gateway, Prometheus, Grafana.

```bash
docker-compose up -d
```

| Service | URL |
|---------|-----|
| API Gateway | http://localhost:8081 |
| User Service | http://localhost:3001 |
| Product Service | http://localhost:3002 |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3000 |

Grafana login uses `GF_SECURITY_ADMIN_USER` / `GF_SECURITY_ADMIN_PASSWORD` from `.env`.

---

## Observability

Prometheus scrapes `/metrics` from all three services every 15s. Grafana auto-provisions the Prometheus datasource and loads `app-dashboard.json` which includes:

- HTTP requests/sec per service
- p99 request latency
- RSS memory usage

To view: start the Docker stack and open **http://localhost:3000 → Dashboards → Node App Dashboard**.

---

## Kubernetes

Apply all manifests to a running cluster:

```bash
kubectl apply -f k8s/
```

Includes: namespace, PostgreSQL StatefulSet (with schema auto-init), Redis, user-service and product-service Deployments, nginx Ingress, Prometheus.

---

## Deployment

Pushes to `master` automatically deploy to Vercel via GitHub Actions.

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `VERCEL_TOKEN` | Vercel API token |
| `VERCEL_ORG_ID` | Vercel organization ID |
| `VERCEL_PROJECT_ID` | Vercel project ID |

### Required Vercel Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon PostgreSQL connection string |

### What vs where

| Feature | Vercel | Local Docker | Kubernetes |
|---------|:------:|:------------:|:----------:|
| Dashboard UI | ✅ | ✅ | ✅ |
| REST API | ✅ | ✅ | ✅ |
| PostgreSQL | ✅ Neon | ✅ | ✅ StatefulSet |
| Redis | — | ✅ | ✅ |
| Prometheus | — | ✅ | ✅ |
| Grafana | — | ✅ | ✅ |
