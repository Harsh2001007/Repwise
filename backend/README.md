# Repwise backend

- **Auth: Clerk** (email + password, Google). `src/proxy.ts` protects every
  route except `/login`.
- **Database: Supabase**, used for data only. Clerk is registered in Supabase
  as a third-party auth provider, so the browser sends the Clerk session token
  and row level security limits each user to their own rows.

## One-time setup

1. **Clerk**: create an application with *Email* (password enabled) and
   *Google* sign-in. Copy the publishable and secret keys.
2. **Clerk -> Supabase**: in the Clerk dashboard open the Supabase integration
   setup, activate it, and copy the Clerk domain it shows.
3. **Supabase**: Authentication -> Sign In / Providers -> Third Party Auth ->
   add Clerk and paste that domain.
4. **Supabase**: SQL editor -> paste and run `supabase/schema.sql`.
5. Copy `.env.example` to `.env.local` and fill in the four values.

## Where the code lives

| File | Role |
| --- | --- |
| `src/proxy.ts` | Clerk route protection |
| `src/lib/supabase.ts` | Supabase client authenticated with the Clerk token |
| `src/lib/store.ts` | Loads the user's data, saves changes in the background |
| `src/app/actions.ts` | Account deletion (Supabase rows, then the Clerk user) |
| `backend/supabase/schema.sql` | Tables, policies, `save_workout` function |
