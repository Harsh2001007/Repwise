"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signIn, useAppState } from "@/lib/store";

export default function LoginPage() {
  const state = useAppState();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const signedIn = Boolean(state?.user);
  useEffect(() => {
    if (signedIn) router.replace("/logger");
  }, [signedIn, router]);

  // TODO(supabase): replace both handlers with supabase.auth calls.
  // Until then any email/password is accepted and nothing leaves the browser.
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError("Enter a valid email address.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    signIn(email.trim().toLowerCase(), mode === "signup" ? name.trim() : undefined);
  };

  const continueWithGoogle = () => signIn("demo@repwise.app", "Demo User");

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-12">
      <h1 className="text-4xl font-bold tracking-tight">Repwise</h1>
      <p className="mt-2 text-muted">Log your workouts, set by set.</p>

      <button type="button" className="btn mt-10 w-full" onClick={continueWithGoogle}>
        <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
          <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.62 2.14-6.11 2.14-4.83 0-8.6-3.89-8.6-8.72s3.77-8.72 8.6-8.72c2.6 0 4.5 1.03 5.9 2.35l2.3-2.3C18.75 1.19 16.13 0 12.48 0 5.87 0 .31 5.39.31 12s5.56 12 12.17 12c3.57 0 6.26-1.17 8.37-3.36 2.16-2.16 2.84-5.21 2.84-7.67 0-.76-.05-1.47-.17-2.05z" />
        </svg>
        Continue with Google
      </button>

      <div className="my-6 flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>

      <form className="space-y-4" onSubmit={submit} noValidate>
        {mode === "signup" && (
          <div>
            <label className="label" htmlFor="name">
              Name
            </label>
            <input
              id="name"
              className="field"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        )}
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            className="field"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setError("");
              setEmail(e.target.value);
            }}
          />
        </div>
        <div>
          <label className="label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            className="field"
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => {
              setError("");
              setPassword(e.target.value);
            }}
          />
        </div>

        {error && (
          <p role="alert" className="rounded-lg border border-foreground px-3 py-2 text-sm">
            {error}
          </p>
        )}

        <button type="submit" className="btn btn-primary w-full">
          {mode === "signup" ? "Create account" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        {mode === "signup" ? "Already have an account?" : "New to Repwise?"}{" "}
        <button
          type="button"
          className="cursor-pointer font-medium text-foreground underline underline-offset-4"
          onClick={() => {
            setError("");
            setMode(mode === "signup" ? "signin" : "signup");
          }}
        >
          {mode === "signup" ? "Sign in" : "Create one"}
        </button>
      </p>
    </main>
  );
}
