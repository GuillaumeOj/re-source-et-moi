"use client";

import { FieldShell, fieldAria, fieldControl } from "@/components/ui/Field";
import { cn } from "@/lib/cn";
import { useDraftValue } from "./useDraftValue";

type TimeFieldProps = {
  label: string;
  id: string;
  /** The stored time, "HH:MM" on a 24-hour clock. Empty when nothing is set yet. */
  value: string;
  onChange: (time: string) => void;
  error?: string;
  required?: boolean;
};

/** Workshops start and end on the quarter or the half hour; five minutes is finer still. */
const MINUTE_STEP = 5;

const HOURS = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 / MINUTE_STEP }, (_, index) =>
  String(index * MINUTE_STEP).padStart(2, "0"),
);

/**
 * An hour and a minute, on a 24-hour clock, as two dropdowns.
 *
 * Not `<input type="time">`: a browser draws that one in *its own* interface language, so
 * on a machine set to English it asks for an AM/PM the rest of the form knows nothing
 * about. Dropdowns also make the two common mistakes impossible — a time that isn't one,
 * and 8h typed for 20h.
 */
/** "10:30:00" → ["10", "30"]; nothing → two blanks. */
function split(time: string): [string, string] {
  const [hour = "", minute = ""] = time ? time.split(":") : [];
  return [hour, minute];
}

/** A dropdown's options, led by the blank one an unset half shows. */
function options(values: string[]) {
  return (
    <>
      <option value="">--</option>
      {values.map((value) => (
        <option key={value} value={value}>
          {value}
        </option>
      ))}
    </>
  );
}

export function TimeField({ label, id, value, onChange, error, required }: TimeFieldProps) {
  // Half a time is kept here rather than pushed up as one: choosing 30 first and the hour
  // second is an ordinary way to fill this in, and completing the other half for her would
  // send 00:30 — midnight — for a workshop she means to start at 14:30.
  const [[hour, minute], write] = useDraftValue(value, onChange, split);

  const aria = fieldAria(id, undefined, error);
  // The native arrow stays: with `appearance-none` and nothing in its place the two
  // dropdowns read as text boxes, and the only way to find out they aren't is to click.
  const selectClass = cn(fieldControl, "text-center", error && "border-rose-sombre");

  // A time already stored off the step (an older workshop at 10:47) keeps its own option,
  // so opening it for a change of title never quietly moves it to 10:45.
  const minutes = minute && !MINUTES.includes(minute) ? [...MINUTES, minute].sort() : MINUTES;

  // Only a whole time is a time. Until both halves are chosen the draft holds none, and
  // the form's own "required" is what says so.
  function set(nextHour: string, nextMinute: string) {
    write([nextHour, nextMinute], nextHour && nextMinute ? `${nextHour}:${nextMinute}` : "");
  }

  return (
    <FieldShell label={label} id={id} error={error}>
      <div className="flex items-center gap-1">
        <select
          // The visible label points here, so the field still answers to its own name.
          id={id}
          required={required}
          value={hour}
          onChange={(event) => set(event.target.value, minute)}
          className={selectClass}
          {...aria}
        >
          {options(HOURS)}
        </select>
        <span aria-hidden="true" className="font-semibold text-charbon/60">
          :
        </span>
        <select
          aria-label={`${label} — minutes`}
          required={required}
          value={minute}
          onChange={(event) => set(hour, event.target.value)}
          className={selectClass}
          {...aria}
        >
          {options(minutes)}
        </select>
      </div>
    </FieldShell>
  );
}
