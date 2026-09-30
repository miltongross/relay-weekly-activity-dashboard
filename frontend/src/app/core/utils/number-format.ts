// Explicit sign prefix so a positive difference is never ambiguous with a plain number.
export function formatSignedNumber(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  const sign = rounded > 0 ? '+' : '';
  return `${sign}${rounded}`;
}
