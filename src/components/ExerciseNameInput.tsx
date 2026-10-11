"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import type { KnownExercise } from "@/lib/workout";

const MAX_SUGGESTIONS = 6;

interface Props {
  id: string;
  value: string;
  known: KnownExercise[];
  onChange: (name: string) => void;
  /** the user chose an exercise they have logged before */
  onPick: (exercise: KnownExercise) => void;
}

export default function ExerciseNameInput({ id, value, known, onChange, onPick }: Props) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const query = value.trim().toLowerCase();
  const matches = known
    .filter((k) => k.name.toLowerCase().includes(query))
    // names that start with what was typed come first
    .sort(
      (a, b) =>
        Number(b.name.toLowerCase().startsWith(query)) -
        Number(a.name.toLowerCase().startsWith(query)),
    )
    .slice(0, MAX_SUGGESTIONS);
  const isNew = query !== "" && !known.some((k) => k.name.toLowerCase() === query);
  const optionCount = matches.length + (isNew ? 1 : 0);
  const listId = `${id}-suggestions`;

  // the "new" option keeps the typed name, so only known ones need applying
  const choose = (index: number) => {
    if (index < matches.length) onPick(matches[index]);
    setOpen(false);
  };

  const optionClass = (index: number) =>
    `flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm ${
      index === active ? "bg-surface" : ""
    }`;

  return (
    <div className="relative">
      <input
        id={id}
        className="field"
        placeholder="e.g. Bench press"
        autoComplete="off"
        role="combobox"
        aria-expanded={open && optionCount > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "Escape") return setOpen(false);
          if (optionCount === 0) return;
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            const step = e.key === "ArrowDown" ? 1 : -1;
            setActive(open ? (active + step + optionCount) % optionCount : 0);
            setOpen(true);
          } else if (e.key === "Enter" && open) {
            e.preventDefault();
            choose(active);
          }
        }}
      />

      {open && optionCount > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full z-30 mt-1 max-h-72 animate-fade-in overflow-y-auto rounded-xl border border-border bg-background p-1 shadow-xl"
          // keep focus in the input so a tap selects before blur closes the list
          onMouseDown={(e) => e.preventDefault()}
        >
          {matches.map((exercise, i) => (
            <li key={exercise.name} role="option" aria-selected={i === active}>
              <button
                type="button"
                tabIndex={-1}
                className={optionClass(i)}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(i)}
              >
                <span className="truncate">{exercise.name}</span>
                <span className="shrink-0 text-xs text-muted">{exercise.targetPart}</span>
              </button>
            </li>
          ))}
          {isNew && (
            <li role="option" aria-selected={active === matches.length}>
              <button
                type="button"
                tabIndex={-1}
                className={optionClass(matches.length)}
                onMouseEnter={() => setActive(matches.length)}
                onClick={() => choose(matches.length)}
              >
                <span className="truncate">{value.trim()}</span>
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
                  <Plus size={12} />
                  New
                </span>
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
