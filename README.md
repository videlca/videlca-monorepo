# Videlca

Monorepo (npm workspaces + Turborepo):

- `apps/api`: NestJS API under `/api` (Swagger at `/api/docs`). It also serves the SPA.
- `apps/web`: React SPA (Vite + TanStack Router).
- `packages/shared`: DTOs and response types used by both apps.

## Local development

```bash
cp .env.example .env      # fill in values; DB_HOST=localhost
npm install
docker compose up -d db   # only the database in Docker
npm run dev               # shared (watch), api (:3000, watch), web (:5173)
```

Open http://localhost:5173. Vite proxies `/api` to the API on port 3000.

To run the production setup locally: `docker compose up -d --build`, then open `http://localhost:${APP_PORT}`.

## Server deployment

Install Docker Engine with the Compose plugin, clone the repo, and create `.env` from `.env.example` (`ENV=prod`).

```bash
./deploy.sh v1.4.0   # backs up the DB, checks out the tag, builds and restarts
./deploy.sh v1.3.0   # rollback
```

Restore a backup if a rollback crosses a schema change:

```bash
docker compose exec -T db sh -c 'exec mysql -u root -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"' < backups/<file>.sql
```

| Task | Command |
|---|---|
| Status | `docker compose ps` |
| App logs | `docker compose logs -f app` |
| Restart app | `docker compose restart app` |
| Stop everything | `docker compose down` |
| Start everything | `docker compose up -d` |

With `ENV=prod`, TypeORM does not alter the schema. Ship entity changes with their SQL and run it before deploying.
