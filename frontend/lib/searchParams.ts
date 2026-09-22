/** A page's `searchParams`, once awaited. */
export type SearchParams = Record<string, string | string[] | undefined>;

/** A single query value; a repeated one (`?vue=a&vue=b`) counts as absent. */
export function param(params: SearchParams, name: string): string | undefined {
  const value = params[name];
  return typeof value === "string" ? value : undefined;
}
