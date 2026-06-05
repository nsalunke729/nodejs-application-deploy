# node-app-deploy-git-action

A production-grade fullstack microservices application built with Node.js and React, deployed on Vercel with a GitHub Actions CI/CD pipeline. Demonstrates a cloud-native architecture spanning serverless functions, containerised microservices, Kubernetes orchestration, and full observability — all in a single monorepo.

**Live demo:** [nodejs-application-deploy.vercel.app](https://nodejs-application-deploy.vercel.app)

---

## Architecture Overview

```
GitHub (push to master)
        │
        ▼
GitHub Actions (.github/workflows/deploy.yml)
  ├── npm ci
  ├── Run tests (Jest + Supertest)
  ├── vercel build
  └── vercel deploy --prod
        │
        ▼
Vercel (Serverless)
  ├── public/          → Static React frontend (Vite build)
  └── api/             → Serverless functions (users, products, orders, health, metrics)
        │
        ▼
Neon PostgreSQL (cloud-managed)
```

For local development and Kubernetes, the full stack runs as 7 containerised services:

```
api-gateway:8080  ──▶  user-service:3001
                  ──▶  product-service:3002
                  ──▶  postgres:5432
                  ──▶  redis:6379

prometheus:9090   ──scrapes──▶  all three services (/metrics)
grafana:3000      ──reads───▶   prometheus
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 22, ESM (`"type": "module"`) |
| Backend framework | Express 5 |
| Frontend | React 18, Vite, Tailwind CSS |
| Database | PostgreSQL via Neon (cloud) / Docker (local) |
| Caching | Redis (Docker/K8s; declared, ready to wire) |
| Metrics | `prom-client` — HTTP counters, histograms, memory |
| Observability | Prometheus + Grafana (local Docker stack) |
| Containers | Docker + Docker Compose (7 services) |
| Orchestration | Kubernetes manifests (deployments, ingress, StatefulSet) |
| Deployment | Vercel (serverless) |
| CI/CD | GitHub Actions |
| Analytics | Vercel Analytics |
| Testing | Jest + Supertest (8 tests, all passing) |
| Code quality | ESLint, automated peer review agent, Lighthouse CI |

---

## Project Structure

```
├── index.js                    # Express API gateway (local dev entry point)
├── vercel.json                 # Vercel routing rules
├── package.json
├── Dockerfile                  # Container image for api-gateway
├── docker-compose.yml          # Full local stack (7 services)
│
├── api/                        # Vercel serverless functions
│   ├── users.js                # GET/POST /api/users
│   ├── products.js             # GET/POST /api/products (with bulk import)
│   ├── orders.js               # GET/POST /api/orders (transactional)
│   ├── health.js               # GET /api/health
│   └── metrics.js              # GET /api/metrics (Prometheus format)
│
├── lib/
│   ├── db.js                   # PostgreSQL pool singleton (max:2 for serverless)
│   └── metrics.js              # Prometheus registry — counters, histograms
│
├── frontend/                   # React + Vite application
│   ├── src/
│   │   ├── App.jsx
│   │   ├── pages/
│   │   │   ├── Marketplace.jsx  # Product browse + search
│   │   │   ├── CartPage.jsx     # Cart + order placement
│   │   │   ├── OrdersPage.jsx   # Order history
│   │   │   └── AdminPage.jsx    # Bulk product import (Excel/CSV)
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   └── ProductCard.jsx
│   │   └── context/
│   │       └── CartContext.jsx  # useReducer cart state management
│   └── package.json
│
├── public/                     # Legacy vanilla dashboard (served by Vercel)
│   ├── index.html
│   ├── styles.css
│   └── app.js
│
├── db/
│   ├── schema.sql              # users, products, orders, order_items + indexes
│   ├── seed.sql                # Sample data
│   └── init.js                 # Node.js DB initialiser (no psql CLI needed)
│
├── services/
│   ├── user-service/           # Standalone Node.js microservice (port 3001)
│   └── product-service/        # Standalone Node.js microservice (port 3002)
│
├── k8s/
│   ├── namespace.yaml
│   ├── postgres.yaml           # StatefulSet + schema ConfigMap + PVC
│   ├── redis.yaml
│   ├── user-service.yaml       # Deployment with health/readiness probes
│   ├── product-service.yaml    # Deployment with resource limits + Prometheus annotations
│   ├── ingress.yaml            # nginx Ingress (Prefix pathType)
│   └── prometheus.yaml         # Deployment with K8s service discovery
│
├── observability/
│   ├── prometheus.yml          # Scrape config for all 3 services
│   └── grafana/
│       ├── provisioning/       # Auto-wires Prometheus datasource on startup
│       └── dashboards/         # app-dashboard.json (HTTP req/s, p99 latency, RSS memory)
│
├── tests/
│   └── app.test.js             # 8 Jest/Supertest integration tests
│
└── .github/
    └── workflows/
        ├── deploy.yml          # Main CI/CD: push to master → test → build → deploy
        ├── test.yml            # Run tests on all pushes and PRs
        ├── lint.yml            # ESLint on all pushes and PRs
        ├── security.yml        # npm audit (scheduled weekly + on push)
        ├── lighthouse.yml      # Lighthouse CI after successful deploy
        ├── peer-review-agent.yml  # Automated diff summary on every push
        └── claude.yml.disabled    # Claude Code agent (issue-driven, currently disabled)
```

---

## Getting Started

### Prerequisites

- Node.js 22+
- Docker Desktop (for local observability stack)
- A [Neon](https://neon.tech) PostgreSQL database (free tier works)

### Install and run

```bash
# Install root dependencies
npm ci

# Copy environment variables
cp .env.example .env
# Edit .env — add your DATABASE_URL from Neon

# Initialise the database schema
npm run db:init

# (Optional) Seed sample data
npm run db:seed

# Start the API gateway locally
npm start            # http://localhost:8080
npm run dev          # with --watch auto-reload

# Start the React frontend (separate terminal)
npm run dev:frontend # http://localhost:5173
```

### Run tests

```bash
npm test
```

8 tests covering all Express routes: GET /, GET /health, GET/POST /api/users, GET /api/users/:id, POST /api/users (validation), and 404 handling.

---

## API Reference

### Vercel Serverless (live)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Service health + uptime |
| GET | `/api/metrics` | Prometheus metrics |
| GET | `/api/users` | List users |
| POST | `/api/users` | Create user `{ name, email }` |
| GET | `/api/products` | List products |
| POST | `/api/products` | Create product or bulk import `{ products: [...] }` |
| GET | `/api/orders` | List orders with items (JOIN) |
| POST | `/api/orders` | Place order `{ userId, items: [{ productId, quantity }] }` |

Orders use a database transaction — stock is decremented atomically, the order rolls back if any product is out of stock or not found.

### Local Express gateway

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Hello message |
| GET | `/health` | Uptime check |
| GET | `/metrics` | Prometheus metrics |
| GET | `/api/users` | Users (static, for testing) |
| GET | `/api/users/:id` | User by ID |
| POST | `/api/users` | Create user |

---

## Docker (Full Local Stack)

```bash
docker-compose up -d
```

| Service | URL |
|---|---|
| API Gateway | http://localhost:8081 |
| User Service | http://localhost:3001 |
| Product Service | http://localhost:3002 |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3000 |

Grafana credentials come from `.env` (`GF_SECURITY_ADMIN_USER` / `GF_SECURITY_ADMIN_PASSWORD`). The Prometheus datasource and dashboard auto-provision on first start.

---

## Kubernetes

```bash
kubectl apply -f k8s/
```

Applies in dependency order. Includes:

- `node-app` namespace
- PostgreSQL StatefulSet with schema auto-init via ConfigMap
- Redis Deployment
- user-service and product-service Deployments with readiness/liveness probes and resource limits
- nginx Ingress routing `/users` → user-service, `/products` → product-service
- Prometheus with K8s pod annotation-based service discovery

---

## Observability

Prometheus scrapes `/metrics` from api-gateway, user-service, and product-service every 15 seconds. Each service exposes:

- `http_requests_total` — counter by method, route, status code
- `http_request_duration_seconds` — histogram with p50/p95/p99 buckets
- `db_query_duration_seconds` — histogram by operation
- Default Node.js process metrics (RSS memory, event loop lag, GC)

The Grafana dashboard (`observability/grafana/dashboards/app-dashboard.json`) includes:
- HTTP requests/sec per service
- p99 request latency
- Process RSS memory

---

## CI/CD Workflows

| Workflow | Trigger | What it does |
|---|---|---|
| `deploy.yml` | Push to `master` | npm ci → vercel build → vercel deploy --prod |
| `test.yml` | Push, PR | Run Jest test suite |
| `lint.yml` | Push, PR | Run ESLint |
| `security.yml` | Push + weekly | npm audit (moderate+ severity) |
| `lighthouse.yml` | After deploy | Lighthouse CI performance audit |
| `peer-review-agent.yml` | Push | Auto-generates diff summary with risk file detection |

---

## What's Live vs Local-Only

| Feature | Vercel | Docker | Kubernetes |
|---|:---:|:---:|:---:|
| React Frontend | ✅ | ✅ | ✅ |
| REST API | ✅ | ✅ | ✅ |
| PostgreSQL | ✅ Neon | ✅ | ✅ StatefulSet |
| Redis | — | ✅ | ✅ |
| Prometheus | — | ✅ | ✅ |
| Grafana | — | ✅ | — |

Redis is declared in the infrastructure layer (Docker Compose, K8s manifests) and ready to connect. Application-level caching integration is the next iteration.

---

## Design Decisions

**Why monorepo?** Single source of truth for pipeline config, shared schema definitions, and consistent versioning across services. The tradeoff is a slightly more complex build config — handled by Vite's `outDir` pointing to `../public`.

**Why both Vercel serverless and Kubernetes?** Different deployment targets suit different contexts. Vercel is zero-infrastructure for cloud; K8s is the pattern for enterprise/on-prem. Rather than choose one, the codebase supports both. The same SQL schema, same API contracts, same observability instrumentation.

**Why PostgreSQL pool max:2 for serverless?** Serverless functions can spawn many concurrent instances. Without a low connection cap, connection exhaustion on the DB is a real risk. Neon's connection pooler helps, but the app-level cap is an additional safety valve.

**Why prom-client in serverless?** The `/metrics` endpoint works in Vercel's serverless context — metrics reset per cold start, which means they aren't suitable for long-running scraping. The endpoint is primarily useful in the Docker/K8s environment. It's included in the serverless path for completeness and local parity.

---

## Built With

- [GitHub Copilot](https://github.com/features/copilot) — code completion and boilerplate
- [Claude Code](https://claude.ai/code) — architecture decisions and reasoning
- [Vercel v0 / deployment agent](https://vercel.com) — deployment configuration
