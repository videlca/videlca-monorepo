// src/common/utils/date-helpers.ts
export function toUTCDateOnly(d: Date | string): Date {
  const dt = new Date(d);
  return new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate()));
}

export function endOfMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0));
}

export function minDate(a: Date, b: Date): Date {
  return a < b ? a : b;
}

export function maxDate(a: Date, b: Date): Date {
  return a > b ? a : b;
}

export function diffDaysInclusive(a: Date, b: Date): number {
  const MS = 24 * 60 * 60 * 1000;
  return Math.floor((toUTCDateOnly(b).getTime() - toUTCDateOnly(a).getTime()) / MS) + 1;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function fmtYMD(d: Date): string {
  return d.toISOString().slice(0, 10);
}