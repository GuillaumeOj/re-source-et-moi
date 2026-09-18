import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const fieldBase =
  "w-full rounded-2xl border border-rose-sombre/15 bg-white px-4 py-3 text-base text-charbon " +
  "placeholder:text-charbon/40 transition-colors focus:border-rose-vif focus:outline-none";

type InputFieldProps = {
  label: string;
  id: string;
  multiline?: false;
} & InputHTMLAttributes<HTMLInputElement>;

type TextareaFieldProps = {
  label: string;
  id: string;
  multiline: true;
} & TextareaHTMLAttributes<HTMLTextAreaElement>;

/** Labelled form control. The label is always rendered and associated for a11y. */
export function Field(props: InputFieldProps | TextareaFieldProps) {
  if (props.multiline) {
    const { label, id, multiline: _multiline, className, ...rest } = props;
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={id} className="text-sm font-semibold text-rose-sombre">
          {label}
        </label>
        <textarea id={id} rows={4} className={cn(fieldBase, "resize-y", className)} {...rest} />
      </div>
    );
  }

  const { label, id, multiline: _multiline, className, ...rest } = props;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-rose-sombre">
        {label}
      </label>
      <input id={id} className={cn(fieldBase, className)} {...rest} />
    </div>
  );
}
