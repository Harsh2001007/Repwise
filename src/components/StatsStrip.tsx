import { todayISO } from "@/lib/date";
import { currentStreak, totalVolume, trainedDates, weekOf } from "@/lib/stats";
import type { WeightUnit, Workout } from "@/lib/types";

const compact = new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 });

export default function StatsStrip({ workouts, unit }: { workouts: Workout[]; unit: WeightUnit }) {
  const today = todayISO();
  const week = weekOf(today);
  const trained = trainedDates(workouts);
  const thisWeek = workouts.filter((w) => week.includes(w.date));

  const stats = [
    { label: "This week", value: String(week.filter((d) => trained.has(d)).length), suffix: "/ 7" },
    { label: "Day streak", value: String(currentStreak(trained, today)), suffix: "" },
    { label: "Week volume", value: compact.format(totalVolume(thisWeek, unit)), suffix: unit },
  ];

  return (
    <dl className="grid grid-cols-3 gap-3">
      {stats.map(({ label, value, suffix }) => (
        <div key={label} className="card p-3">
          <dd className="flex items-baseline gap-1 tabular-nums">
            <span className="text-2xl font-bold tracking-tight">{value}</span>
            {suffix && <span className="text-xs text-muted">{suffix}</span>}
          </dd>
          <dt className="mt-0.5 text-xs text-muted">{label}</dt>
        </div>
      ))}
    </dl>
  );
}
