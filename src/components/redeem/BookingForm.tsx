"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Lock } from "lucide-react";
import { formatMoney, peopleLabel } from "@/lib/format";
import { isoDateInToronto, timeSlots } from "@/lib/time";
import { cn } from "@/lib/ui";

type Option = { id: number; label: string; people: number; duration: string; priceCents: number; topUpCents?: number; wasInGift?: boolean };
type Location = { id: number; name: string; address: string; schedule: string | null };

export function BookingForm({
  mode,
  code,
  experience,
  options,
  locations,
  defaultOptionId,
  balanceCents,
  paymentLabel,
  prefill,
}: {
  mode: "redeem" | "self";
  code?: string;
  experience: { id: number; title: string };
  options: Option[];
  locations: Location[];
  defaultOptionId?: number;
  balanceCents?: number;
  paymentLabel: string;
  prefill?: { firstName?: string };
}) {
  const [optionId, setOptionId] = useState(options.find((o) => o.id === defaultOptionId)?.id ?? options[0].id);
  const [locationId, setLocationId] = useState<number | "">(locations.length === 1 ? locations[0].id : "");
  const [form, setForm] = useState({
    firstName: prefill?.firstName ?? "",
    lastName: "",
    email: "",
    phone: "",
    date1: "",
    time1: "18:00",
    date2: "",
    time2: "18:00",
    notes: "",
    accept: false,
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const option = options.find((o) => o.id === optionId)!;
  const minDate = useMemo(() => isoDateInToronto(1), []);
  const set = (k: keyof typeof form, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const topUp = mode === "redeem" ? (option.topUpCents ?? 0) : option.priceCents;
  const remaining = mode === "redeem" && balanceCents != null ? Math.max(0, balanceCents - option.priceCents) : 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (locations.length > 1 && !locationId) return setError("Please choose a location.");
    if (!form.date1) return setError("Please choose your preferred date.");
    if (!form.accept) return setError("Please accept the booking conditions.");
    setBusy(true);
    const guest = { firstName: form.firstName, lastName: form.lastName, email: form.email, phone: form.phone };
    const booking = {
      preferredDate1: form.date1,
      preferredTime1: form.time1,
      preferredDate2: form.date2 || "",
      preferredTime2: form.date2 ? form.time2 : "",
      notes: form.notes,
    };
    const payload =
      mode === "redeem"
        ? { code, experienceId: experience.id, optionId, locationId: locationId || null, guest, ...booking, acceptTerms: true }
        : { mode: "self", item: { experienceId: experience.id, optionId }, buyer: guest, booking: { locationId: locationId || null, ...booking }, acceptTerms: true };
    const res = await fetch(mode === "redeem" ? "/api/redemptions" : "/api/orders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Something went wrong — please try again.");
      setBusy(false);
      return;
    }
    window.location.href = data.redirectUrl;
  }

  return (
    <form onSubmit={submit} className="space-y-10">
      <fieldset>
        <legend className="font-display text-2xl">1. Choose an option</legend>
        <div className="mt-4 space-y-2">
          {options.map((o) => (
            <label
              key={o.id}
              className={cn("flex cursor-pointer items-center gap-4 rounded-2xl border px-4 py-3.5 transition", o.id === optionId ? "border-moss bg-sage-mist/50" : "border-line bg-paper hover:border-sage")}
            >
              <input type="radio" name="option" className="sr-only" checked={o.id === optionId} onChange={() => setOptionId(o.id)} />
              <span className={cn("grid h-5 w-5 shrink-0 place-items-center rounded-full border", o.id === optionId ? "border-moss bg-moss" : "border-line")}>
                {o.id === optionId && <span className="h-2 w-2 rounded-full bg-linen" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">
                  {o.label} {o.wasInGift && <span className="ml-1 rounded-full bg-paper px-2 py-0.5 text-[0.7rem] font-semibold text-moss">in your gift</span>}
                </span>
                <span className="block text-sm text-muted">
                  {peopleLabel(o.people)} · {o.duration}
                </span>
              </span>
              <span className="text-right">
                <span className="block font-display text-xl">{formatMoney(o.priceCents)}</span>
                {mode === "redeem" && (
                  <span className={cn("block text-xs font-semibold", o.topUpCents ? "text-clay-deep" : "text-moss")}>{o.topUpCents ? `+${formatMoney(o.topUpCents)}` : "Covered"}</span>
                )}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {locations.length > 0 && (
        <fieldset>
          <legend className="font-display text-2xl">2. Where</legend>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {locations.map((l) => (
              <label key={l.id} className={cn("cursor-pointer rounded-2xl border px-4 py-3.5 transition", locationId === l.id ? "border-moss bg-sage-mist/50" : "border-line bg-paper hover:border-sage")}>
                <input type="radio" name="location" className="sr-only" checked={locationId === l.id} onChange={() => setLocationId(l.id)} />
                <span className="block font-semibold">{l.name}</span>
                <span className="block text-sm text-muted">{l.address}</span>
                {l.schedule && <span className="mt-1 block text-xs text-muted">{l.schedule}</span>}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <fieldset>
        <legend className="font-display text-2xl">{locations.length ? "3" : "2"}. When would you like to go?</legend>
        <p className="mt-1 text-sm text-muted">Give us two options and we&apos;ll confirm whichever the venue has free.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label>
            <span className="label">First choice — date</span>
            <input type="date" required min={minDate} className="input" value={form.date1} onChange={(e) => set("date1", e.target.value)} />
          </label>
          <label>
            <span className="label">Time</span>
            <select className="select" value={form.time1} onChange={(e) => set("time1", e.target.value)}>
              {timeSlots.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="label">Second choice — date (optional)</span>
            <input type="date" min={minDate} className="input" value={form.date2} onChange={(e) => set("date2", e.target.value)} />
          </label>
          <label>
            <span className="label">Time</span>
            <select className="select" value={form.time2} onChange={(e) => set("time2", e.target.value)}>
              {timeSlots.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend className="font-display text-2xl">{locations.length ? "4" : "3"}. Your details</legend>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {(
            [
              ["firstName", "First name", "text", "given-name"],
              ["lastName", "Last name", "text", "family-name"],
              ["email", "Email", "email", "email"],
              ["phone", "Phone", "tel", "tel"],
            ] as const
          ).map(([k, label, type, ac]) => (
            <label key={k}>
              <span className="label">{label}</span>
              <input required type={type} autoComplete={ac} className="input" value={form[k]} onChange={(e) => set(k, e.target.value)} />
            </label>
          ))}
          <label className="sm:col-span-2">
            <span className="label">Anything we should know? (optional)</span>
            <textarea className="textarea min-h-24" maxLength={500} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Celebrating something? Dietary needs? Accessibility?" />
          </label>
        </div>
      </fieldset>

      <div className="rounded-[1.75rem] border border-line bg-paper p-6">
        <dl className="space-y-2 text-[0.95rem]">
          <div className="flex justify-between">
            <dt className="text-ink-soft">{experience.title} · {option.label}</dt>
            <dd>{formatMoney(option.priceCents)}</dd>
          </div>
          {mode === "redeem" && (
            <div className="flex justify-between">
              <dt className="text-ink-soft">Paid with your gift</dt>
              <dd>−{formatMoney(option.priceCents - topUp)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-line pt-3 font-semibold">
            <dt>{topUp ? "To pay now" : "To pay"}</dt>
            <dd className="font-display text-2xl font-normal">{formatMoney(topUp)}</dd>
          </div>
        </dl>
        {mode === "redeem" && remaining > 0 && <p className="mt-3 text-sm text-moss">{formatMoney(remaining)} will stay on your gift for another experience.</p>}
        <label className="mt-5 flex items-start gap-3 text-sm text-ink-soft">
          <input type="checkbox" className="mt-0.5 h-5 w-5 accent-[var(--color-moss)]" checked={form.accept} onChange={(e) => set("accept", e.target.checked)} />
          <span>
            I understand bookings are confirmed by email, and changes need at least 48 hours&apos; notice (see <Link href="/legal/terms" className="underline" target="_blank">terms</Link>).
          </span>
        </label>
        {error && (
          <p className="mt-4 rounded-xl bg-clay-mist px-4 py-3 text-sm text-clay-deep" role="alert">
            {error}
          </p>
        )}
        <button className="btn btn-primary mt-5 w-full sm:w-auto sm:px-10" disabled={busy}>
          {topUp ? <Lock className="h-4 w-4" /> : null}
          {busy ? "One moment…" : topUp ? `${mode === "redeem" ? "Pay the difference" : "Pay"} · ${formatMoney(topUp)}` : "Request this booking"}
        </button>
        {topUp > 0 && <p className="mt-2 text-xs text-muted">{paymentLabel}</p>}
      </div>
    </form>
  );
}
