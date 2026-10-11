"use client";

// Local, in-browser data layer. Everything the UI reads or writes goes through
// this file, so swapping localStorage for Supabase later only touches here.

import { useSyncExternalStore } from "react";
import type {
  AppState,
  Exercise,
  Profile,
  SetEntry,
  WeightUnit,
  Workout,
} from "./types";

const STORAGE_KEY = "repwise:v1";

const initialState: AppState = {
  user: null,
  profile: { name: "", age: null, gender: "", heightCm: null, weightKg: null },
  workouts: [],
  preferredUnit: "kg",
};

let state: AppState | null = null;
const listeners = new Set<() => void>();

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...initialState, ...JSON.parse(raw) };
  } catch {
    // corrupted or unavailable storage: start fresh
  }
  return initialState;
}

function getSnapshot(): AppState {
  return (state ??= load());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function update(fn: (s: AppState) => AppState) {
  state = fn(getSnapshot());
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage full or blocked: keep working in memory
  }
  listeners.forEach((l) => l());
}

/** Null on the server and during hydration, the stored state afterwards. */
export function useAppState(): AppState | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}

/** For screens rendered inside AppShell, which only mounts them once state is loaded. */
export function useStore(): AppState {
  const s = useAppState();
  if (!s) throw new Error("useStore must be used inside AppShell");
  return s;
}

export function newId(): string {
  // randomUUID is missing on insecure origins (e.g. testing on a phone over LAN)
  return (
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  );
}

export function newSet(unit: WeightUnit, weight: number | null = null): SetEntry {
  return { id: newId(), weight, reps: null, unit, done: false };
}

function newExercise(unit: WeightUnit): Exercise {
  return { id: newId(), name: "", targetPart: "", sets: [newSet(unit)], logged: false };
}

// ---- auth (mock until Supabase is wired in) ----

export function signIn(email: string, name?: string) {
  update((s) => ({
    ...s,
    user: { email },
    profile: name && !s.profile.name ? { ...s.profile, name } : s.profile,
  }));
}

export function signOut() {
  update((s) => ({ ...s, user: null }));
}

export function deleteAccount() {
  update(() => initialState);
}

// ---- profile ----

export function saveProfile(profile: Profile) {
  update((s) => ({ ...s, profile }));
}

export function setPreferredUnit(unit: WeightUnit) {
  update((s) => (s.preferredUnit === unit ? s : { ...s, preferredUnit: unit }));
}

// ---- workouts ----

function mapWorkout(id: string, fn: (w: Workout) => Workout) {
  update((s) => ({
    ...s,
    workouts: s.workouts.map((w) => (w.id === id ? fn(w) : w)),
  }));
}

export function startWorkout(date: string) {
  update((s) => ({
    ...s,
    workouts: [
      ...s.workouts,
      {
        id: newId(),
        date,
        name: "",
        startedAt: new Date().toISOString(),
        exercises: [newExercise(s.preferredUnit)],
      },
    ],
  }));
}

export function renameWorkout(id: string, name: string) {
  mapWorkout(id, (w) => ({ ...w, name }));
}

export function addExercise(workoutId: string) {
  const unit = getSnapshot().preferredUnit;
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
  update((s) => ({
    ...s,
    workouts: s.workouts
      .map((w) =>
        w.id === workoutId
          ? { ...w, exercises: w.exercises.filter((e) => e.id !== exerciseId) }
          : w,
      )
      .filter((w) => w.exercises.length > 0),
  }));
}
