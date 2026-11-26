import { market } from "./config";

const money = new Intl.NumberFormat(market.locale, {
  style: "currency",
  currency: market.currency,
  maximumFractionDigits: 0,
});
const moneyExact = new Intl.NumberFormat(market.locale, {
  style: "currency",
  currency: market.currency,
  minimumFractionDigits: 2,
});

/** 12500 → "$125" (whole dollars), 12550 → "$125.50". */
export function formatMoney(cents: number): string {
  return cents % 100 === 0 ? money.format(cents / 100) : moneyExact.format(cents / 100);
}

export function formatDate(d: Date | string | null | undefined, opts?: Intl.DateTimeFormatOptions): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString(market.locale, {
    timeZone: market.timeZone,
    year: "numeric",
    month: "long",
    day: "numeric",
    ...opts,
  });
}

export function formatDateTime(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString(market.locale, {
    timeZone: market.timeZone,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function plural(n: number, one: string, many: string) {
  return `${n.toLocaleString(market.locale)} ${n === 1 ? one : many}`;
}

export function peopleLabel(n: number) {
  return n === 1 ? "1 person" : `Up to ${n} people`;
}
