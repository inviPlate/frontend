/**
 * Fiscal year runs April through March. Label is "startYear-endYear"
 * (e.g. April 2025–March 2026 → "2025-2026").
 */
export function getCurrentFiscalYearLabel(date: Date = new Date()): string {
  const month = date.getMonth();
  const year = date.getFullYear();
  const startYear = month >= 3 ? year : year - 1;
  return `${startYear}-${startYear + 1}`;
}
