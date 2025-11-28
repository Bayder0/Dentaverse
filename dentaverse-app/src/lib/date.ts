export function getMonthKey(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function getPreviousMonthKey(monthKey: string) {
  const [yearStr, monthStr] = monthKey.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const newMonth = month === 1 ? 12 : month - 1;
  const newYear = month === 1 ? year - 1 : year;
  return `${newYear}-${String(newMonth).padStart(2, "0")}`;
}

export function getQuarter(date: Date) {
  return Math.floor(date.getUTCMonth() / 3) + 1;
}

export function getQuarterKey(date: Date) {
  return `${date.getUTCFullYear()}-Q${getQuarter(date)}`;
}

export function getYearKey(date: Date) {
  return `${date.getUTCFullYear()}`;
}

