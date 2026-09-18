import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const fieldBase =
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

/** Labelled form control. The label is always rendered and associated for a11y. */
export function Field(props: InputFieldProps | TextareaFieldProps) {
  const { label, id, hint, error, aside, multiline, className, ...rest } = props;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const shared = {
    id,
    className: cn(fieldBase, multiline && "resize-y", error && "border-rose-sombre", className),
    "aria-describedby": [hintId, errorId].filter(Boolean).join(" ") || undefined,
    "aria-invalid": error ? true : undefined,
  };
  const control = multiline ? (
    <textarea rows={4} {...shared} {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)} />
  ) : (
    <input {...shared} {...(rest as InputHTMLAttributes<HTMLInputElement>)} />
  );

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-rose-sombre">
        {label}
      </label>
      {aside ? (
        <div className="flex items-center gap-4">
          <div className="flex-1">{control}</div>
          {aside}
        </div>
      ) : (
        control
      )}
      {hint && (
        <p id={hintId} className="text-xs text-charbon/60">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm font-semibold text-rose-sombre">
          {error}
        </p>
      )}
    </div>
  );
}
