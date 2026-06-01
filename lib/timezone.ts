export const DEFAULT_TIME_ZONE = "America/Los_Angeles";

function partsFor(date: Date, timeZone = DEFAULT_TIME_ZONE) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  });

  return Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
}

export function zonedDateKey(date = new Date(), timeZone = DEFAULT_TIME_ZONE) {
  const parts = partsFor(date, timeZone);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function browserDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function zonedHour(date = new Date(), timeZone = DEFAULT_TIME_ZONE) {
  return Number(partsFor(date, timeZone).hour ?? 0);
}

export function zonedLongDate(date = new Date(), timeZone = DEFAULT_TIME_ZONE) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

export function dateKeyToUtcDate(dateKey: string) {
  return new Date(`${dateKey}T12:00:00.000Z`);
}

export function formatDateKey(dateKey: string, options: Intl.DateTimeFormatOptions, timeZone = "UTC") {
  return new Intl.DateTimeFormat("en-US", { timeZone, ...options }).format(dateKeyToUtcDate(dateKey));
}

export function addDaysToDateKey(dateKey: string, days: number) {
  const date = dateKeyToUtcDate(dateKey);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function monthStartKey(dateKey: string) {
  return `${dateKey.slice(0, 7)}-01`;
}

export function yearStartKey(dateKey: string) {
  return `${dateKey.slice(0, 4)}-01-01`;
}

export function quarterStartKey(dateKey: string) {
  const year = dateKey.slice(0, 4);
  const month = Number(dateKey.slice(5, 7));
  const quarterStart = Math.floor((month - 1) / 3) * 3 + 1;
  return `${year}-${String(quarterStart).padStart(2, "0")}-01`;
}

export function addMonthsToDateKey(dateKey: string, months: number) {
  const year = Number(dateKey.slice(0, 4));
  const month = Number(dateKey.slice(5, 7));
  const day = Number(dateKey.slice(8, 10));
  const date = new Date(Date.UTC(year, month - 1 + months, 1, 12));
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 12)).getUTCDate();
  date.setUTCDate(Math.min(day, lastDay));
  return date.toISOString().slice(0, 10);
}
