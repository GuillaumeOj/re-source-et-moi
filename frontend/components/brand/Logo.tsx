import {
  LOGO_FIGURE_PATH,
  LOGO_GROUP_TRANSFORM,
  LOGO_VIEWBOX,
  LOGO_WORDMARK_PATH,
} from "./logo-paths";

type LogoProps = {
  /** Accessible label; set to "" for decorative use alongside visible text. */
  title?: string;
  className?: string;
};

/**
 * The official Re-Source Et Moi mark: a single-stroke figure tracing the Lazy 8,
 * with the "Re-Source Et Moi" wordmark (Freestyle Script, outlined). Renders in
 * `currentColor`, so the rose-sombre / inverted-white variants come from CSS.
 */
export function Logo({ title = "Re-Source Et Moi", className }: LogoProps) {
  const decorative = title === "";
  return (
    <svg
      viewBox={LOGO_VIEWBOX}
      className={className}
      fill="currentColor"
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : title}
      aria-hidden={decorative ? true : undefined}
    >
      <g transform={LOGO_GROUP_TRANSFORM}>
        <path d={LOGO_FIGURE_PATH} />
        <path d={LOGO_WORDMARK_PATH} />
      </g>
    </svg>
  );
}
