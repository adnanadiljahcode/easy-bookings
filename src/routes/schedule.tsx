import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { CalendarDays, Clock, Mail } from "lucide-react";

import { SESSION_TYPES, bookingsQueryOptions } from "@/lib/bookings";

export const Route = createFileRoute("/schedule")({
  head: () => ({
    meta: [
      { title: "Schedule — Lumen & Light Studio" },
      { name: "description", content: "Upcoming photography sessions at Lumen & Light Studio." },
      { property: "og:title", content: "Schedule — Lumen & Light Studio" },
      { property: "og:description", content: "Upcoming photography sessions at Lumen & Light Studio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(bookingsQueryOptions()),
  component: SchedulePage,
});

const STATUS_STYLES: Record<string, string> = {
  confirmed: "bg-primary/10 text-primary",
  pending: "bg-accent text-accent-foreground",
  cancelled: "bg-muted text-muted-foreground line-through",
};

function formatDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function SchedulePage() {
  const { data: bookings } = useSuspenseQuery(bookingsQueryOptions());

  return (
    <div className="mx-auto max-w-3xl">
      <div className="animate-fade-up">
        <h1 className="font-display text-4xl font-semibold md:text-5xl">Studio schedule</h1>
        <p className="mt-2 text-muted-foreground">
          All upcoming sessions at a glance.
        </p>
      </div>

      {bookings.length === 0 ? (
        <p className="mt-10 animate-fade-in rounded-xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
          No bookings yet — be the first to reserve a session.
        </p>
      ) : (
        <ul className="mt-8 space-y-3">
          {bookings.map((b, i) => {
            const session = SESSION_TYPES.find((s) => s.id === b.session_type);
            return (
              <li
                key={b.id}
                className="animate-fade-up rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md"
                style={{ animationDelay: `${Math.min(i * 0.06, 0.5)}s` }}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-xl font-semibold">{b.client_name}</h2>
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" /> {b.client_email}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[b.status] ?? STATUS_STYLES.pending}`}
                  >
                    {b.status}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
                  <span className="font-medium text-primary">{session?.name ?? b.session_type}</span>
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <CalendarDays className="h-4 w-4" /> {formatDate(b.booking_date)}
                  </span>
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-4 w-4" /> {b.time_slot}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
