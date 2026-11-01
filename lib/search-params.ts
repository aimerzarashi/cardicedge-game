// ページの searchParams は、同じ名前が URL に何度出てきたかで string と string[] のどちらにもなる（studio の lib/search-params.ts から、使うものだけ写した）

export function first(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
