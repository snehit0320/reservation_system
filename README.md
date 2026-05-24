# Allo Inventory

A full-stack inventory reservation system built with **Next.js**, **PostgreSQL**, and **Prisma**. Users browse products across multiple warehouses, reserve stock with a time-limited hold, then confirm or cancel the purchase.

Live demo: deploy to [Vercel](https://vercel.com) with a PostgreSQL database (Neon, Supabase, or similar).

## Features

- **Product catalog** — Products grouped by name with per-warehouse stock (available, reserved, total)
- **Reserve stock** — Atomic holds prevent overselling when multiple users reserve the last unit
- **Checkout flow** — 10-minute countdown, confirm purchase, or cancel and release stock
- **Automatic expiry** — Unconfirmed reservations release stock after `expiresAt`
- **Clear errors** — HTTP **409** (not enough stock) and **410** (reservation expired) surfaced in the UI
- **Out-of-stock state** — Warehouses with zero available stock are labeled and cannot be reserved

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS |
| Backend | Next.js Route Handlers |
| Database | PostgreSQL |
| ORM | Prisma |
| Validation | Zod |

## Prerequisites

- Node.js 20+
- PostgreSQL database

## Setup

1. **Clone and install**

   ```bash
   git clone https://github.com/snehit0320/reservation_system.git
   cd reservation_system
   npm install
   ```

2. **Environment variables**

   Create a `.env` file in the project root:

   ```env
   DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE"
   ```

   For production on Vercel, also set:

   ```env
   CRON_SECRET="your-random-secret"
   ```

3. **Database**

   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```

   The seed adds 12 sample products across Chennai, Bangalore, and Mumbai warehouses. Re-running the seed is safe—it only inserts missing rows.

4. **Run locally**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## How it works

### Stock model

Each product–warehouse pair is an `Inventory` row:

- `totalStock` — units on hand  
- `reservedStock` — units held by pending reservations  
- **Available** = `totalStock - reservedStock`

### Reservation lifecycle

1. **Reserve** (`POST /api/reservation`) — Increments `reservedStock` inside a transaction. If stock is insufficient, returns **409**.
2. **Confirm** (`POST /api/reservation/:id/confirm`) — Sets status to `CONFIRMED`.
3. **Cancel** (`POST /api/reservation/:id/release`) — Decrements `reservedStock`, sets status to `RELEASED`.
4. **Expire** — Pending reservations past `expiresAt` are released automatically (see below).

### Concurrency

When two users try to reserve the last unit, only one succeeds. The reserve endpoint uses a conditional `updateMany` so the database applies at most one hold:

```text
reservedStock <= totalStock - quantity
```

The second request gets **409 Not enough stock**.

## Reservation expiry

Expired pending reservations must return stock to the available pool. This project uses two mechanisms:

### 1. Lazy cleanup on read (primary)

Runs before key API calls via `src/lib/release-reservation.ts`:

- `GET /api/products`
- `GET /api/reservation/:id`
- `POST /api/reservation`
- `POST /api/reservation/:id/confirm`

### 2. Vercel Cron (background, optional)

Once per day (02:00 UTC), `GET /api/cron/expire-reservations` releases all expired reservations. Configured in `vercel.json`.

**Vercel Hobby** only allows cron jobs to run **once per day**; more frequent schedules require Pro. **Lazy cleanup** (above) still releases expired stock whenever users load products or reservations.

In production, set `CRON_SECRET`; Vercel sends `Authorization: Bearer <CRON_SECRET>`.

## API reference

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/products` | List inventory with stock per warehouse |
| `POST` | `/api/reservation` | Create reservation `{ inventoryId, quantity }` |
| `GET` | `/api/reservation/:id` | Get reservation details |
| `POST` | `/api/reservation/:id/confirm` | Confirm purchase |
| `POST` | `/api/reservation/:id/release` | Cancel and release stock |
| `GET` | `/api/cron/expire-reservations` | Bulk-expire reservations (cron) |

### Error codes

| Status | Meaning |
|--------|---------|
| `409` | Not enough stock |
| `410` | Reservation expired |
| `404` | Inventory or reservation not found |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `npm run lint` | ESLint |
| `npx prisma db seed` | Load sample products |
| `npx prisma studio` | Open database GUI |

## Project structure

```text
src/
├── app/
│   ├── page.tsx                 # Product listing
│   ├── reservation/[id]/page.tsx # Checkout
│   └── api/                     # REST endpoints
├── components/ui.tsx            # Shared UI (header, cards, buttons)
└── lib/
    ├── prisma.ts
    ├── api-errors.ts
    └── release-reservation.ts   # Release & expiry logic
prisma/
├── schema.prisma
└── seed.ts
```

## Deploying to Vercel

1. Push the repo to GitHub.
2. Import the project in Vercel.
3. Add `DATABASE_URL` and `CRON_SECRET` environment variables.
4. Run migrations against the production database (`npx prisma migrate deploy`).
5. Seed optional: `npx prisma db seed`.

## License

MIT
