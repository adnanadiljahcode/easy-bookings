In this app, database operations run against a PostgreSQL database (managed via Lovable Cloud). The frontend interacts with it using the Supabase client library (`src/integrations/supabase/client.ts`), which translates TypeScript method calls into SQL queries executed on PostgreSQL.

Here is a breakdown of the database operations—what is currently implemented (`INSERT` and `SELECT`), and how `UPDATE` and `DELETE` work or can be added.

---

1. `INSERT` (Creating a new booking)

When a customer completes the 3-step form on `/`, the application inserts a new row into the `bookings` table.

In the application code (`src/lib/bookings.ts`):
```typescript
export async function createBooking(input: {
  session_type: SessionType;
  booking_date: string;
  time_slot: string;
  client_name: string;
  client_email: string;
}) {
  const { error } = await supabase.from("bookings").insert({
    ...input,
    status: "confirmed",
  });

  if (error) {
    // 23505 is PostgreSQL's unique_violation error code
    if (error.code === "23505") {
      throw new Error("That time slot was just taken — please pick another one.");
    }
    throw error;
  }
}
```

Equivalent Raw SQL:
```sql
INSERT INTO public.bookings (
  session_type,
  booking_date,
  time_slot,
  client_name,
  client_email,
  status
) VALUES (
  'portrait',
  '2026-10-20',
  '10:00',
  'Jane Doe',
  'jane@example.com',
  'confirmed'
);
```

Database Constraint (Preventing Double Booking):
The database has a composite unique constraint:
```sql
CONSTRAINT unique_booking_slot UNIQUE (booking_date, time_slot);
```
If two clients submit the exact same slot concurrently, PostgreSQL enforces ACID consistency and rejects the second attempt with error code `23505` (`unique_violation`), which the app catches and displays as a friendly alert.

---

2. `SELECT` (Reading bookings for the schedule and slot availability)

The app queries the database in two places:
1. On `/`: to disable already-booked time slots for a chosen date.
2. On `/schedule`: to show the list of all upcoming sessions.

In the application code (`src/lib/bookings.ts`):
```typescript
export function bookingsQueryOptions(date?: string) {
  return queryOptions({
    queryKey: ["bookings", date ?? "all"],
    queryFn: async (): Promise<Booking[]> => {
      let query = supabase
        .from("bookings")
        .select("*")
        .order("booking_date", { ascending: true })
        .order("time_slot", { ascending: true });

      if (date) query = query.eq("booking_date", date);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Booking[];
    },
  });
}
```

Equivalent Raw SQL:
When filtering by a specific date:
```sql
SELECT * FROM public.bookings
WHERE booking_date = '2026-10-20'
ORDER BY booking_date ASC, time_slot ASC;
```

When fetching the entire schedule:
```sql
SELECT * FROM public.bookings
ORDER BY booking_date ASC, time_slot ASC;
```

---

3. `UPDATE` (Modifying existing bookings)

`UPDATE` is not yet wired up in the UI (since clients currently just book and view). If you want to allow clients or admins to cancel or reschedule a session:

Application code example:
```typescript
// To cancel a booking:
export async function cancelBooking(id: string) {
  const { error } = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", id);

  if (error) throw error;
}

// To reschedule a booking:
export async function rescheduleBooking(id: string, newDate: string, newTime: string) {
  const { error } = await supabase
    .from("bookings")
    .update({ booking_date: newDate, time_slot: newTime })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") {
      throw new Error("That new time slot is already taken.");
    }
    throw error;
  }
}
```

Equivalent Raw SQL:
```sql
-- Cancel
UPDATE public.bookings
SET status = 'cancelled'
WHERE id = 'c4d12345-6789-4abc-def0-123456789abc';

-- Reschedule
UPDATE public.bookings
SET booking_date = '2026-10-25', time_slot = '14:00'
WHERE id = 'c4d12345-6789-4abc-def0-123456789abc';
```

---

4. `DELETE` (Removing a booking)

In production booking systems, soft deletion (`UPDATE ... status = 'cancelled'`) is generally preferred so you have an audit trail. However, for a hard delete:

Application code example:
```typescript
export async function deleteBooking(id: string) {
  const { error } = await supabase
    .from("bookings")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
```

Equivalent Raw SQL:
```sql
DELETE FROM public.bookings
WHERE id = 'c4d12345-6789-4abc-def0-123456789abc';
```

---

Row Level Security (RLS) note

The database table has Row Level Security enabled. Right now, it has:
- A `SELECT` policy allowing public reads (`USING (true)`).
- An `INSERT` policy allowing public creation (`WITH CHECK (true)`).

If we implement `UPDATE` or `DELETE`, we would also add matching RLS policies (e.g., allowing updates based on a booking reference token, email verification, or an admin role) so PostgreSQL permits those modifications.

---

Would you like to implement a cancellation / rescheduling feature on the Schedule page, or add an admin view to manage bookings?