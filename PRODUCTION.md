# Production readiness

This document is the map of everything added to take **Code** from "runs on
a laptop" to "deployable on a real VPS": infrastructure, security,
third-party integrations, backups, and CI/CD. It also draws an honest line
between what's **fully live and verified** in this repository today versus
what's **wired and ready but inert until real credentials are supplied**.

## What's fully live vs. what needs credentials

| Piece | Status |
|---|---|
| Postgres + Prisma migrations | ✅ Live — schema, migrations, `prisma migrate deploy` on container start |
| Redis caching (session validation, VIP catalog) | ✅ Live — verified with cache hits/invalidation on logout/ban |
| JWT auth, Argon2 hashing, rate limiting, CORS, Helmet, input validation | ✅ Live |
| IP ban / user ban (owner dashboard) | ✅ Live |
| Image uploads (`POST /uploads/image`) | ✅ Live end-to-end — verified via the mobile app (avatar, ID document) against the **local-disk fallback**. Swaps to real Cloudflare R2 / AWS S3 the moment `STORAGE_*` env vars are set — no code change needed. |
| Structured logging (`nestjs-pino`) + `/health` | ✅ Live |
| Docker images, docker-compose, docker-compose.prod.yml | ✅ Build-verified (`docker compose config`); full `up` not run in this sandbox (no Docker daemon available here) |
| Nginx reverse proxy + Let's Encrypt template | ✅ Syntax-verified; not run against a live domain (sandbox has no public IP/DNS) |
| Automated Postgres + file backups (systemd timer) | ✅ Script-complete; not run continuously (no long-lived server here) |
| CI (backend/admin/mobile tests) | ✅ Live — runs on every push |
| Deploy workflow (SSH → docker compose) | ⚠️ Wired, fails loudly until `DEPLOY_HOST` / `DEPLOY_USER` / `DEPLOY_SSH_KEY` / `DEPLOY_PATH` repo secrets are set |
| Firebase Cloud Messaging | ⚠️ Backend + mobile registration code complete and exercised (graceful no-op path verified); **no real push delivered** — needs a real Firebase project's service account JSON |
| Agora voice | ⚠️ Backend token endpoint complete; mobile `voiceService` wired into RoomScreen and verified to no-op safely on web; **no real audio has been transmitted** — needs a real Agora App ID/Certificate *and* a native build (see limitation below) |

## Hard limitation: Agora requires a custom dev client

`react-native-agora` ships native iOS/Android code. It cannot run inside
Expo Go or `expo start --web` — there is no way around this short of
switching frameworks. To get real voice transport:

```
npx expo prebuild
eas build --platform android   # or ios
```

Until that's done, `mobile/src/services/voiceService.web.ts` (web) and the
try/catch fallback in `voiceService.native.ts` (Expo Go) keep every voice
call a safe no-op — seat management, chat, gifts, and games are completely
unaffected.

## Environment variables

All backend configuration lives in `backend/.env` (copy from
`backend/.env.example`). Never commit real secrets — the file is
`.gitignore`d.

Key groups:
- **Core**: `DATABASE_URL`, `REDIS_HOST`/`REDIS_PORT`/`REDIS_PASSWORD`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
- **Object storage** (optional — falls back to local disk): `STORAGE_ENDPOINT`, `STORAGE_REGION`, `STORAGE_BUCKET`, `STORAGE_ACCESS_KEY_ID`, `STORAGE_SECRET_ACCESS_KEY`, `STORAGE_PUBLIC_BASE_URL`
- **Push** (optional): `FIREBASE_SERVICE_ACCOUNT_JSON_BASE64` — base64 of the Firebase service account JSON (`base64 -w0 service-account.json`)
- **Voice** (optional): `AGORA_APP_ID`, `AGORA_APP_CERTIFICATE`
- **Domains for TLS**: `API_DOMAIN`, `ADMIN_DOMAIN`, `LETSENCRYPT_EMAIL` (used by `docker-compose.prod.yml` + `deploy/nginx/`)

Mobile reads `EXPO_PUBLIC_API_URL` (backend base URL) and
`EXPO_PUBLIC_AGORA_APP_ID` from its own `.env` (Expo inlines `EXPO_PUBLIC_*`
vars at build time). Admin talks to the backend via a relative `/api/v1`
path, proxied by nginx in production.

## Local development

```
docker compose up -d postgres redis
cd backend && npm install && npx prisma migrate dev && npm run start:dev
cd admin && npm install && npm run dev
cd mobile && npm install && EXPO_OFFLINE=1 npx expo start --web
```

(`EXPO_OFFLINE=1` avoids a network round-trip to Expo's dependency-version
API that can hang in restricted-network sandboxes; it's not needed on a
normal internet connection.)

## Production deployment (VPS)

1. Provision an Ubuntu server, install Docker + Docker Compose.
2. Clone the repo to e.g. `/opt/code`, copy `backend/.env.example` to
   `backend/.env` and fill in real secrets.
3. Point `API_DOMAIN` / `ADMIN_DOMAIN` DNS A records at the server.
4. Run `./deploy/nginx/init-letsencrypt.sh` once (see `deploy/nginx/README.md`).
5. `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build`
6. Enable the backup timer (see `deploy/backup/README.md`).
7. Set the four `DEPLOY_*` GitHub Actions secrets to enable automatic
   deploy-on-push via `.github/workflows/deploy.yml`.

`docker-compose.prod.yml` stops Postgres/Redis from publishing ports to the
host and routes all traffic through nginx, which terminates TLS — the app
containers are never reachable except through the reverse proxy.

## Security posture summary

- Passwords hashed with Argon2; JWT access + refresh tokens, refresh
  rotation, session revocation cascades to a short-TTL Redis cache
  (invalidated synchronously on logout / logout-all / password change / ban)
- `class-validator` whitelist validation on every DTO (rejects unknown
  fields — mitigates mass-assignment)
- Helmet (CSP, standard security headers), global rate limiting
  (`ThrottlerGuard`), CORS enabled
- IP ban + user ban, with an explicit guard against an owner locking
  themselves out of their own admin routes
- Prisma parameterizes all queries (no raw SQL string interpolation
  anywhere in the codebase) — SQL injection is not reachable through normal
  usage
- Object storage keys are prefix-validated (`avatars` / `id-documents` /
  `room-covers`) and never take a client-supplied file path

## What's next if you want to go further

- Real Firebase/Agora/R2 credentials (this repo cannot create third-party
  accounts on your behalf)
- A domain + DNS for Let's Encrypt to issue against
- `expo prebuild` + EAS Build for a custom dev client, to actually exercise
  Agora voice and native push delivery on a physical device
- An external log aggregator (e.g. point `nestjs-pino`'s JSON output at
  Loki/Datadog/CloudWatch) and an uptime monitor hitting `/health`
