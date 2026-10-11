import { addDays, parseISODate } from "./date";
import type { WeightUnit, Workout } from "./types";
import { loggedExercises } from "./workout";

const KG_PER_LB = 0.45359237;

/** Days that have at least one logged exercise. */
export function trainedDates(workouts: Workout[]): Set<string> {
  return new Set(workouts.filter((w) => loggedExercises(w).length > 0).map((w) => w.date));
}

/** The seven dates, Monday to Sunday, of the week containing `today`. */
export function weekOf(today: string): string[] {
  const daysSinceMonday = (parseISODate(today).getDay() + 6) % 7;
  return Array.from({ length: 7 }, (_, i) => addDays(today, i - daysSinceMonday));
}

/** Consecutive trained days up to today. A rest day today does not break it yet. */
export function currentStreak(trained: Set<string>, today: string): number {
  let day = trained.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (trained.has(day)) {
    streak++;
    day = addDays(day, -1);
  }
  return streak;
}

/** Total weight x reps over the given workouts, expressed in `unit`. */
export function totalVolume(workouts: Workout[], unit: WeightUnit): number {
  let kg = 0;
  for (const workout of workouts) {
    for (const exercise of loggedExercises(workout)) {
      for (const set of exercise.sets) {
        const weightKg = (set.weight ?? 0) * (set.unit === "lbs" ? KG_PER_LB : 1);
        kg += weightKg * (set.reps ?? 0);
      }
    }
  }
  return unit === "lbs" ? kg / KG_PER_LB : kg;
}
