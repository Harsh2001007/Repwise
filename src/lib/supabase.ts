import { createClient } from "@supabase/supabase-js";

/**
 * Supabase is used as the database only. Requests carry the Clerk session
 * token, and row level security matches its `sub` claim against `user_id`.
 */
export function createSupabase(getToken: () => Promise<string | null>) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local",
    );
  }
  return createClient(url, key, { accessToken: getToken });
}
