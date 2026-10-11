"use client";

import { Dumbbell, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import DatePicker from "@/components/DatePicker";
import ExerciseCard from "@/components/ExerciseCard";
import StatsStrip from "@/components/StatsStrip";
import { todayISO } from "@/lib/date";
import {
  addExercise,
  deleteExercise,
  renameWorkout,
  startWorkout,
  updateExercise,
  useStore,
} from "@/lib/store";
import { trainedDates } from "@/lib/stats";
import { knownExercises } from "@/lib/workout";

export default function LoggerPage() {
  const { workouts, preferredUnit } = useStore();
  const [date, setDate] = useState(todayISO);

  const workout = workouts.find((w) => w.date === date);
  const marked = useMemo(() => trainedDates(workouts), [workouts]);

  const known = useMemo(() => knownExercises(workouts), [workouts]);

  return (
    <div className="space-y-5">
      <DatePicker value={date} onChange={setDate} marked={marked} />
      <StatsStrip workouts={workouts} unit={preferredUnit} />

      {!workout ? (
        <div className="card flex animate-rise flex-col items-center gap-4 py-12 text-center">
          <Dumbbell size={32} strokeWidth={1.5} />
          <div>
            <p className="font-semibold">No workout logged</p>
            <p className="mt-1 text-sm text-muted">
              {date === todayISO()
                ? "Ready when you are."
                : "You can still log what you did on this day."}
            </p>
          </div>
          <button type="button" className="btn btn-primary px-8" onClick={() => startWorkout(date)}>
            Start workout
          </button>
        </div>
      ) : (
        <>
          <div>
            <label className="label" htmlFor="workout-name">
              Workout name
            </label>
            <input
              id="workout-name"
              className="field"
              placeholder="e.g. Push day (optional)"
              value={workout.name}
              onChange={(e) => renameWorkout(workout.id, e.target.value)}
            />
          </div>

          {workout.exercises.map((exercise, i) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              index={i}
              known={known}
              onChange={(fn) => updateExercise(workout.id, exercise.id, fn)}
              onDelete={() => deleteExercise(workout.id, exercise.id)}
            />
          ))}

          <button
            type="button"
            className="btn w-full border-dashed"
            onClick={() => addExercise(workout.id)}
          >
            <Plus size={16} />
            Add exercise
          </button>
        </>
      )}
    </div>
  );
}
