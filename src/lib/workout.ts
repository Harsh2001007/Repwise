import type { Exercise, Workout } from "./types";

export function loggedExercises(workout: Workout): Exercise[] {
  return workout.exercises.filter((e) => e.logged);
}

/** The name the user typed, or one derived from the muscle groups trained. */
export function workoutTitle(workout: Workout): string {
  if (workout.name.trim()) return workout.name.trim();
  const parts = [...new Set(loggedExercises(workout).map((e) => e.targetPart))].filter(Boolean);
  return parts.length ? parts.join(" & ") : "Workout";
}

export function isValidSet(weight: number | null, reps: number | null): boolean {
  return (
    weight !== null &&
    Number.isFinite(weight) &&
    weight >= 0 &&
    reps !== null &&
    Number.isInteger(reps) &&
    reps > 0
  );
}

export interface KnownExercise {
  name: string;
  targetPart: Exercise["targetPart"];
}

/** Every distinct exercise the user has logged, most recently used first. */
export function knownExercises(workouts: Workout[]): KnownExercise[] {
  const seen = new Map<string, KnownExercise>();
  const newestFirst = [...workouts].sort((a, b) => b.date.localeCompare(a.date));
  for (const workout of newestFirst) {
    for (const { name, targetPart } of loggedExercises(workout)) {
      const key = name.trim().toLowerCase();
      if (key && !seen.has(key)) seen.set(key, { name: name.trim(), targetPart });
    }
  }
  return [...seen.values()];
}

// Rep range that decides what the next set should do with the weight
export const REPS_TO_DROP_BELOW = 8;
export const REPS_TO_INCREASE_AT = 12;

export type WeightAdvice = "increase" | "same" | "decrease";

export function weightAdvice(reps: number): WeightAdvice {
  if (reps >= REPS_TO_INCREASE_AT) return "increase";
  if (reps < REPS_TO_DROP_BELOW) return "decrease";
  return "same";
}
