# Allo Inventory

A full-stack inventory reservation system built with **Next.js**, **PostgreSQL (Supabase)**, and **Prisma**. Browse products by warehouse, reserve stock with a 10-minute hold, then confirm or cancel the purchase.

**Live app:** [https://reservation-system-snowy-alpha.vercel.app/](https://reservation-system-snowy-alpha.vercel.app/)

**Repository:** [github.com/snehit0320/reservation_system](https://github.com/snehit0320/reservation_system)

## Try it

1. Open the [live demo](https://reservation-system-snowy-alpha.vercel.app/).
2. Pick a product and warehouse, then click **Reserve**.
3. On checkout, use **Confirm purchase** or **Cancel** before the timer ends.
4. After confirm/cancel, use **Products** in the nav to return to the catalog.

Low-stock items (e.g. PlayStation 5) are useful for testing **409 Not enough stock** when inventory runs out.

## Features

- **Product catalog** — Products grouped by name with per-warehouse stock (available, reserved, total)
- **Reserve stock** — Atomic holds prevent overselling when multiple users reserve the last unit
- **Checkout flow** — 10-minute countdown, confirm purchase, or cancel and release stock
- **Automatic expiry** — Unconfirmed reservations release stock after `expiresAt` (lazy cleanup on API reads)
- **Clear errors** — HTTP **409** (not enough stock) and **410** (reservation expired) shown in the UI
- **Out-of-stock state** — Warehouses with zero available stock are labeled and cannot be reserved

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS |
| Backend | Next.js Route Handlers |
| Hosting | [Vercel](https://vercel.com) |
| Database | [Supabase](https://supabase.com) (PostgreSQL) |
| ORM | Prisma |
| Validation | Zod |

## Prerequisites

- Node.js 20+
- Supabase (or any hosted PostgreSQL) project

## Local setup

1. **Clone and install**

   ```bash
   git clone https://github.com/snehit0320/reservation_system.git
   cd reservation_system
   npm install
   ```

2. **Environment variables**

   Create `.env` in the project root (see Supabase → **Settings → Database**):

   ```env
   # Transaction pooler (port 6543) — used by the app
   DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"

   # Direct connection (port 5432) — used by prisma db push locally
   DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
   ```

   Encode special characters in the password (e.g. `@` → `%40`).

3. **Database**

   ```bash
   npx prisma db push
   npx prisma db seed
   ```

   The seed adds 12 sample products across Chennai, Bangalore, and Mumbai. Re-running the seed is safe—it only inserts missing rows.

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
4. **Expire** — Pending reservations past `expiresAt` are released when products or reservations are loaded (lazy cleanup).

### Concurrency

When two users try to reserve the last unit, only one succeeds. The reserve endpoint uses a conditional `updateMany`:

```text
reservedStock <= totalStock - quantity
```

The second request gets **409 Not enough stock**.

## Reservation expiry

Expired pending reservations return stock to the available pool via **lazy cleanup** in `src/lib/release-reservation.ts`, triggered before:

- `GET /api/products`
- `GET /api/reservation/:id`
- `POST /api/reservation`
- `POST /api/reservation/:id/confirm`

Optional: `GET /api/cron/expire-reservations` for bulk expiry (set `CRON_SECRET` if you protect the route). The production deployment on Vercel Hobby does not use a cron schedule; lazy cleanup is sufficient for normal traffic.

## API reference

Base URL locally: `http://localhost:3000` · Production: `https://reservation-system-snowy-alpha.vercel.app`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/products` | List inventory with stock per warehouse |
| `POST` | `/api/reservation` | Create reservation `{ inventoryId, quantity }` |
| `GET` | `/api/reservation/:id` | Get reservation details |
| `POST` | `/api/reservation/:id/confirm` | Confirm purchase |
| `POST` | `/api/reservation/:id/release` | Cancel and release stock |
| `GET` | `/api/cron/expire-reservations` | Bulk-expire reservations (optional) |

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
| `npm run build` | Production build (`prisma generate` + Next.js) |
| `npm run start` | Run production server |
| `npm run lint` | ESLint |
| `npx prisma db push` | Apply schema to the database |
| `npx prisma db seed` | Load sample products |
| `npx prisma studio` | Open database GUI |

## Project structure

```text
src/
├── app/
│   ├── page.tsx                  # Product listing
│   ├── reservation/[id]/page.tsx # Checkout
│   └── api/                      # REST endpoints
├── components/ui.tsx             # Shared UI (header, cards, buttons)
└── lib/
    ├── prisma.ts
    ├── api-errors.ts
    └── release-reservation.ts    # Release & expiry logic
prisma/
├── schema.prisma
└── seed.ts
```

## Deployment (Vercel + Supabase)

Production is hosted on **Vercel** with **Supabase** as Postgres.

1. Import [reservation_system](https://github.com/snehit0320/reservation_system) on Vercel.
2. Set environment variables:
   - `DATABASE_URL` — Supabase **Transaction pooler** URI (port `6543`, `?pgbouncer=true`)
   - `DIRECT_URL` — Supabase **direct** URI (port `5432`) for Prisma tooling
3. Run `npx prisma db push` and `npx prisma db seed` against the same Supabase database.
4. Deploy; the app builds with `prisma generate && next build`.

**Production URL:** [https://reservation-system-snowy-alpha.vercel.app/](https://reservation-system-snowy-alpha.vercel.app/)

## License

MIT
