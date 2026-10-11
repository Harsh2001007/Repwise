"use client";

import { ArrowDown, ArrowUp, Check, Equal, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { newSet, setPreferredUnit } from "@/lib/store";
import { TARGET_PARTS, type Exercise, type SetEntry, type TargetPart, type WeightUnit } from "@/lib/types";
import {
  isValidSet,
  REPS_TO_DROP_BELOW,
  REPS_TO_INCREASE_AT,
  weightAdvice,
  type KnownExercise,
  type WeightAdvice,
} from "@/lib/workout";
import ExerciseNameInput from "./ExerciseNameInput";

interface Props {
  exercise: Exercise;
  index: number;
  /** exercises logged before, offered as name suggestions */
  known: KnownExercise[];
  onChange: (fn: (e: Exercise) => Exercise) => void;
  onDelete: () => void;
}

const toNumber = (v: string) => (v === "" ? null : Number(v));

const ADVICE: Record<WeightAdvice, { icon: typeof Equal; text: string }> = {
  increase: {
    icon: ArrowUp,
    text: `You hit ${REPS_TO_INCREASE_AT}+ reps. Go heavier on this set.`,
  },
  same: {
    icon: Equal,
    text: `${REPS_TO_DROP_BELOW}-${REPS_TO_INCREASE_AT - 1} reps. Keep the same weight on this set.`,
  },
  decrease: {
    icon: ArrowDown,
    text: `Under ${REPS_TO_DROP_BELOW} reps. Drop the weight on this set.`,
  },
};

export default function ExerciseCard({ exercise, index, known, onChange, onDelete }: Props) {
  const [error, setError] = useState("");

  const confirmDelete = () => {
    const label = exercise.name.trim() || `Exercise ${index + 1}`;
    if (window.confirm(`Delete "${label}"?`)) onDelete();
  };

  if (exercise.logged) {
    return (
      <section className="card">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-semibold">{exercise.name}</h3>
            <span className="mt-1 inline-block rounded-full border border-border px-2 py-0.5 text-xs text-muted">
              {exercise.targetPart}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="icon-btn"
              aria-label={`Edit ${exercise.name}`}
              onClick={() =>
                onChange((e) => ({
                  ...e,
                  logged: false,
                  sets: [...e.sets, newSet(e.sets.at(-1)?.unit ?? "kg", e.sets.at(-1)?.weight)],
                }))
              }
            >
              <Pencil size={16} />
            </button>
            <button
              type="button"
              className="icon-btn"
              aria-label={`Delete ${exercise.name}`}
              onClick={confirmDelete}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        <ul className="mt-3 divide-y divide-border border-t border-border text-sm">
          {exercise.sets.map((set, i) => (
            <li key={set.id} className="flex justify-between py-2">
              <span className="text-muted">Set {i + 1}</span>
              <span className="font-mono">
                {set.weight} {set.unit} × {set.reps}
              </span>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  const doneCount = exercise.sets.filter((s) => s.done).length;
  // the set being entered is advised by the reps of the last logged one
  const lastDone = exercise.sets.findLast((s) => s.done);
  const advice = lastDone?.reps != null ? ADVICE[weightAdvice(lastDone.reps)] : null;

  const patchSet = (id: string, patch: Partial<SetEntry>) => {
    setError("");
    onChange((e) => ({
      ...e,
      sets: e.sets.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  };

  const changeUnit = (id: string, unit: WeightUnit) => {
    setPreferredUnit(unit);
    patchSet(id, { unit });
  };

  const addSet = (set: SetEntry) => {
    if (!isValidSet(set.weight, set.reps)) {
      setError("Enter a weight and a whole number of reps to log this set.");
      return;
    }
    setError("");
    // the next row starts from the same weight, since most sets repeat it
    onChange((e) => ({
      ...e,
      sets: [
        ...e.sets.map((s) => (s.id === set.id ? { ...s, done: true } : s)),
        newSet(set.unit, set.weight),
      ],
    }));
  };

  const removeSet = (id: string) => {
    setError("");
    onChange((e) => ({ ...e, sets: e.sets.filter((s) => s.id !== id) }));
  };

  const logExercise = () => {
    if (!exercise.name.trim()) return setError("Exercise name is required.");
    if (!exercise.targetPart) return setError("Select a target part.");
    if (exercise.sets.some((s) => s.done && !isValidSet(s.weight, s.reps))) {
      return setError("Every set needs a weight and a whole number of reps.");
    }
    setError("");
    // a fully filled-in last row counts as a set; an unfinished one is dropped
    onChange((e) => ({
      ...e,
      // reuse the spelling of an earlier log so one exercise keeps one name
      name:
        known.find((k) => k.name.toLowerCase() === e.name.trim().toLowerCase())?.name ??
        e.name.trim(),
      logged: true,
      sets: e.sets
        .filter((s) => s.done || isValidSet(s.weight, s.reps))
        .map((s) => ({ ...s, done: true })),
    }));
  };

  return (
    <section className="card border-foreground">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Exercise {index + 1}</h3>
        <button type="button" className="icon-btn" aria-label="Delete exercise" onClick={confirmDelete}>
          <Trash2 size={16} />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor={`name-${exercise.id}`}>
            Exercise name *
          </label>
          <ExerciseNameInput
            id={`name-${exercise.id}`}
            value={exercise.name}
            known={known}
            onChange={(name) => {
              setError("");
              onChange((e) => ({ ...e, name }));
            }}
            onPick={(picked) => {
              setError("");
              onChange((e) => ({ ...e, name: picked.name, targetPart: picked.targetPart }));
            }}
          />
        </div>
        <div>
          <label className="label" htmlFor={`part-${exercise.id}`}>
            Target part *
          </label>
          <select
            id={`part-${exercise.id}`}
            className="field"
            value={exercise.targetPart}
            onChange={(ev) => {
              setError("");
              onChange((e) => ({ ...e, targetPart: ev.target.value as TargetPart | "" }));
            }}
          >
            <option value="">Select…</option>
            {TARGET_PARTS.map((part) => (
              <option key={part} value={part}>
                {part}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="grid grid-cols-[1.25rem_1fr_auto_1fr_2.5rem] gap-2 text-xs font-medium tracking-wide text-muted uppercase">
          <span>#</span>
          <span>Weight</span>
          <span className="w-[5.5rem]">Unit</span>
          <span>Reps</span>
          <span />
        </div>
        {exercise.sets.map((set, i) => (
          <div
            key={set.id}
            className="grid grid-cols-[1.25rem_1fr_auto_1fr_2.5rem] items-center gap-2"
          >
            {!set.done && advice ? (
              <advice.icon size={18} strokeWidth={2.5} aria-label={advice.text} />
            ) : (
              <span className="text-sm text-muted">{i + 1}</span>
            )}
            <input
              className="field px-2"
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              placeholder="0"
              aria-label={`Set ${i + 1} weight`}
              value={set.weight ?? ""}
              onChange={(ev) => patchSet(set.id, { weight: toNumber(ev.target.value) })}
            />
            <div className="flex h-11 w-[5.5rem] overflow-hidden rounded-lg border border-border text-sm">
              {(["kg", "lbs"] as const).map((unit) => (
                <button
                  key={unit}
                  type="button"
                  aria-pressed={set.unit === unit}
                  onClick={() => changeUnit(set.id, unit)}
                  className={`flex-1 cursor-pointer ${
                    set.unit === unit ? "bg-foreground font-semibold text-background" : "text-muted"
                  }`}
                >
                  {unit}
                </button>
              ))}
            </div>
            <input
              className="field px-2"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              placeholder="0"
              aria-label={`Set ${i + 1} reps`}
              value={set.reps ?? ""}
              onChange={(ev) => patchSet(set.id, { reps: toNumber(ev.target.value) })}
              onKeyDown={(ev) => {
                if (ev.key === "Enter" && !set.done) addSet(set);
              }}
            />
            {set.done ? (
              <button
                type="button"
                className="icon-btn"
                aria-label={`Delete set ${i + 1}`}
                onClick={() => removeSet(set.id)}
              >
                <Trash2 size={16} />
              </button>
            ) : (
              <button
                type="button"
                className="icon-btn border-foreground bg-foreground text-background hover:bg-foreground hover:opacity-85"
                aria-label={`Log set ${i + 1}`}
                onClick={() => addSet(set)}
              >
                <Check size={18} />
              </button>
            )}
          </div>
        ))}
        {advice ? (
          <p className="flex items-center gap-1.5 text-xs font-medium">
            <advice.icon size={14} strokeWidth={2.5} aria-hidden="true" />
            {advice.text}
          </p>
        ) : (
          <p className="text-xs text-muted">
            Tap <Check size={12} className="inline" /> to log a set. The next one appears below it.
          </p>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-3 rounded-lg border border-foreground px-3 py-2 text-sm">
          {error}
        </p>
      )}

      {doneCount > 0 && (
        <button type="button" className="btn btn-primary mt-4 w-full" onClick={logExercise}>
          Log exercise · {doneCount} {doneCount === 1 ? "set" : "sets"}
        </button>
      )}
    </section>
  );
}
