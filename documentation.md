Project Knowledge — Easy Bookings (Lumen & Light Studio)

Here is the complete documentation of everything built for the photography studio booking application:

---

1. Project Overview & Concept
* App Name: Lumen & Light Studio ("Easy Bookings")
* Purpose: A clean, frictionless web application allowing clients to schedule photography studio sessions, select available calendar slots without double-booking, and review existing appointments on a public schedule.
* Tone & Persona: Warm, high-end editorial, and professional.

---

2. Architecture & Tech Stack

* Framework: TanStack Start v1 (React 19, Vite 7) with full SSR and file-based routing.
* Styling: Tailwind CSS v4 configured purely in CSS (`src/styles.css`) using native `@theme` variables, `tw-animate-css`, and `oklch()` color spaces.
* Data Layer: TanStack Query (`@tanstack/react-query`) for cached async data fetching, automatic query invalidation, and UI synchronization.
* Backend & Database: Lovable Cloud (managed PostgreSQL with built-in Auth & Row Level Security).
* UI Components & Icons: Shadcn-style components with `lucide-react` icons and `sonner` notifications.

---

3. Database Architecture & Schema

Table: `public.bookings`
Defined via SQL migration with a strict composite uniqueness constraint to ensure double-booking prevention at the engine level:

```sql
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_type TEXT NOT NULL CHECK (session_type IN ('portrait', 'family', 'product')),
  booking_date DATE NOT NULL,
  time_slot TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'pending', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT bookings_date_slot_unique UNIQUE (booking_date, time_slot)
);
```

Row Level Security (RLS)
* Status: Enabled (`ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;`).
* Policies:
  * `allow_anon_read` & `allow_auth_read`: Anyone can read bookings (needed to display taken slots on `/` and list sessions on `/schedule`).
  * `allow_anon_insert` & `allow_auth_insert`: Anyone (guest or authenticated) can book a session.
  * Direct updates and deletes are blocked by default until explicit account-ownership policies are introduced.

Concurrency & Collision Handling
* If two users attempt to book the exact same `(booking_date, time_slot)` at the same time, the PostgreSQL constraint violation error code `23505` is caught by `createBooking()` and surfaced in the UI as:  
  "That time slot was just taken — please pick another one."

---

4. User Authentication & Session Management

* Provider: Lovable Cloud email & password authentication (email confirmation required).
* Open Guest Access: Authentication is optional—guests can book sessions immediately without signing up.
* Auth Route (`/auth` — `src/routes/auth.tsx`):
  * Sign in and sign up toggle tabs.
  * Email trimming, password validation (HIBP checked server-side).
   Sign-up flow prompts a "Check your email"* verification screen when email confirmation is active.
* App Shell Integration (`src/routes/__root.tsx`):
  * `supabase.auth.getSession()` sets the initial auth state.
  * `onAuthStateChange` listener updates the user session and invalidates active TanStack queries upon `SIGNED_IN`, `SIGNED_OUT`, or `USER_UPDATED`.
  * Header shows a "Sign in" button for guests, or the User's Email + "Sign out" button for active sessions.

---

5. Application Routes & User Flows

`src/routes/__root.tsx` (Root Layout & App Chrome)
* Header: Studio branding, navigation links, and dynamic auth state.
* Sidebar / Mobile Nav: Dark espresso vertical sidebar on desktop, bottom navigation tab bar on mobile.
* Global Notifications: `<Toaster />` from Sonner mounted at the root.

`src/routes/index.tsx` (Booking Page — `/`)
A three-step interactive flow:
1. Session Selection: Cards for Portrait, Family, and Product sessions with pricing, durations, and descriptions.
2. Date & Time Picker:
   * HTML5 date input bounded between tomorrow (\(D+1\)) and 60 days ahead (\(D+60\)).
   * Interactive slot grid: slots matching existing database bookings for that date are disabled with a line-through style.
3. Client Details & Confirmation:
   * Full name and email inputs.
   * On confirmation, displays a completion card with full details and a button to book another session.

`src/routes/schedule.tsx` (Studio Schedule — `/schedule`)
* Displays all recorded studio bookings sorted chronologically by date and time.
* Shows session type badge, date, time slot, client name, contact email, and confirmed status.

---

6. Business Constants (`src/lib/bookings.ts`)

* Session Types:
  * Portrait: 1 hour | $150 | Individual or couple portraits in natural studio light.
  * Family: 90 minutes | $220 | Group and family sessions up to 6 people.
  * Product: 2 hours | $300 | Styled tabletop or editorial product photography.
* Available Daily Slots: `09:00`, `10:00`, `11:00`, `14:00`, `15:00`, `16:00`.
* Booking Window: Starts tomorrow (\(D+1\)) up to 60 days in advance.

---

7. Design System & CSS Animations (`src/styles.css`)

* Color Palette (oklch tokens):
  * Background: Warm natural cream (`oklch(0.985 0.01 80)`)
  * Foreground: Deep espresso (`oklch(0.2 0.02 50)`)
  * Primary: Rich burnt amber (`oklch(0.55 0.14 45)`)
  * Sidebar: Dark espresso (`oklch(0.18 0.025 50)`) with warm gold active states
* Typography:
  * Display / Headings: `Cormorant Garamond` (classic serif)
  * Body text: `Karla` (clean, readable sans-serif)
* Motion & Animations:
  * `@keyframes fade-up` and `@utility animate-fade-up` using custom cubic-bezier curves.
  * Stagger classes (`stagger-1`, `stagger-2`, `stagger-3`) creating sequential card entrances.

---

Suggested Next Steps

1. Link bookings to user accounts: Add an optional `user_id` column to the `bookings` table so signed-in clients can see a "My Bookings" tab.
2. Booking cancellation & rescheduling: Allow clients to cancel or reschedule existing appointments directly from their dashboard.

Which of these would you like to explore next?