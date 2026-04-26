# Talent Matcher — Backend

Intelligent Talent Matching Platform backend built with NestJS and Elasticsearch.

## Prerequisites

- [Node.js](https://nodejs.org/) v20+
- [Docker](https://www.docker.com/) (for running Elasticsearch locally)

---

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy the example env file and adjust if needed:

```bash
cp .env.example .env
```

The default `.env` points to `http://localhost:9200` with no auth, which matches the Docker setup below. No changes needed for local dev.

---

## Running Elasticsearch

Elasticsearch runs via Docker. You do not need to install it locally.

### Start

```bash
docker compose up -d
```

This starts a single-node Elasticsearch 8.14 container with security disabled (local dev only). Data is persisted in a Docker volume (`es_data`) so it survives container restarts.

### Stop

```bash
docker compose down
```

### Wipe all data (fresh start)

```bash
docker compose down -v
```

### Check Elasticsearch is up

```bash
curl http://localhost:9200
```

You should see a JSON response with the cluster name and version.

---

## Running the app

### Option A — with Elasticsearch (recommended)

Starts Docker ES in the background then launches NestJS in watch mode:

```bash
npm run dev:withES
```

### Option B — NestJS only (if ES is already running)

```bash
npm run start:dev
```

### Production build

```bash
npm run build
npm run start:prod
```

---

## Startup logs

On a successful boot you will see Elasticsearch confirm the connection:

```
[Elasticsearch] Connected to Elasticsearch 8.14.0 at <node-name>
```

If Elasticsearch is not reachable the app will throw on startup so the problem is visible immediately.

---

## Project structure

```
src/
├── common/
│   ├── config/
│   │   └── elasticsearch.config.ts     # reads env vars for ES connection
│   └── db/
│       ├── elasticsearch.module.ts      # global ES client module
│       ├── elasticsearch-connection.service.ts  # logs connection on boot
│       └── repositories/
│           ├── base.repository.ts       # generic CRUD base class
│           └── example.repository.ts   # example — copy this for new indices
├── modules/                             # feature modules go here (candidates, jobs, …)
└── app.module.ts
docker-compose.yml
.env.example
```

---

## Adding a new index / repository

1. Create your feature folder under `src/modules/<feature>/`.
2. Define a document interface extending `Record<string, unknown>`.
3. Create `<feature>.repository.ts` extending `BaseRepository<YourDocument>` and pass the index name to `super()`.
4. Add domain-specific query methods using `this.search()` or `this.esService` directly.
5. Register the repository as a provider in your feature module.

See `src/common/db/repositories/example.repository.ts` for a complete example.

---

## npm scripts

| Script | Description |
|---|---|
| `npm run dev:withES` | Start ES via Docker then NestJS in watch mode |
| `npm run dev:stop` | Stop the ES Docker container |
| `npm run start:dev` | NestJS watch mode only (ES must already be running) |
| `npm run build` | Compile TypeScript |
| `npm run start:prod` | Run compiled production build |
| `npm run test` | Unit tests |
| `npm run test:e2e` | End-to-end tests |
| `npm run lint` | Lint and auto-fix |
