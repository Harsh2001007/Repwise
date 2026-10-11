import type { SetEntry } from "@/lib/types";

/** Read-only list of logged sets, with weight and reps as the loudest thing on the row. */
export default function SetRows({ sets }: { sets: SetEntry[] }) {
  return (
    <ul className="divide-y divide-border">
      {sets.map((set, i) => (
        <li key={set.id} className="flex items-baseline justify-between py-2.5">
          <span className="text-sm text-muted">Set {i + 1}</span>
          <span className="flex items-baseline gap-1 tabular-nums">
            <span className="text-2xl font-bold tracking-tight">{set.weight}</span>
            <span className="text-sm text-muted">{set.unit}</span>
            <span className="mx-1.5 text-muted">×</span>
            <span className="text-2xl font-bold tracking-tight">{set.reps}</span>
            <span className="text-sm text-muted">reps</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
