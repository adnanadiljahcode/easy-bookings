# Project Knowledge — Lumen & Light Studio

## What this app is

A booking app for a photography studio called **Lumen & Light Studio**. Clients book a photography session online: they pick a session type, choose a date and an available time slot, enter their name and email, and confirm. All bookings are stored in the Lovable Cloud database and shown on a schedule page.

Tone: warm, professional.

## Pages

### Booking page (`/` — src/routes/index.tsx)

A three-step booking flow:

1. **Session type** — three cards: Portrait, Family, Product. Each shows an icon, description, duration, and price.
2. **Date & time** — a date picker (tomorrow through 60 days out) plus a grid of time slots. Slots already booked for the selected date are disabled and struck through.
3. **Your details** — full name and email form, then a "Confirm booking" button.

On success, a confirmation screen shows the booked session type, date, time, and email, with a "Book another session" button. Double-booking the same slot shows a friendly error ("That time slot was just taken").

### Schedule page (`/schedule` — src/routes/schedule.tsx)

Lists all bookings from the database, ordered by date and time, with session type, client name, email, and status.

### App shell (src/routes/__root.tsx)

Header with the studio name, a dark espresso sidebar (bottom tab bar on mobile), main content area, and footer. Sections animate in with soft fade-up animations (`animate-fade-up`, `stagger-1/2/3` classes).

## Data model

Single table: `bookings` (in Lovable Cloud / Supabase `public` schema).

| Column | Type | Notes |
|---|---|---|
| id | uuid | primary key, auto-generated |
| session_type | text | `portrait`, `family`, or `product` |
| booking_date | date | the session date |
| time_slot | text | e.g. `09:00` |
| client_name | text | |
| client_email | text | |
| status | text | `confirmed` (default), `pending`, or `cancelled` |
| created_at | timestamptz | auto-set |

Five sample bookings were seeded. A unique constraint on (booking_date, time_slot) prevents double-booking; the app maps constraint violation `23505` to a friendly message.

## Business constants (src/lib/bookings.ts)

- **Session types:**
  - Portrait — 1 hour — $150 — individual or couple portraits in natural studio light
  - Family — 90 minutes — $220 — up to 6 people
  - Product — 2 hours — $300 — styled product photography
- **Time slots:** 09:00, 10:00, 11:00, 14:00, 15:00, 16:00
- **Booking window:** tomorrow through 60 days ahead

Data access helpers in `src/lib/bookings.ts`:
- `bookingsQueryOptions(date?)` — TanStack Query options fetching bookings (optionally for one date), sorted by date then time.
- `createBooking(input)` — inserts a booking with status `confirmed`.

## Design system (src/styles.css)

- Warm, professional palette defined as semantic tokens (no hardcoded colors in components).
- `font-display` for headings, standard sans for body.
- Reusable animation utilities: `animate-fade-up` with `stagger-1`, `stagger-2`, `stagger-3` delays.

## Technical notes

- **Stack:** TanStack Start v1 (React 19, Vite 7), Tailwind CSS v4 via `src/styles.css`, TanStack Query for data, shadcn-style components, lucide-react icons.
- **Backend:** Lovable Cloud (Supabase). Client imported as `import { supabase } from "@/integrations/supabase/client"` — never edit the auto-generated files under `src/integrations/supabase/`.
- **Routing:** file-based routes in `src/routes/`; never edit `src/routeTree.gen.ts`. Each content route has its own `head()` with unique title/description/og metadata.
- **Auth:** none — booking is guest checkout; the bookings table is publicly readable/writable via RLS policies.
- **Server middleware:** `src/start.ts` registers `attachSupabaseAuth` function middleware and CSRF protection — preserve these.

## Verified

The full flow was tested end-to-end in a browser: booking a Family session as a test client and confirming it appeared on the Schedule page.
