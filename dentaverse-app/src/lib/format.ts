const currencyFormatter = new Intl.NumberFormat("en-IQ", {
  style: "currency",
  currency: "IQD",
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return currencyFormatter.format(0);
  }
  return currencyFormatter.format(value);
}

export function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return percentFormatter.format(0);
  }
  return percentFormatter.format(value);
}

export function formatCompactNumber(value: number | null | undefined) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value ?? 0);
}










