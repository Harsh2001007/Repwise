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
