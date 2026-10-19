import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Aperture, MailCheck } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign In — Lumen & Light Studio" },
      { name: "description", content: "Sign in or create an account at Lumen & Light Studio." },
      { property: "og:title", content: "Sign In — Lumen & Light Studio" },
      { property: "og:description", content: "Sign in or create an account at Lumen & Light Studio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      if (mode === "sign-up") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (!data.session) {
          // Email confirmation is on — the user must confirm before signing in.
          setCheckEmail(true);
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
      }
      toast.success("Welcome back!");
      navigate({ to: "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  if (checkEmail) {
    return (
      <div className="mx-auto max-w-md animate-fade-up py-16 text-center">
        <MailCheck className="mx-auto h-14 w-14 text-primary" />
        <h1 className="mt-6 font-display text-4xl font-semibold">Check your email</h1>
        <p className="mt-3 text-muted-foreground">
          We sent a confirmation link to <span className="font-medium text-foreground">{email}</span>.
          Click it to activate your account, then sign in.
        </p>
        <button
          onClick={() => {
            setCheckEmail(false);
            setMode("sign-in");
          }}
          className="mt-8 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
        >
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md animate-fade-up py-10">
      <div className="text-center">
        <Aperture className="mx-auto h-10 w-10 text-primary" />
        <h1 className="mt-4 font-display text-4xl font-semibold">
          {mode === "sign-in" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "sign-in"
            ? "Sign in to manage your sessions at Lumen & Light Studio."
            : "Sign up to keep track of your bookings."}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-8 rounded-xl border border-border bg-card p-6"
      >
        <div>
          <label className="text-sm font-medium" htmlFor="auth-email">Email</label>
          <input
            id="auth-email"
            type="email"
            required
            maxLength={255}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@example.com"
            className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-ring"
          />
        </div>
        <div className="mt-4">
          <label className="text-sm font-medium" htmlFor="auth-password">Password</label>
          <input
            id="auth-password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-ring"
          />
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-6 w-full rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Please wait…" : mode === "sign-in" ? "Sign in" : "Sign up"}
        </button>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          {mode === "sign-in" ? "New to the studio?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "sign-in" ? "sign-up" : "sign-in");
              setError(null);
            }}
            className="font-medium text-primary hover:underline"
          >
            {mode === "sign-in" ? "Create an account" : "Sign in"}
          </button>
        </p>
      </form>
    </div>
  );
}
