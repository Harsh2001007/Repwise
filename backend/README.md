# Repwise backend (not implemented yet)

The app currently runs entirely in the browser: `src/lib/store.ts` keeps the
signed-in user, profile and workouts in `localStorage`, and sign-in is mocked.

Planned work for this folder:

1. Create a Supabase project and apply `supabase/schema.sql` (draft).
2. Enable Email/Password and Google providers in Supabase Auth.
3. Replace the functions in `src/lib/store.ts` and the handlers in
   `src/app/login/page.tsx` with Supabase calls. The screens only talk to the
   store, so they should not need to change.
