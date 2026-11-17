// ページの searchParams は、同じ名前が URL に何度出てきたかで string と string[] のどちらにもなる（studio の lib/search-params.ts から、使うものだけ写した）

export function first(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

// 同じ名前を何度も渡せる条件（所持カードの種類の絞り込み等）を、並びにする
export function all(value: string | string[] | undefined): string[] {
  if (value === undefined) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}
