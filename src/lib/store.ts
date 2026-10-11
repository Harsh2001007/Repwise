"use client";

// Client data layer. Screens read and mutate an in-memory copy of the user's
// data synchronously; this file loads it from Supabase after sign-in and
// writes changes back in the background.

import type { SupabaseClient } from "@supabase/supabase-js";
import { useSyncExternalStore } from "react";
import { createSupabase } from "./supabase";
import type {
  AppState,
  Exercise,
  Gender,
  Profile,
  SetEntry,
  TargetPart,
  WeightUnit,
  Workout,
} from "./types";

interface Session {
  userId: string;
  email: string;
  name: string;
  getToken: () => Promise<string | null>;
}

interface StoreStatus {
  loadError: string | null;
  saveError: string | null;
}

const SAVE_DELAY_MS = 600;
const RETRY_DELAY_MS = 5000;

let state: AppState | null = null;
let status: StoreStatus = { loadError: null, saveError: null };
const listeners = new Set<() => void>();

let db: SupabaseClient | null = null;
let userId: string | null = null;
let getToken: Session["getToken"] = async () => null;

// workouts changed locally and not yet written to Supabase
const dirtyWorkouts = new Set<string>();
const removedWorkouts = new Set<string>();
let saveTimer: ReturnType<typeof setTimeout> | undefined;
let saveQueue: Promise<void> = Promise.resolve();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function setStatus(patch: Partial<StoreStatus>) {
  status = { ...status, ...patch };
  emit();
}

function update(fn: (s: AppState) => AppState) {
  if (!state) return;
  state = fn(state);
  emit();
}

const message = (e: unknown) => (e instanceof Error ? e.message : String(e));

/** Null until the signed-in user's data has loaded. */
export function useAppState(): AppState | null {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => null,
  );
}

/** For screens rendered inside AppShell, which only mounts them once state is loaded. */
export function useStore(): AppState {
  const s = useAppState();
  if (!s) throw new Error("useStore must be used inside AppShell");
  return s;
}

export function useStoreStatus(): StoreStatus {
  return useSyncExternalStore(
    subscribe,
    () => status,
    () => status,
  );
}

export function newId(): string {
  const c = globalThis.crypto;
  if (c.randomUUID) return c.randomUUID();
  // randomUUID is missing on insecure origins (e.g. testing on a phone over LAN)
  const b = c.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export function newSet(unit: WeightUnit, weight: number | null = null): SetEntry {
  return { id: newId(), weight, reps: null, unit, done: false };
}

function newExercise(unit: WeightUnit): Exercise {
  return { id: newId(), name: "", targetPart: "", sets: [newSet(unit)], logged: false };
}

// ---- loading ----

interface ProfileRow {
  name: string;
  age: number | null;
  gender: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  preferred_unit: WeightUnit;
}

interface WorkoutRow {
  id: string;
  date: string;
  name: string;
  started_at: string;
  exercises: {
    id: string;
    position: number;
    name: string;
    target_part: string | null;
    logged: boolean;
    sets: {
      id: string;
      position: number;
      weight: number | null;
      unit: WeightUnit;
      reps: number | null;
      done: boolean;
    }[];
  }[];
}

const byPosition = (a: { position: number }, b: { position: number }) => a.position - b.position;

async function loadProfile(client: SupabaseClient, session: Session): Promise<ProfileRow> {
  const columns = "name, age, gender, height_cm, weight_kg, preferred_unit";
  const existing = await client.from("profiles").select(columns).maybeSingle<ProfileRow>();
  if (existing.error) throw new Error(existing.error.message);
  if (existing.data) return existing.data;

  // first sign-in: create the profile, seeded with the name from Clerk
  const created = await client
    .from("profiles")
    .upsert({ user_id: session.userId, name: session.name }, { onConflict: "user_id" })
    .select(columns)
    .single<ProfileRow>();
  if (created.error) throw new Error(created.error.message);
  return created.data;
}

async function loadWorkouts(client: SupabaseClient): Promise<Workout[]> {
  const { data, error } = await client
    .from("workouts")
    .select(
      "id, date, name, started_at, exercises(id, position, name, target_part, logged, sets(id, position, weight, unit, reps, done))",
    )
    .order("date")
    .overrideTypes<WorkoutRow[], { merge: false }>();
  if (error) throw new Error(error.message);

  return data.map((w) => ({
    id: w.id,
    date: w.date,
    name: w.name,
    startedAt: w.started_at,
    exercises: [...w.exercises].sort(byPosition).map((e) => ({
      id: e.id,
      name: e.name,
      targetPart: (e.target_part ?? "") as TargetPart | "",
      logged: e.logged,
      sets: [...e.sets].sort(byPosition).map((s) => ({
        id: s.id,
        weight: s.weight,
        reps: s.reps,
        unit: s.unit,
        done: s.done,
      })),
    })),
  }));
}

/** Called by AppShell once Clerk reports a signed-in user. Safe to call repeatedly. */
export async function initStore(session: Session) {
  getToken = session.getToken;
  if (userId === session.userId) return;

  userId = session.userId;
  state = null;
  setStatus({ loadError: null, saveError: null });

  try {
    db ??= createSupabase(() => getToken());
    const [profile, workouts] = await Promise.all([
      loadProfile(db, session),
      loadWorkouts(db),
    ]);
    if (userId !== session.userId) return; // signed out or switched user meanwhile
    state = {
      user: { email: session.email },
      profile: {
        name: profile.name,
        age: profile.age,
        gender: (profile.gender ?? "") as Gender | "",
        heightCm: profile.height_cm,
        weightKg: profile.weight_kg,
      },
      preferredUnit: profile.preferred_unit,
      workouts,
    };
    emit();
  } catch (e) {
    if (userId !== session.userId) return;
    userId = null; // lets a retry run the load again
    setStatus({ loadError: message(e) });
  }
}

/** Drops all in-memory data. Called on sign-out. */
export function resetStore() {
  clearTimeout(saveTimer);
  dirtyWorkouts.clear();
  removedWorkouts.clear();
  userId = null;
  state = null;
  setStatus({ loadError: null, saveError: null });
}

// ---- saving ----

function scheduleSave(delay = SAVE_DELAY_MS) {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(flush, delay);
}

/** Writes every pending workout change. Runs are queued so writes never overlap. */
function flush() {
  clearTimeout(saveTimer);
  saveQueue = saveQueue.then(async () => {
    const client = db;
    if (!client || !state) return;

    const saves = [...dirtyWorkouts];
    const removals = [...removedWorkouts];
    dirtyWorkouts.clear();
    removedWorkouts.clear();
    if (saves.length + removals.length === 0) return;

    let failure: string | null = null;
    for (const id of saves) {
      const workout = state?.workouts.find((w) => w.id === id);
      if (!workout) continue;
      const { error } = await client.rpc("save_workout", { p_workout: workout });
      if (error) {
        failure = error.message;
        dirtyWorkouts.add(id);
      }
    }
    for (const id of removals) {
      const { error } = await client.from("workouts").delete().eq("id", id);
      if (error) {
        failure = error.message;
        removedWorkouts.add(id);
      }
    }

    if (failure) scheduleSave(RETRY_DELAY_MS);
    if (failure !== status.saveError) setStatus({ saveError: failure });
  });
}

if (typeof document !== "undefined") {
  // don't sit on unsaved edits when the tab is backgrounded or closed
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });
}

function mapWorkout(id: string, fn: (w: Workout) => Workout) {
  update((s) => ({
    ...s,
    workouts: s.workouts.map((w) => (w.id === id ? fn(w) : w)),
  }));
  dirtyWorkouts.add(id);
  scheduleSave();
}

async function persistProfile() {
  if (!db || !state || !userId) return;
  const { profile, preferredUnit } = state;
  const { error } = await db.from("profiles").upsert(
    {
      user_id: userId,
      name: profile.name,
      age: profile.age,
      gender: profile.gender || null,
      height_cm: profile.heightCm,
      weight_kg: profile.weightKg,
      preferred_unit: preferredUnit,
    },
    { onConflict: "user_id" },
  );
  setStatus({ saveError: error ? error.message : null });
  if (error) throw new Error(error.message);
}

// ---- profile ----

export function saveProfile(profile: Profile) {
  update((s) => ({ ...s, profile }));
  return persistProfile();
}

export function setPreferredUnit(unit: WeightUnit) {
  if (!state || state.preferredUnit === unit) return;
  update((s) => ({ ...s, preferredUnit: unit }));
  persistProfile().catch(() => {
    // surfaced through useStoreStatus
  });
}

// ---- workouts ----

export function startWorkout(date: string) {
  const id = newId();
  update((s) => ({
    ...s,
    workouts: [
      ...s.workouts,
      {
        id,
        date,
        name: "",
        startedAt: new Date().toISOString(),
        exercises: [newExercise(s.preferredUnit)],
      },
    ],
  }));
  dirtyWorkouts.add(id);
  scheduleSave();
}

export function renameWorkout(id: string, name: string) {
  mapWorkout(id, (w) => ({ ...w, name }));
}

export function addExercise(workoutId: string) {
  const unit = state?.preferredUnit ?? "kg";
  mapWorkout(workoutId, (w) => ({
    ...w,
    exercises: [...w.exercises, newExercise(unit)],
  }));
}

export function updateExercise(
  workoutId: string,
  exerciseId: string,
  fn: (e: Exercise) => Exercise,
) {
  mapWorkout(workoutId, (w) => ({
    ...w,
    exercises: w.exercises.map((e) => (e.id === exerciseId ? fn(e) : e)),
  }));
}

/** Removing the last exercise removes the workout itself. */
export function deleteExercise(workoutId: string, exerciseId: string) {
  mapWorkout(workoutId, (w) => ({
    ...w,
    exercises: w.exercises.filter((e) => e.id !== exerciseId),
  }));
  const workout = state?.workouts.find((w) => w.id === workoutId);
  if (workout && workout.exercises.length === 0) {
    update((s) => ({ ...s, workouts: s.workouts.filter((w) => w.id !== workoutId) }));
    dirtyWorkouts.delete(workoutId);
    removedWorkouts.add(workoutId);
  }
}
