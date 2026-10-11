export const TARGET_PARTS = [
  "Back",
  "Biceps",
  "Chest",
  "Triceps",
  "Legs",
  "Shoulder",
  "Core",
] as const;

export type TargetPart = (typeof TARGET_PARTS)[number];
export type WeightUnit = "kg" | "lbs";

export const GENDERS = ["Male", "Female", "Other", "Prefer not to say"] as const;
export type Gender = (typeof GENDERS)[number];

export interface SetEntry {
  id: string;
  weight: number | null;
  reps: number | null;
  unit: WeightUnit;
  /** false while the row is still being typed in (the "next set" row) */
  done: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  targetPart: TargetPart | "";
  sets: SetEntry[];
  /** true once the user pressed "Log" on the card */
  logged: boolean;
}

export interface Workout {
  id: string;
  /** local calendar day, YYYY-MM-DD */
  date: string;
  name: string;
  /** ISO timestamp of when the workout was started */
  startedAt: string;
  exercises: Exercise[];
}

export interface Profile {
  name: string;
  age: number | null;
  gender: Gender | "";
  heightCm: number | null;
  weightKg: number | null;
}

export interface User {
  email: string;
}

export interface AppState {
  user: User | null;
  profile: Profile;
  workouts: Workout[];
  preferredUnit: WeightUnit;
}
