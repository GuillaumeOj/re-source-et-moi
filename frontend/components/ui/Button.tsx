import { ArrowRight } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary";

const base =
  "group inline-flex items-center justify-center gap-2 rounded-full font-semibold " +
  "px-6 py-3 text-[0.95rem] leading-none transition-all duration-200 " +
  "hover:-translate-y-0.5 focus-visible:-translate-y-0.5";

// Solid primary pairs dark/cream for bulletproof AA contrast (>=10:1).
const variants: Record<Variant, string> = {
  primary: "bg-rose-sombre text-creme shadow-soft hover:bg-rose-sombre-deep",
  // Solid fills (not translucent) so a background element can't show through, hover included.
  secondary:
    "border border-rose-sombre/25 text-rose-sombre bg-rose-tendre hover:bg-rose-tendre-deep",
};

type CommonProps = {
  variant?: Variant;
  children: ReactNode;
  iconRight?: ReactNode;
  /** A trailing arrow that nudges right on hover — for links that lead somewhere. */
  arrow?: boolean;
  className?: string;
};

const arrowIcon = (
  <ArrowRight
    size={16}
    aria-hidden="true"
    className="transition-transform group-hover:translate-x-1"
  />
);

type ButtonAsLink = CommonProps & { href: string };
type ButtonAsButton = CommonProps & ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

export function Button(props: ButtonAsLink | ButtonAsButton) {
  const { variant = "primary", children, arrow, className } = props;
  const classes = cn(base, variants[variant], className);
  const iconRight = arrow ? arrowIcon : props.iconRight;

  if ("href" in props && props.href !== undefined) {
    return (
      <a href={props.href} className={classes}>
        {children}
        {iconRight}
      </a>
    );
  }

  const { variant: _v, children: _c, iconRight: _i, arrow: _a, className: _cn, ...rest } = props;
  return (
    <button type="button" className={classes} {...rest}>
      {children}
      {iconRight}
    </button>
  );
}
