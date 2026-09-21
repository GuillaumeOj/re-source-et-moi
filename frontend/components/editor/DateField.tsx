"use client";

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { type RefObject, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { FieldShell, fieldAria, fieldControl } from "@/components/ui/Field";
import {
  addMonths,
  DATE_PLACEHOLDER,
  firstOf,
  formatMonthHeading,
  isInMonth,
  isWrittenInFull,
  type Month,
  monthOf,
  monthWeeks,
  parseFrenchDate,
  toFrenchDate,
  WEEKDAYS,
} from "@/lib/calendar";
import { cn } from "@/lib/cn";
import { formatFullDate, parisToday } from "@/lib/format";
import { IconButton } from "./IconButton";
import { useDraftValue } from "./useDraftValue";

type DateFieldProps = {
  label: string;
  id: string;
  /** The stored date, ISO "YYYY-MM-DD". Empty when nothing is set yet. */
  value: string;
  onChange: (isoDate: string) => void;
  error?: string;
  required?: boolean;
};

const INCOMPLETE = `Date incomplète — ${DATE_PLACEHOLDER}.`;
/** A date can also be finished and still name no day: 31/04, or 29/02 outside a leap year. */
const UNREAL = "Cette date n'existe pas.";

/** Which of the two ways the text isn't a date — still being written, or written and unreal. */
function typoMessage(text: string): string {
  return isWrittenInFull(text) ? UNREAL : INCOMPLETE;
}

/**
 * A date written the way it is written here: jj/mm/aaaa, with a calendar to pick from.
 *
 * Not `<input type="date">`. A browser draws that one in *its own* interface language, so
 * on a machine set to English it reads mm/dd/yyyy however French the page around it is —
 * and nothing in the page can overrule it. The value still travels as ISO; only the
 * writing and the reading happen here.
 */
export function DateField({ label, id, value, onChange, error, required }: DateFieldProps) {
  const [text, write] = useDraftValue(value, onChange, toFrenchDate);
  const [typo, setTypo] = useState(false);
  const [open, setOpen] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * Closing on Escape or on a pick puts focus back where the typing happens — leaving it
   * on a button that no longer exists drops it on the document, and tabbing starts from
   * the top of the page. A click outside is already a move somewhere else, so it doesn't.
   *
   * Stable, so the popover hangs its document listeners once instead of re-hanging them
   * on every keystroke in the field.
   */
  const close = useCallback((refocus: boolean) => {
    setOpen(false);
    if (refocus) {
      inputRef.current?.focus();
    }
  }, []);

  // What is written is what will be saved: a date still being typed is no date, so the
  // draft holds none. Leaving the last complete one in there would save a day she is not
  // looking at, from a field that shows something else.
  function handleText(next: string) {
    setTypo(false);
    write(next, parseFrenchDate(next) ?? "");
  }

  function pick(isoDate: string) {
    setTypo(false);
    write(toFrenchDate(isoDate), isoDate);
    close(true);
  }

  // Said out loud on the way out of the field, rather than left to the server to phrase as
  // a missing date.
  const shownError = error ?? (typo ? typoMessage(text) : undefined);

  return (
    <FieldShell label={label} id={id} error={shownError}>
      <div ref={rowRef} className="relative flex items-center gap-1">
        <input
          ref={inputRef}
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          maxLength={10}
          required={required}
          placeholder={DATE_PLACEHOLDER}
          value={text}
          onChange={(event) => handleText(event.target.value)}
          // Coming back to the input is a choice to type the date rather than pick it, and
          // the calendar hangs over the fields below: a click in here is "inside" as far as
          // the outside-click handler is concerned, so it has to close it itself.
          onFocus={() => setOpen(false)}
          onBlur={() => setTypo(text.trim() !== "" && parseFrenchDate(text) === null)}
          className={cn(fieldControl, shownError && "border-rose-sombre")}
          {...fieldAria(id, undefined, shownError)}
        />
        <IconButton
          label={open ? "Fermer le calendrier" : "Choisir dans le calendrier"}
          onClick={() => setOpen((current) => !current)}
          opens="dialog"
          expanded={open}
        >
          <CalendarDays size={20} aria-hidden="true" />
        </IconButton>
        {open && <DatePopover selected={value} onPick={pick} onClose={close} anchorRef={rowRef} />}
      </div>
    </FieldShell>
  );
}

type DatePopoverProps = {
  selected: string;
  onPick: (isoDate: string) => void;
  /** `refocus` is true when it closed from inside — Escape — and not from a click away. */
  onClose: (refocus: boolean) => void;
  anchorRef: RefObject<HTMLDivElement | null>;
};

/** How a day reads in the grid, most particular state first. */
function dayTone(isSelected: boolean, isToday: boolean, inMonth: boolean): string {
  if (isSelected) {
    return "bg-rose-vif text-creme";
  }
  if (isToday) {
    return "bg-rose-sombre text-creme";
  }
  if (inMonth) {
    return "bg-white text-charbon hover:bg-rose-tendre";
  }
  return "text-charbon/40 hover:bg-rose-tendre";
}

/** The same month grid as the agenda's calendar view, sized to sit under a field. */
function DatePopover({ selected, onPick, onClose, anchorRef }: DatePopoverProps) {
  const today = parisToday();
  const [month, setMonth] = useState<Month>(() => monthOf(selected || today));
  const headingId = useId();
  const weeks = useMemo(() => monthWeeks(month), [month]);
  const openedOn = useRef<HTMLButtonElement>(null);

  // Opening moves focus into the calendar — on the selected day, or on the 1st of the
  // month shown — so the arrow keys and Escape act on it straight away and a screen
  // reader lands in the dialog it just announced. Closing puts focus back on the input.
  useEffect(() => {
    openedOn.current?.focus();
  }, []);

  // Escape and a click outside both close it, as any menu does. The listeners hang off the
  // document because the click that closes it lands anywhere but here.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose(true);
      }
    }
    function onPointerDown(event: PointerEvent) {
      if (!anchorRef.current?.contains(event.target as Node)) {
        onClose(false);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [onClose, anchorRef]);

  const focusOn = selected && isInMonth(selected, month) ? selected : firstOf(month);

  return (
    <div
      role="dialog"
      aria-labelledby={headingId}
      className="absolute top-full right-0 z-20 mt-2 w-80 rounded-3xl bg-creme p-4 shadow-soft-lg"
    >
      <div className="flex items-center justify-between gap-1">
        <IconButton label="Mois précédent" onClick={() => setMonth(addMonths(month, -1))}>
          <ChevronLeft size={18} aria-hidden="true" />
        </IconButton>
        <h3 id={headingId} className="text-lg" aria-live="polite">
          {formatMonthHeading(month)}
        </h3>
        <IconButton label="Mois suivant" onClick={() => setMonth(addMonths(month, 1))}>
          <ChevronRight size={18} aria-hidden="true" />
        </IconButton>
      </div>

      <table className="mt-2 w-full table-fixed border-separate border-spacing-0.5">
        <thead>
          <tr>
            {WEEKDAYS.map((day) => (
              <th
                key={day}
                scope="col"
                className="pb-1 text-[0.65rem] font-semibold uppercase text-charbon/60"
              >
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => (
            <tr key={week[0]}>
              {week.map((day) => {
                const inMonth = isInMonth(day, month);
                const isSelected = day === selected;
                return (
                  <td key={day} className="p-0">
                    <button
                      ref={day === focusOn ? openedOn : undefined}
                      type="button"
                      onClick={() => onPick(day)}
                      aria-label={formatFullDate(day)}
                      aria-pressed={isSelected}
                      // Today is otherwise only a colour, which is no help to a screen
                      // reader — or to anyone who can't tell this pink from that one.
                      aria-current={day === today ? "date" : undefined}
                      className={cn(
                        "flex h-9 w-full items-center justify-center rounded-xl text-sm font-semibold transition-colors",
                        dayTone(isSelected, day === today, inMonth),
                      )}
                    >
                      {Number(day.slice(8))}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
