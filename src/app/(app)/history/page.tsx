"use client";

import { ChevronRight, Download } from "lucide-react";
import { useState } from "react";
import BottomSheet from "@/components/BottomSheet";
import { addDays, formatDate, formatTime, todayISO } from "@/lib/date";
import { useStore } from "@/lib/store";
import { loggedExercises, workoutTitle } from "@/lib/workout";

export default function HistoryPage() {
  const { workouts, profile } = useStore();
  const [openId, setOpenId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [exporting, setExporting] = useState(false);

  const history = workouts
    .filter((w) => loggedExercises(w).length > 0)
    .sort((a, b) => b.date.localeCompare(a.date) || b.startedAt.localeCompare(a.startedAt));
  const open = history.find((w) => w.id === openId);

  const exportLastWeek = async () => {
    const to = todayISO();
    const from = addDays(to, -6);
    const week = history.filter((w) => w.date >= from && w.date <= to).reverse();
    if (week.length === 0) {
      setNotice("No workouts logged in the last 7 days.");
      return;
    }
    setNotice("");
    setExporting(true);
    try {
      const { exportWorkoutsPdf } = await import("@/lib/pdf");
      await exportWorkoutsPdf(week, { from, to, userName: profile.name });
    } catch {
      setNotice("Could not create the PDF. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">History</h1>
        <button type="button" className="btn" onClick={exportLastWeek} disabled={exporting}>
          <Download size={16} />
          {exporting ? "Exporting…" : "Export 7 days"}
        </button>
      </div>

      {notice && (
        <p role="status" className="rounded-lg border border-border px-3 py-2 text-sm">
          {notice}
        </p>
      )}

      {history.length === 0 ? (
        <div className="card py-12 text-center">
          <p className="font-semibold">Nothing here yet</p>
          <p className="mt-1 text-sm text-muted">Workouts you log will show up here.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {history.map((workout) => {
            const exercises = loggedExercises(workout);
            const sets = exercises.reduce((n, e) => n + e.sets.length, 0);
            return (
              <li key={workout.id}>
                <button
                  type="button"
                  onClick={() => setOpenId(workout.id)}
                  className="card flex w-full cursor-pointer items-center justify-between gap-3 text-left transition-colors hover:bg-surface"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{workoutTitle(workout)}</p>
                    <p className="mt-0.5 text-sm text-muted">
                      {formatDate(workout.date)} · {formatTime(workout.startedAt)}
                    </p>
                    <p className="mt-2 text-xs text-muted">
                      {exercises.length} {exercises.length === 1 ? "exercise" : "exercises"} · {sets}{" "}
                      {sets === 1 ? "set" : "sets"}
                    </p>
                  </div>
                  <ChevronRight size={18} className="shrink-0 text-muted" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {open && (
        <BottomSheet
          title={workoutTitle(open)}
          subtitle={`${formatDate(open.date)} · ${formatTime(open.startedAt)}`}
          onClose={() => setOpenId(null)}
        >
          <div className="space-y-5">
            {loggedExercises(open).map((exercise) => (
              <div key={exercise.id}>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="truncate font-semibold">{exercise.name}</h3>
                  <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-xs text-muted">
                    {exercise.targetPart}
                  </span>
                </div>
                <ul className="mt-2 divide-y divide-border border-y border-border text-sm">
                  {exercise.sets.map((set, i) => (
                    <li key={set.id} className="flex justify-between py-2">
                      <span className="text-muted">Set {i + 1}</span>
                      <span className="font-mono">
                        {set.weight} {set.unit} × {set.reps}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </BottomSheet>
      )}
    </div>
  );
}
