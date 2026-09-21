import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/**
 * The look of every control in a form — the one `Field` renders, and the ones built by
 * hand (the editor's date field and its time dropdowns) that must sit beside it without
 * looking like a different form.
 */
export const fieldControl =
  "w-full rounded-2xl border border-rose-sombre/15 bg-white px-4 py-3 text-base text-charbon " +
  "placeholder:text-charbon/40 transition-colors focus:border-rose-vif focus:outline-none " +
  "disabled:cursor-not-allowed disabled:bg-creme disabled:text-charbon/50";

type CommonProps = {
  label: string;
  id: string;
  /** Guidance under the control, e.g. what leaving it blank does. */
  hint?: string;
  /** A validation message. It marks the control invalid and is announced with it. */
  error?: string;
  /**
   * Something that sits on the control's own row, to its right and centred on it (not on
   * the label or the hint), e.g. a publish switch beside a name.
   */
  aside?: ReactNode;
};

type InputFieldProps = CommonProps & {
  multiline?: false;
} & InputHTMLAttributes<HTMLInputElement>;

type TextareaFieldProps = CommonProps & {
  multiline: true;
} & TextareaHTMLAttributes<HTMLTextAreaElement>;

/**
 * The attributes that tie a control to the hint and the error rendered under it.
 *
 * Exported because a field can hold more than one control — a time is two dropdowns — and
 * each of them has to carry the same wiring, or a screen reader announces the message on
 * one half of the control and not the other.
 */
export function fieldAria(id: string, hint?: string, error?: string) {
  const ids = [hint ? `${id}-hint` : undefined, error ? `${id}-error` : undefined].filter(Boolean);
  return {
    "aria-describedby": ids.join(" ") || undefined,
    "aria-invalid": error ? true : undefined,
  } as const;
}

type FieldShellProps = CommonProps & {
  /** The control(s) this label, hint and error belong to. */
  children: ReactNode;
};

/**
 * The chrome around a form control: its label, an optional aside on the control's row,
 * the hint and the validation message.
 *
 * `Field` is this plus an `<input>`; a control the browser can't be trusted to render in
 * French (see the editor's DateField and TimeField) builds its own insides and wraps them
 * in this, so every field in a form still looks and announces the same.
 */
export function FieldShell({ label, id, hint, error, aside, children }: FieldShellProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-rose-sombre">
        {label}
      </label>
      {aside ? (
        <div className="flex items-center gap-4">
          <div className="flex-1">{children}</div>
          {aside}
        </div>
      ) : (
        children
      )}
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-charbon/60">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-sm font-semibold text-rose-sombre">
          {error}
        </p>
      )}
    </div>
  );
}

/** Labelled form control. The label is always rendered and associated for a11y. */
export function Field(props: InputFieldProps | TextareaFieldProps) {
  const { label, id, hint, error, aside, multiline, className, ...rest } = props;
  const shared = {
    id,
    className: cn(fieldControl, multiline && "resize-y", error && "border-rose-sombre", className),
    ...fieldAria(id, hint, error),
  };

  return (
    <FieldShell label={label} id={id} hint={hint} error={error} aside={aside}>
      {multiline ? (
        <textarea rows={4} {...shared} {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)} />
      ) : (
        <input {...shared} {...(rest as InputHTMLAttributes<HTMLInputElement>)} />
      )}
    </FieldShell>
  );
}
