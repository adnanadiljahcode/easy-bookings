User authentication

Authentication is handled in `src/routes/auth.tsx` using the Lovable Cloud auth client:

```ts
import { supabase } from "@/integrations/supabase/client";
```

The generated client keeps the user’s login session in browser storage, automatically refreshes it, and sends authentication details with authenticated requests.

Sign up

When the user selects Create an account, the form calls:

```ts
const { data, error } = await supabase.auth.signUp({
  email: email.trim(),
  password,
  options: { emailRedirectTo: window.location.origin },
});
```

What this does:

1. Removes accidental spaces from the email.
2. Creates an account in the managed authentication system.
3. Stores the password securely as a hash; the app never stores plaintext passwords.
4. Sends an account-confirmation email because email confirmation is enabled.
5. If `data.session` is missing, the UI shows the “Check your email” screen.
6. Once confirmed, the user can sign in.

The authentication user records are managed separately from the app’s `bookings` table. This project does not have a custom `profiles` table.

Sign in

When the user selects Sign in, the form calls:

```ts
const { error } = await supabase.auth.signInWithPassword({
  email: email.trim(),
  password,
});
```

If the credentials are valid, the backend returns a session. The code then shows a success message and redirects to the booking page:

```ts
toast.success("Welcome back!");
navigate({ to: "/" });
```

If authentication fails, the caught error is shown beneath the form:

```ts
setError(
  err instanceof Error
    ? err.message
    : "Something went wrong. Please try again."
);
```

Keeping the header aware of login state

In `src/routes/__root.tsx`, the app retrieves the current session after the app loads:

```ts
supabase.auth.getSession().then(({ data }) => setSession(data.session));
```

It also listens for auth changes:

```ts
supabase.auth.onAuthStateChange((event, nextSession) => {
  if (
    event !== "SIGNED_IN" &&
    event !== "SIGNED_OUT" &&
    event !== "USER_UPDATED"
  ) return;

  setSession(nextSession);
  router.invalidate();

  if (event !== "SIGNED_OUT") {
    queryClient.invalidateQueries();
  }
});
```

This means:

- Guest: header shows Sign in
- Signed-in user: header shows their email and Sign out
- Sign-in/sign-out: UI updates without a full browser refresh

Sign out

The sign-out handler clears cached booking data, signs the user out, and redirects them to `/auth`:

```ts
async function handleSignOut() {
  await queryClient.cancelQueries();
  queryClient.clear();

  await supabase.auth.signOut();

  router.navigate({ to: "/auth", replace: true });
}
```

The booking page is still available to guests. Authentication currently changes the header and session state, but bookings are not yet linked to a particular authenticated user.

---

Booking table SQL

The app’s custom data lives in the `public.bookings` table, created in `drizzle/migrations/0000_create_bookings.sql`:

```sql
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_type TEXT NOT NULL
    CHECK (session_type IN ('portrait', 'family', 'product')),
  booking_date DATE NOT NULL,
  time_slot TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed'
    CHECK (status IN ('confirmed', 'pending', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (booking_date, time_slot)
);
```

Column purpose

| Column | Purpose |
|---|---|
| `id` | Unique booking ID created automatically |
| `session_type` | `portrait`, `family`, or `product` |
| `booking_date` | Session date |
| `time_slot` | Selected time, such as `14:00` |
| `client_name` | Client’s name |
| `client_email` | Client’s email |
| `status` | `confirmed`, `pending`, or `cancelled` |
| `created_at` | Timestamp automatically set when inserted |

The unique rule:

```sql
UNIQUE (booking_date, time_slot)
```

prevents two clients from reserving the same slot on the same date.

---

INSERT

SQL used for sample bookings

The migration inserts initial sample records:

```sql
INSERT INTO public.bookings (
  session_type,
  booking_date,
  time_slot,
  client_name,
  client_email,
  status
)
VALUES
  ('portrait', CURRENT_DATE + 1, '10:00', 'Ayesha Khan', 'ayesha.khan@example.com', 'confirmed'),
  ('family', CURRENT_DATE + 1, '14:00', 'The Rahman Family', 'rahman.family@example.com', 'confirmed'),
  ('product', CURRENT_DATE + 2, '11:00', 'Bilal Ahmed', 'bilal@lumenware.co', 'pending');
```

App code that inserts a new booking

In `src/lib/bookings.ts`, the booking form calls:

```ts
const { error } = await supabase.from("bookings").insert({
  ...input,
  status: "confirmed",
});
```

`input` contains:

```ts
{
  session_type,
  booking_date,
  time_slot,
  client_name,
  client_email
}
```

Equivalent SQL:

```sql
INSERT INTO public.bookings (
  session_type,
  booking_date,
  time_slot,
  client_name,
  client_email,
  status
)
VALUES (
  'family',
  '2026-10-21',
  '14:00',
  'Adnan Adil',
  'adnan@example.com',
  'confirmed'
);
```

If the date/time combination already exists, PostgreSQL raises error code `23505`. The app converts it to this client-friendly message:

```ts
if (error.code === "23505") {
  throw new Error("That time slot was just taken — please pick another one.");
}
```

---

SELECT

The schedule page and time-slot availability use this query in `src/lib/bookings.ts`:

```ts
let query = supabase
  .from("bookings")
  .select("*")
  .order("booking_date", { ascending: true })
  .order("time_slot", { ascending: true });

if (date) {
  query = query.eq("booking_date", date);
}
```

Equivalent SQL: all bookings

```sql
SELECT *
FROM public.bookings
ORDER BY booking_date ASC, time_slot ASC;
```

Equivalent SQL: one day’s bookings

```sql
SELECT *
FROM public.bookings
WHERE booking_date = '2026-10-21'
ORDER BY booking_date ASC, time_slot ASC;
```

The booking page uses the date-filtered version to determine which slots should be disabled. The schedule page uses the unfiltered version to display every booking.

---

UPDATE

An update operation is not currently used by the UI, but the generated database types support it and authenticated users have database-level `UPDATE` permission.

For example, to cancel a booking:

```ts
const { error } = await supabase
  .from("bookings")
  .update({ status: "cancelled" })
  .eq("id", bookingId);
```

Equivalent SQL:

```sql
UPDATE public.bookings
SET status = 'cancelled'
WHERE id = 'booking-uuid-here';
```

To reschedule a booking:

```ts
const { error } = await supabase
  .from("bookings")
  .update({
    booking_date: "2026-10-23",
    time_slot: "15:00",
  })
  .eq("id", bookingId);
```

Equivalent SQL:

```sql
UPDATE public.bookings
SET
  booking_date = '2026-10-23',
  time_slot = '15:00'
WHERE id = 'booking-uuid-here';
```

The same unique date/time rule still applies, so rescheduling into an occupied slot would fail.

---

DELETE

Delete is also not currently exposed in the UI. A direct delete would look like:

```ts
const { error } = await supabase
  .from("bookings")
  .delete()
  .eq("id", bookingId);
```

Equivalent SQL:

```sql
DELETE FROM public.bookings
WHERE id = 'booking-uuid-here';
```

For bookings, using `UPDATE ... SET status = 'cancelled'` is usually safer than deleting. It preserves the booking history and keeps a record that the time was previously reserved.

---

Permissions and row-level security

The table enables row-level security:

```sql
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
```

Current policies allow both guests and signed-in users to read and create bookings:

```sql
CREATE POLICY "Anyone can view bookings"
  ON public.bookings
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can create a booking"
  ON public.bookings
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
```

Current database grants are:

```sql
GRANT SELECT, INSERT ON public.bookings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
```

Important: there are no row-level policies for `UPDATE` or `DELETE` yet. Therefore, even though signed-in users have SQL-level grants, row-level security blocks update and delete queries until explicit policies are added. That is a safe default and prevents users from changing or deleting bookings through the app today.

A sensible next improvement would be linking each booking to its signed-in account, then allowing users to update or cancel only their own bookings.