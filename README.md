# Node.js Application Deploy

A simple Express.js API application with test coverage and deployment-ready configuration for Docker and Vercel.

## Features

- REST API built with Express 5
- Health check endpoint
- User list and user creation endpoints
- Jest + Supertest test suite
- ESLint configuration
- Docker and Docker Compose support
- GitHub Actions workflows for linting, testing, security checks, and deployment

## Tech Stack

- Node.js
- Express
- Jest
- Supertest
- ESLint

## Project Structure

```text
.
├── index.js
├── tests/
│   └── app.test.js
├── Dockerfile
├── docker-compose.yml
├── vercel.json
└── .github/workflows/
```

## Getting Started

### Prerequisites

- Node.js 22+
- npm

### Install Dependencies

```bash
npm ci
```

### Run Locally

```bash
npm start
```

The app runs on `http://localhost:8080` by default.

## API Endpoints

### `GET /`
Returns:

```json
{ "message": "Hello, from the server!" }
```

### `GET /health`
Returns:

```json
{ "status": "ok", "uptime": 123.45 }
```

### `GET /api/users`
Returns a list of users.

### `GET /api/users/:id`
- `200` with user when found
- `404` when user is not found

### `POST /api/users`
Request body:

```json
{ "name": "Charlie", "role": "user" }
```

- `201` when valid
- `400` when `name` or `role` is missing

## Testing

Run tests with:

```bash
npm test
```

## Linting

Run lint checks with:

```bash
npx eslint . --ext .js,.ts
```

## Docker

### Build and Run with Docker Compose

```bash
docker compose up --build
```

The app will be available at `http://localhost:8080`.

## Deployment

This repository includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that deploys to Vercel on pushes to the `master` branch.

Required repository secrets:

- `VERCEL_TOKEN`

Depending on your Vercel setup, you may also need:

- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
