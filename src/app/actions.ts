"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { createSupabase } from "@/lib/supabase";

/** Removes the signed-in user's data from Supabase, then the Clerk user itself. */
export async function deleteAccountAction() {
  const { userId, getToken } = await auth();
  if (!userId) throw new Error("Not signed in");

  const supabase = createSupabase(() => getToken());
  // exercises and sets go with their workout through cascading foreign keys
  const workouts = await supabase.from("workouts").delete().eq("user_id", userId);
  if (workouts.error) throw new Error(workouts.error.message);
  const profile = await supabase.from("profiles").delete().eq("user_id", userId);
  if (profile.error) throw new Error(profile.error.message);

  const clerk = await clerkClient();
  await clerk.users.deleteUser(userId);
}
