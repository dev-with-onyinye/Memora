# Memora Backend

NestJS + Prisma + PostgreSQL backend for Memora. Implements the API contract shared with the
React Native mobile client — see `POST/GET /sync/:resource` for the offline delta-sync endpoints
the mobile app relies on (last-write-wins by `updatedAt`, soft deletes only via `deletedAt`).

All routes are served under the `/api/v1` prefix. Swagger docs are served separately at
`/api/docs` (not prefixed).

## Prerequisites

- Node.js 20+ (tested with Node 24)
- Docker (for the local PostgreSQL container) — or point `DATABASE_URL` at any Postgres 16 instance

## 1. Install dependencies

```bash
npm install
```

## 2. Configure environment

```bash
cp .env.example .env
```

The defaults in `.env.example` already match `docker-compose.yml`, so you generally don't need to
change anything for local dev. `OPENAI_API_KEY`, `TERMII_API_KEY`, and `WHATSAPP_API_TOKEN` are all
optional — leave them blank to use the built-in stubbed/canned fallbacks (see "Stubbed
integrations" below).

## 3. Start PostgreSQL

```bash
docker compose up -d
```

This starts a `postgres:16` container named `memora-postgres`, exposed on `localhost:5433` (not
the default 5432, to avoid clashing with a native Postgres install some machines already have
running on that port), backed
by the named volume `memora_postgres_data` so data survives container restarts.

## 4. Run migrations

An initial migration (`prisma/migrations/20260810000000_init`) is already checked in, generated
from `prisma/schema.prisma` via `prisma migrate diff` (no live DB was available while building
this backend, so it was produced schema-only and validated, not applied). Apply it with:

```bash
npx prisma migrate dev
```

This applies the checked-in migration against your local Postgres and (re)generates the Prisma
Client. If you change `prisma/schema.prisma` later, running this again will generate and apply a
new migration for the diff.

## 5. Seed demo data

```bash
npm run prisma:seed
```

Creates one demo user, three contacts (a mix of PERSONAL/BUSINESS mode tags), one active
campaign, and two delivery log rows. Demo login (phone-only, no password — see "Auth" below):

- **phone:** `+2348000000000`

The seed script is safely re-runnable (it upserts the user and replaces that user's
contacts/campaigns/delivery logs each time).

## 6. Start the dev server

```bash
npm run start:dev
```

The API is now available at `http://localhost:3000/api/v1`, and interactive Swagger docs at
`http://localhost:3000/api/docs`. Click "Authorize" in Swagger and paste an `accessToken` from
`/auth/login` (or `/auth/register`) to call authenticated routes.

## Other useful commands

```bash
npm run build          # nest build -> dist/
npx tsc --noEmit        # type-check only
npx prisma studio       # visual DB browser
npx prisma validate     # validate schema.prisma
```

## Project structure

```
backend/
├── docker-compose.yml        # postgres:16 with a named volume
├── .env.example
├── prisma/
│   ├── schema.prisma          # User, ConsentSettings, Contact, Campaign, DeliveryLog + enums
│   └── seed.ts                # demo user/contacts/campaign/delivery logs
└── src/
    ├── main.ts                 # global prefix /api/v1, ValidationPipe, Swagger at /api/docs
    ├── app.module.ts            # wires modules + global JwtAuthGuard
    ├── prisma/                  # PrismaService/PrismaModule (global)
    ├── common/                  # @Public(), @CurrentUser(), JwtAuthGuard
    ├── auth/                    # register/login/refresh (passwordless, phone-identity), JWT strategy
    ├── users/                   # GET/PATCH /users/me
    ├── consent/                 # GET/PATCH /consent
    ├── contacts/                # /contacts CRUD + soft delete
    ├── campaigns/                # /campaigns CRUD + soft delete + /:id/activate
    ├── delivery-logs/            # /delivery-logs list/create (+ watermark logic)
    ├── delivery/                 # stubbed Termii SMS + WhatsApp adapters
    ├── ai/                       # /ai/generate-copy (OpenAI-backed with canned fallback)
    └── sync/                     # generic GET/POST /sync/:resource delta-sync module
```

## Auth

Passwordless, phone-identity auth (WhatsApp-style, by design — not a temporary shortcut):

- `POST /auth/register` — body `{ name, phone, country }`. Creates the account and returns
  tokens immediately; there's no separate "verify your account" step. 409s if the phone is
  already registered.
- `POST /auth/login` — body `{ phone }` only. Looks the user up by phone and returns tokens if
  found; 404s if not. **There is no password and no OTP/SMS verification of phone ownership in
  this MVP** — real Termii SMS sending isn't wired up (see "Stubbed integrations" below), so
  whoever submits a given phone number can log into that account. This is an intentional scope
  cut for the MVP, not a bug — see `AuthService`'s class-level comment. Adding real OTP
  verification later would slot in between "phone submitted" and "tokens issued" in both
  `register` and `login` without changing the endpoint shapes.
- `POST /auth/refresh` — unchanged: exchanges a refresh token for a new access+refresh pair.

JWT access + refresh tokens use separate secrets/expirations (see `.env.example`). A global
`JwtAuthGuard` protects every route except the three above (marked with the `@Public()`
decorator). On register, `subscriptionTier` is set to `TRIAL` and `trialEndsAt` to 30 days from
now, matching the PRD's 30-day free trial.

Optional device-level app lock (biometric/PIN) is a **mobile-only, client-side** feature — it
gates opening the app UI, not server auth, so it has no backend representation at all.

## Stubbed integrations

Per the MVP scope, none of these make live third-party calls — they all return a working
canned/no-op result so the rest of the app functions without real API keys:

- **`ai` module** — `POST /ai/generate-copy` calls OpenAI's Chat Completions API only if
  `OPENAI_API_KEY` is set; if it's unset, or the live call fails for any reason, it falls back to
  a canned template generator (`src/ai/adapters/canned-copy-generator.ts`) so the endpoint always
  returns usable copy.
- **`delivery` module** — `TermiiSmsAdapter` and `WhatsAppAdapter`
  (`src/delivery/adapters/*.ts`) implement a shared `DeliveryChannelAdapter` interface and never
  make a live HTTP call in this MVP (regardless of whether an API key is configured) — they log
  and return a simulated success result. Swap the adapter body for a real provider call when
  going live.

## "Sent via Memora" watermark

`DeliveryLog.watermarked` is computed server-side in `DeliveryLogsService.create()`: any user
whose `subscriptionTier` is not `PAID` (i.e. `TRIAL` or `FREE`) gets `watermarked: true`.

## Delta sync contract

`GET /sync/:resource?since=<ISO8601>` (resource is one of `contacts`, `campaigns`,
`delivery-logs`) returns every row for the current user with `updatedAt` greater than `since`
(or all rows if `since` is omitted), **including soft-deleted rows** so the mobile client can
purge them locally. Response: `{ serverTime, data }`.

`POST /sync/:resource` accepts `{ changes: [{ localId, updatedAt, id?, ...resourceFields }] }`.
For each change:
- If `id` is present and matches an existing row owned by the current user, it's an update:
  the incoming `updatedAt` is compared against the stored row's `updatedAt`. If the incoming
  value is newer or equal, the update is applied (`status: 'applied'`); otherwise the stored
  server row wins and is returned unchanged (`status: 'conflict'`) so the client can overwrite
  its local copy.
- Otherwise it's a create: a new row is created (using the client-provided `id` as the primary
  key when present, so a previously-assigned server id is preserved across retries).

Rows are only ever soft-deleted (`deletedAt` set) — never hard-deleted — by both the REST CRUD
`DELETE` routes and by pushing a change with `deletedAt` set.

The mobile client activates campaigns purely by pushing `status: 'ACTIVE'` through
`/sync/campaigns` (it never calls the dedicated `POST /campaigns/:id/activate` route). To keep
that path's scheduling behavior identical to the dedicated endpoint, `SyncService` computes
`nextRunAt` server-side whenever a pushed change sets a campaign's status to `ACTIVE` without
also supplying a non-null `nextRunAt` — mirroring `CampaignsService.activate()` exactly.
