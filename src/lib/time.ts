import { market } from "./config";

/** Minutes between Toronto wall-clock time and UTC at a given instant (e.g. -300 in winter). */
function tzOffsetMinutes(ts: number, timeZone: string = market.timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(ts));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return (asUtc - ts) / 60000;
}

/** "2026-12-24" + "09:00" in Toronto → ISO instant, whatever the browser's time zone. */
export function torontoToIso(date: string, time: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  const offset = tzOffsetMinutes(guess);
  const first = guess - offset * 60000;
  // second pass handles the DST boundary
  return new Date(guess - tzOffsetMinutes(first) * 60000).toISOString();
}

/** Time slots offered for bookings and scheduled delivery. */
export const timeSlots = Array.from({ length: 29 }, (_, i) => {
  const minutes = 8 * 60 + i * 30; // 08:00 → 22:00
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const value = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  const label = new Date(Date.UTC(2000, 0, 1, h, m)).toLocaleTimeString("en-CA", { timeZone: "UTC", hour: "numeric", minute: "2-digit" });
  return { value, label };
});

export function isoDateInToronto(offsetDays = 0): string {
  const d = new Date(Date.now() + offsetDays * 86400_000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: market.timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}
