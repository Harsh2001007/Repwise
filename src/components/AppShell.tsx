"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { Dumbbell, History, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { initStore, resetStore, useAppState, useStoreStatus } from "@/lib/store";

const NAV = [
  { href: "/logger", label: "Logger", icon: Dumbbell },
  { href: "/history", label: "History", icon: History },
  { href: "/profile", label: "Profile", icon: User },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { isLoaded, userId, getToken } = useAuth();
  const { user } = useUser();
  const state = useAppState();
  const { loadError, saveError } = useStoreStatus();
  const pathname = usePathname();

  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const name = user?.fullName ?? "";
  const hasUser = Boolean(user);

  useEffect(() => {
    if (!isLoaded) return;
    if (userId && hasUser) initStore({ userId, email, name, getToken });
    else if (!userId) resetStore();
  }, [isLoaded, userId, hasUser, email, name, getToken]);

  if (loadError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="font-semibold">Could not load your data</p>
        <p className="max-w-sm text-sm text-muted">{loadError}</p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => userId && initStore({ userId, email, name, getToken })}
        >
          Try again
        </button>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted">Loading…</div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-1 flex-col md:flex-row">
      <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col gap-8 border-r border-border p-6 md:flex">
        <span className="text-xl font-bold tracking-tight">Repwise</span>
        <nav className="flex flex-col gap-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors ${
                  active ? "bg-accent text-accent-foreground" : "text-muted hover:bg-surface"
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center border-b border-border bg-background px-4 text-lg font-bold tracking-tight md:hidden">
          Repwise
        </header>
        {saveError && (
          <p role="alert" className="border-b border-border bg-surface px-4 py-2 text-center text-sm">
            Your latest changes are not saved yet. Retrying…
          </p>
        )}
        <main className="mx-auto w-full max-w-xl flex-1 px-4 pt-5 pb-28 md:pt-10 md:pb-10">
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-border bg-background pb-[env(safe-area-inset-bottom)] md:hidden">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex h-16 flex-1 flex-col items-center justify-center gap-1 text-xs ${
                active ? "font-semibold text-accent-text" : "text-muted"
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 2} />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
