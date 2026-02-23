export function parseMonthParam(monthParam?: string | null) {
  const now = new Date();
  if (!monthParam) return { year: now.getFullYear(), month: now.getMonth() + 1 };
  const match = monthParam.match(/^(\d{4})-(\d{2})$/);
  if (!match) throw new Error("Paramètre month invalide (attendu YYYY-MM)");
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) throw new Error("Mois invalide");
  return { year, month };
}

export function monthKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}
