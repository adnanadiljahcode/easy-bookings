Here is how confirmation toasts work in this app and how to wire one into the booking flow using Sonner.

---

1. Where the Toaster Lives (Global Container)

In `src/routes/__root.tsx`, the `<Toaster />` component is already mounted inside `RootComponent` so toasts can pop up from anywhere in the app:

```tsx
// src/routes/__root.tsx
import { Toaster } from "@/components/ui/sonner";

function RootComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppChrome session={session} onSignOut={handleSignOut} />
      {/* Listens for toast calls and renders the notification cards */}
      <Toaster position="bottom-right" richColors />
    </QueryClientProvider>
  );
}
```

Because `<Toaster />` is at the root, you don't need to wrap individual pages or manage modal states manually.

---

2. Triggering the Toast on Booking Confirmation

In `src/routes/index.tsx`, booking creation is managed with TanStack Query's `useMutation`. You call `toast.success()` inside the `onSuccess` hook, and optionally `toast.error()` in `onError`:

```tsx
// src/routes/index.tsx
import { toast } from "sonner";
import { useRouter } from "@tanstack/react-router";

// Inside BookingPage():
const router = useRouter();

const mutation = useMutation({
  mutationFn: createBooking,
  onSuccess: (data) => {
    setDone(true);
    queryClient.invalidateQueries({ queryKey: ["bookings"] });

    // Find session details to show a personalized message
    const session = SESSION_TYPES.find((s) => s.id === sessionType);

    toast.success("Booking confirmed!", {
      description: `${session?.name} session on ${date} at ${slot}`,
      action: {
        label: "View Schedule",
        onClick: () => router.navigate({ to: "/schedule" }),
      },
    });
  },
  onError: (error: Error) => {
    // Shows slot collision or network error
    toast.error("Could not complete booking", {
      description: error.message || "Please choose another time slot.",
    });
  },
});
```

---

3. How the Code Works Step-by-Step

1. User Submits Form: Clicking "Confirm reservation" fires `mutation.mutate({ session_type, booking_date, time_slot, client_name, client_email })`.
2. Database Insert: `createBooking()` in `src/lib/bookings.ts` executes the Supabase `insert()`.
3. `onSuccess` Callback Runs:
   - `setDone(true)` flips the screen to the existing confirmation screen.
   - `queryClient.invalidateQueries({ queryKey: ["bookings"] })` refreshes the slot data.
   - `toast.success(...)` emits an event with title, description, and an interactive "View Schedule" button that navigates directly to `/schedule`.
4. Collision Handling (`onError`):
   - If two clients select the same slot simultaneously, the PostgreSQL unique constraint (`UNIQUE(booking_date, time_slot)`) rejects the insert. `toast.error(...)` alerts the user immediately with the reason.

---

Next steps

Would you like to wire this directly into the booking page, or customize the toast appearance (such as adding an icon, changing the display duration, or auto-redirecting to `/schedule`)? When you are ready for me to apply this change to the codebase, let me know and we can switch to Build mode.






Customize the toaster appearance 
(a) adding an icon, 
(b) changing the display duration, 
(c) auto-redirecting to /schedule

---

In this application, notifications are powered by Sonner (`toast` from `"sonner"`), and client-side navigation is handled by TanStack Router (`useRouter()` or `useNavigate()`).

Here is a breakdown of how to customize all three behaviors.

---

(a) Adding a Custom Icon

By default, `toast.success()` shows a green checkmark icon. You can override it by passing any React element to the `icon` property:

```tsx
import { Camera, CalendarCheck } from "lucide-react";

toast.success("Booking confirmed!", {
  icon: <Camera className="h-5 w-5 text-primary" />,
  description: `${session?.name} session on ${date} at ${slot}`,
});
```

* How it works: Sonner replaces its built-in icon slot with the React node provided.
* Styling: Because the icon accepts standard JSX, you can apply Tailwind color tokens (`text-primary`, `text-accent`) or CSS animations (like `animate-spin` or `animate-pulse`).

---

(b) Changing the Display Duration

The `duration` option defines how long the toast stays visible in milliseconds:

```tsx
toast.success("Booking confirmed!", {
  duration: 5000, // Stays visible for 5 seconds (default is 4000ms)
});
```

* Per-toast: Set `duration: 3000` inside `toast.success({ duration: ... })`.
* Persistent: Set `duration: Infinity` if you want the toast to remain until the user explicitly dismisses it or clicks an action button.
* Global default: If you want all toasts in the app to share a default duration, you can configure `<Toaster duration={5000} />` in `src/components/ui/sonner.tsx` or `src/routes/__root.tsx`.

---

(c) Auto-Redirecting to `/schedule`

There are two clean ways to trigger an automatic redirect after confirmation:

Method 1: Using Sonner's `onAutoClose` lifecycle hook (Recommended)
Sonner provides an `onAutoClose` callback that fires automatically once the `duration` countdown finishes:

```tsx
toast.success("Booking confirmed!", {
  duration: 3500,
  onAutoClose: () => {
    router.navigate({ to: "/schedule" });
  },
});
```
* Benefit: The navigation timing is tied directly to the toast lifespan. If the user watches the toast fade out, the page transitions immediately afterward.

Method 2: Using `setTimeout`
If you want the redirect countdown to start immediately upon booking success, regardless of toast dismissal state:

```tsx
// Inside mutation.onSuccess:
toast.success("Booking confirmed!", {
  duration: 4000,
});

const timer = setTimeout(() => {
  router.navigate({ to: "/schedule" });
}, 2500); // Redirects after 2.5 seconds
```

---

Combined Implementation Example

Here is how all three pieces look together inside the `useMutation` hook in `src/routes/index.tsx`:

```tsx
import { CalendarCheck } from "lucide-react";
import { toast } from "sonner";

// Inside BookingPage:
const router = useRouter();

const mutation = useMutation({
  mutationFn: createBooking,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["bookings"] });

    const session = SESSION_TYPES.find((s) => s.id === sessionType);

    toast.success("Booking confirmed!", {
      // (a) Custom icon
      icon: <CalendarCheck className="h-5 w-5 text-primary" />,
      
      description: `${session?.name} session on ${date} at ${slot}. Redirecting...`,

      // (b) Custom display duration (3.5 seconds)
      duration: 3500,

      // (c) Auto-redirect when duration ends
      onAutoClose: () => {
        router.navigate({ to: "/schedule" });
      },

      // Instant bypass button so clients don't have to wait
      action: {
        label: "Go now",
        onClick: () => router.navigate({ to: "/schedule" }),
      },
    });
  },
  onError: (error: Error) => {
    toast.error("Could not complete booking", {
      description: error.message || "Please choose another time slot.",
    });
  },
});
```

Would you like me to switch to Build mode to apply this toast behavior and auto-redirect to your booking page?