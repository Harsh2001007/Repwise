import { Check } from "lucide-react";
import { todayISO } from "@/lib/date";
import { weekOf } from "@/lib/stats";

const DAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];

/** Seven dots, Monday to Sunday, filled for the days of this week with a logged workout. */
export default function WeekStrip({ trained }: { trained: Set<string> }) {
  const today = todayISO();
  const week = weekOf(today);
  const count = week.filter((d) => trained.has(d)).length;

  return (
    <section className="card">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold">This week</h2>
        <p className="text-xs text-muted">
          {count} of 7 days trained
        </p>
      </div>
      <ol className="grid grid-cols-7 gap-2">
        {week.map((date, i) => {
          const done = trained.has(date);
          return (
            <li key={date} className="flex flex-col items-center gap-1.5">
              <span
                className={`text-xs ${date === today ? "font-bold text-accent-text" : "text-muted"}`}
              >
                {DAY_LETTERS[i]}
              </span>
              <span
                aria-label={`${date}: ${done ? "trained" : date > today ? "upcoming" : "rest"}`}
                className={`flex size-8 items-center justify-center rounded-full ${
                  done
                    ? "bg-accent text-accent-foreground"
                    : date === today
                      ? "border-2 border-accent"
                      : date > today
                        ? "border border-dashed border-border"
                        : "bg-surface"
                }`}
              >
                {done && <Check size={16} strokeWidth={3} />}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
