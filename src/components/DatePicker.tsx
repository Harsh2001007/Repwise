"use client";

import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { addDays, formatDate, parseISODate, toISODate, todayISO } from "@/lib/date";

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

interface Props {
  value: string;
  onChange: (date: string) => void;
  /** days that already have a logged workout get a dot */
  marked: Set<string>;
}

export default function DatePicker({ value, onChange, marked }: Props) {
  const today = todayISO();
  const [open, setOpen] = useState(false);
  // first day of the month being browsed
  const [view, setView] = useState(() => value.slice(0, 7) + "-01");

  const viewDate = parseISODate(view);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingBlanks = (viewDate.getDay() + 6) % 7; // Monday-first
  const canGoNextMonth = toISODate(new Date(year, month + 1, 1)) <= today;

  const select = (date: string) => {
    onChange(date);
    setView(date.slice(0, 7) + "-01");
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="icon-btn"
          aria-label="Previous day"
          onClick={() => select(addDays(value, -1))}
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          className="btn flex-1 justify-between"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <span className="flex items-center gap-2">
            <CalendarDays size={18} />
            {value === today ? `Today, ${formatDate(value)}` : formatDate(value)}
          </span>
          <ChevronDown size={16} className={open ? "rotate-180" : ""} />
        </button>
        <button
          type="button"
          className="icon-btn"
          aria-label="Next day"
          disabled={value >= today}
          onClick={() => select(addDays(value, 1))}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {open && (
        <div className="card absolute inset-x-0 top-full z-30 mt-2 animate-fade-in border-border shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              className="icon-btn size-9"
              aria-label="Previous month"
              onClick={() => setView(toISODate(new Date(year, month - 1, 1)))}
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-semibold">
              {viewDate.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
            </span>
            <button
              type="button"
              className="icon-btn size-9"
              aria-label="Next month"
              disabled={!canGoNextMonth}
              onClick={() => setView(toISODate(new Date(year, month + 1, 1)))}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEKDAYS.map((d) => (
              <span key={d} className="py-1 text-xs text-muted">
                {d}
              </span>
            ))}
            {Array.from({ length: leadingBlanks }, (_, i) => (
              <span key={`blank-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const date = toISODate(new Date(year, month, i + 1));
              const selected = date === value;
              return (
                <button
                  key={date}
                  type="button"
                  disabled={date > today}
                  aria-pressed={selected}
                  onClick={() => {
                    select(date);
                    setOpen(false);
                  }}
                  className={`relative flex aspect-square cursor-pointer items-center justify-center rounded-lg text-sm disabled:cursor-not-allowed disabled:opacity-25 ${
                    selected
                      ? "bg-accent font-semibold text-accent-foreground"
                      : date === today
                        ? "border border-accent"
                        : "hover:bg-surface"
                  }`}
                >
                  {i + 1}
                  {marked.has(date) && (
                    <span
                      className={`absolute bottom-1 size-1 rounded-full ${
                        selected ? "bg-accent-foreground" : "bg-accent"
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {value !== today && (
            <button
              type="button"
              className="btn mt-3 h-9 w-full"
              onClick={() => {
                select(today);
                setOpen(false);
              }}
            >
              Jump to today
            </button>
          )}
        </div>
      )}
    </div>
  );
}
