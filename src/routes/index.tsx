import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { CheckCircle2, Clock, User, Users, Package } from "lucide-react";

import {
  SESSION_TYPES,
  TIME_SLOTS,
  bookingsQueryOptions,
  createBooking,
  type SessionType,
} from "@/lib/bookings";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Book a Session — Lumen & Light Studio" },
      { name: "description", content: "Reserve a portrait, family, or product photography session. Pick a date and time that suits you." },
      { property: "og:title", content: "Book a Session — Lumen & Light Studio" },
      { property: "og:description", content: "Reserve a portrait, family, or product photography session." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BookingPage,
});

const SESSION_ICONS = { portrait: User, family: Users, product: Package } as const;

function todayPlus(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function BookingPage() {
  const queryClient = useQueryClient();
  const [sessionType, setSessionType] = useState<SessionType>("portrait");
  const [date, setDate] = useState(todayPlus(1));
  const [slot, setSlot] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  const { data: dayBookings } = useSuspenseQuery(bookingsQueryOptions(date));
  const takenSlots = useMemo(
    () => new Set(dayBookings.filter((b) => b.status !== "cancelled").map((b) => b.time_slot)),
    [dayBookings],
  );

  const mutation = useMutation({
    mutationFn: createBooking,
    onSuccess: () => {
      setDone(true);
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });

  const canSubmit = sessionType && date && slot && name.trim() && email.trim() && !mutation.isPending;

  if (done) {
    const session = SESSION_TYPES.find((s) => s.id === sessionType)!;
    return (
      <div className="mx-auto max-w-lg animate-fade-up py-16 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-primary" />
        <h1 className="mt-6 font-display text-4xl font-semibold">You're booked!</h1>
        <p className="mt-3 text-muted-foreground">
          Thank you, {name.split(" ")[0]}. Your {session.name.toLowerCase()} session is confirmed
          for <span className="font-medium text-foreground">{date}</span> at{" "}
          <span className="font-medium text-foreground">{slot}</span>. A confirmation is on its way
          to {email}.
        </p>
        <button
          onClick={() => {
            setDone(false);
            setSlot(null);
            setName("");
            setEmail("");
          }}
          className="mt-8 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
        >
          Book another session
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="animate-fade-up">
        <h1 className="font-display text-4xl font-semibold md:text-5xl">Book your session</h1>
        <p className="mt-2 text-muted-foreground">
          Choose a session type, pick a time that works for you, and we'll take care of the rest.
        </p>
      </div>

      {/* Step 1: session type */}
      <section className="mt-10 animate-fade-up stagger-1">
        <h2 className="flex items-center gap-2 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">1</span>
          Session type
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {SESSION_TYPES.map((s) => {
            const Icon = SESSION_ICONS[s.id];
            const active = sessionType === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setSessionType(s.id)}
                className={`rounded-xl border p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${
                  active
                    ? "border-primary bg-accent shadow-sm"
                    : "border-border bg-card"
                }`}
              >
                <Icon className={`h-6 w-6 ${active ? "text-primary" : "text-muted-foreground"}`} />
                <h3 className="mt-3 font-display text-xl font-semibold">{s.name}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.description}</p>
                <p className="mt-3 flex items-center gap-2 text-xs font-medium">
                  <Clock className="h-3.5 w-3.5" /> {s.duration} · {s.price}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Step 2: date & time */}
      <section className="mt-10 animate-fade-up stagger-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">2</span>
          Date &amp; time
        </h2>
        <div className="mt-4 rounded-xl border border-border bg-card p-5">
          <label className="text-sm font-medium" htmlFor="booking-date">
            Date
          </label>
          <input
            id="booking-date"
            type="date"
            value={date}
            min={todayPlus(1)}
            max={todayPlus(60)}
            onChange={(e) => {
              setDate(e.target.value);
              setSlot(null);
            }}
            className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-ring sm:max-w-xs"
          />
          <p className="mt-5 text-sm font-medium">Available times</p>
          <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {TIME_SLOTS.map((t) => {
              const taken = takenSlots.has(t);
              const active = slot === t;
              return (
                <button
                  key={t}
                  disabled={taken}
                  onClick={() => setSlot(t)}
                  className={`rounded-lg border px-2 py-2.5 text-sm font-medium transition-all ${
                    taken
                      ? "cursor-not-allowed border-border bg-muted text-muted-foreground line-through opacity-60"
                      : active
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "border-border bg-background hover:border-primary hover:text-primary"
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Step 3: details */}
      <section className="mt-10 animate-fade-up stagger-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">3</span>
          Your details
        </h2>
        <form
          className="mt-4 rounded-xl border border-border bg-card p-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!canSubmit || !slot) return;
            mutation.mutate({
              session_type: sessionType,
              booking_date: date,
              time_slot: slot,
              client_name: name.trim(),
              client_email: email.trim(),
            });
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium" htmlFor="client-name">Full name</label>
              <input
                id="client-name"
                type="text"
                required
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="client-email">Email</label>
              <input
                id="client-email"
                type="email"
                required
                maxLength={255}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
                className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-ring"
              />
            </div>
          </div>

          {mutation.isError && (
            <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {mutation.error instanceof Error ? mutation.error.message : "Something went wrong. Please try again."}
            </p>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="mt-6 w-full rounded-lg bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {mutation.isPending ? "Reserving…" : slot ? `Confirm booking · ${date} at ${slot}` : "Confirm booking"}
          </button>
        </form>
      </section>
    </div>
  );
}
