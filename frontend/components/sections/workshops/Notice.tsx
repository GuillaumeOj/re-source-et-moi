/** The line shown in place of a list that is empty or could not be loaded. */
export function Notice({ children }: { children: string }) {
  return <p className="mt-8 text-sm text-charbon/60">{children}</p>;
}
