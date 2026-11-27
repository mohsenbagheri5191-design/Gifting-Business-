"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Lock, Mail, Package } from "lucide-react";
import { useGiftBox } from "../gift-box/GiftBoxProvider";
import { Stepper } from "./Stepper";
import { CertificateCard } from "../CertificateCard";
import { GiftBoxArt } from "../GiftBoxArt";
import { boxColors, delivery, greetingIdeas, packaging, provinces, rules, type DeliveryId, type PackagingId } from "@/lib/config";
import { formatDateTime, formatMoney } from "@/lib/format";
import { isoDateInToronto, timeSlots, torontoToIso } from "@/lib/time";
import { cn } from "@/lib/ui";

type Form = {
  packaging: PackagingId;
  boxColor: string;
  deliveryMethod: Exclude<DeliveryId, "email">;
  buyer: { firstName: string; lastName: string; email: string; phone: string };
  recipientName: string;
  fromName: string;
  message: string;
  sendTo: "recipient" | "me";
  recipientEmail: string;
  when: "now" | "later";
  sendDate: string;
  sendTime: string;
  shipping: { name: string; line1: string; line2: string; city: string; province: string; postalCode: string; phone: string; notes: string };
  acceptTerms: boolean;
};

const initial: Form = {
  packaging: "ecert",
  boxColor: "sage",
  deliveryMethod: "courier",
  buyer: { firstName: "", lastName: "", email: "", phone: "" },
  recipientName: "",
  fromName: "",
  message: "",
  sendTo: "recipient",
  recipientEmail: "",
  when: "now",
  sendDate: "",
  sendTime: "09:00",
  shipping: { name: "", line1: "", line2: "", city: "Toronto", province: "ON", postalCode: "", phone: "", notes: "" },
  acceptTerms: false,
};

const KEY = "cadeau.checkout.v1";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[\d\s().-]{7,20}$/;
const POSTAL_RE = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;

export function CheckoutClient({ paymentMode, cancelled }: { paymentMode: "stripe" | "test" | "disabled"; cancelled: boolean }) {
  const { lines, hydrated, valueCents } = useGiftBox();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<Form>(initial);
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(KEY);
      if (saved) setForm({ ...initial, ...JSON.parse(saved), acceptTerms: false });
    } catch {}
    setRestored(true);
  }, []);
  useEffect(() => {
    if (!restored) return;
    try {
      sessionStorage.setItem(KEY, JSON.stringify(form));
    } catch {}
  }, [form, restored]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const setBuyer = (k: keyof Form["buyer"], v: string) => setForm((f) => ({ ...f, buyer: { ...f.buyer, [k]: v } }));
  const setShip = (k: keyof Form["shipping"], v: string) => setForm((f) => ({ ...f, shipping: { ...f.shipping, [k]: v } }));

  const deliveryId: DeliveryId = form.packaging === "ecert" ? "email" : form.deliveryMethod;
  const totals = useMemo(() => {
    const packagingFee = packaging[form.packaging].priceCents;
    const deliveryFee = delivery[deliveryId].priceCents;
    return { packagingFee, deliveryFee, total: valueCents + packagingFee + deliveryFee };
  }, [form.packaging, deliveryId, valueCents]);

  function validate(s: number): string[] {
    const e: string[] = [];
    if (s === 2) {
      if (!form.buyer.firstName.trim() || !form.buyer.lastName.trim()) e.push("Please enter your first and last name.");
      if (!EMAIL_RE.test(form.buyer.email.trim())) e.push("Please enter a valid email address.");
      if (!PHONE_RE.test(form.buyer.phone.trim())) e.push("Please enter a valid phone number.");
    }
    if (s === 3) {
      if (!form.recipientName.trim()) e.push("Who is the gift for? Please enter their name.");
      if (!form.fromName.trim()) e.push("Please enter how you'd like to sign the gift.");
      if (form.message.length > rules.messageMaxLength) e.push(`Your message can be up to ${rules.messageMaxLength} characters.`);
      if (form.packaging === "ecert") {
        if (form.sendTo === "recipient" && !EMAIL_RE.test(form.recipientEmail.trim())) e.push("Please enter the recipient's email address.");
        if (form.when === "later") {
          if (!form.sendDate || !form.sendTime) e.push("Please choose the delivery date and time.");
          else if (new Date(torontoToIso(form.sendDate, form.sendTime)).getTime() < Date.now()) e.push("The delivery time is in the past.");
        }
      } else if (form.deliveryMethod !== "pickup") {
        const sh = form.shipping;
        if (!sh.name.trim() || !sh.line1.trim() || !sh.city.trim()) e.push("Please complete the delivery address.");
        if (!POSTAL_RE.test(sh.postalCode.trim())) e.push("Please enter a valid postal code (e.g. M5V 2T6).");
        if (!PHONE_RE.test(sh.phone.trim())) e.push("Please add a phone number for the courier.");
        if (form.deliveryMethod === "courier" && !/^m/i.test(sh.postalCode.trim())) e.push("Same-day courier is for Toronto addresses (postal codes starting with M). Choose Canada Post for elsewhere.");
      }
    }
    if (s === 4 && !form.acceptTerms) e.push("Please accept the terms of sale.");
    return e;
  }

  function next() {
    const e = validate(step);
    setErrors(e);
    if (e.length) return;
    if (step === 2 && !form.fromName) set("fromName", form.buyer.firstName.trim());
    if (step === 3 && form.packaging === "box" && !form.shipping.name) setShip("name", form.recipientName);
    setStep((s) => Math.min(4, s + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function pay() {
    const e = [2, 3, 4].flatMap(validate);
    setErrors(e);
    if (e.length) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mode: "gift",
          items: lines.map((l) => ({ experienceId: l.experienceId, optionId: l.optionId })),
          packaging: form.packaging,
          boxColor: form.packaging === "box" ? form.boxColor : null,
          deliveryMethod: deliveryId,
          buyer: form.buyer,
          recipientName: form.recipientName,
          recipientEmail: form.packaging === "ecert" && form.sendTo === "recipient" ? form.recipientEmail : "",
          sendTo: form.sendTo,
          sendAt: form.packaging === "ecert" && form.when === "later" ? torontoToIso(form.sendDate, form.sendTime) : null,
          fromName: form.fromName,
          message: form.message,
          shipping: form.packaging === "box" && form.deliveryMethod !== "pickup" ? form.shipping : null,
          acceptTerms: form.acceptTerms,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Payment could not be started.");
      window.location.href = data.redirectUrl;
    } catch (err) {
      setErrors([err instanceof Error ? err.message : "Something went wrong."]);
      setSubmitting(false);
    }
  }

  if (!hydrated) return <div className="container-page py-20"><div className="h-64 animate-pulse rounded-[2rem] bg-sand/70" /></div>;
  if (lines.length === 0)
    return (
      <div className="container-page py-24 text-center">
        <p className="font-display text-4xl">Your gift is empty</p>
        <Link href="/experiences" className="btn btn-primary mt-6">
          Find experiences
        </Link>
      </div>
    );

  const sendAtLabel = form.when === "later" && form.sendDate ? formatDateTime(torontoToIso(form.sendDate, form.sendTime)) : "right after payment";

  return (
    <div className="container-page pb-16 pt-8">
      <Stepper current={step} onStep={(i) => i < step && setStep(i)} />
      {cancelled && step === 1 && <p className="mt-6 rounded-2xl bg-clay-mist px-5 py-3 text-sm text-clay-deep">Payment was cancelled — nothing was charged. Your gift is still here.</p>}

      <div className="mt-8 grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-8">
          {step > 1 ? (
            <button onClick={() => setStep((s) => s - 1)} className="inline-flex items-center gap-2 text-sm font-semibold text-ink-soft hover:text-ink">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
          ) : (
            <Link href="/gift-box" className="inline-flex items-center gap-2 text-sm font-semibold text-ink-soft hover:text-ink">
              <ArrowLeft className="h-4 w-4" /> Back to your gift
            </Link>
          )}

          {/* ---------------------------------------------------- packaging */}
          {step === 1 && (
            <section>
              <h1 className="mt-4 text-5xl">How should it arrive?</h1>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {(["ecert", "box"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => set("packaging", p)}
                    className={cn("rounded-[1.75rem] border p-6 text-left transition", form.packaging === p ? "border-moss bg-sage-mist/50 ring-1 ring-moss" : "border-line bg-paper hover:border-sage")}
                    aria-pressed={form.packaging === p}
                  >
                    <div className="flex items-center justify-between">
                      <span className="grid h-11 w-11 place-items-center rounded-full bg-paper text-moss">{p === "ecert" ? <Mail className="h-5 w-5" strokeWidth={1.6} /> : <Package className="h-5 w-5" strokeWidth={1.6} />}</span>
                      <span className="font-display text-xl">{packaging[p].priceCents ? `+${formatMoney(packaging[p].priceCents)}` : "Free"}</span>
                    </div>
                    <p className="mt-5 font-display text-2xl">{packaging[p].name}</p>
                    <p className="text-sm font-semibold text-clay-deep">{packaging[p].short}</p>
                    <p className="mt-2 text-sm leading-relaxed text-ink-soft">{packaging[p].description}</p>
                  </button>
                ))}
              </div>
              {form.packaging === "box" && (
                <div className="mt-6 grid items-center gap-6 rounded-[1.75rem] bg-paper p-6 sm:grid-cols-[1fr_1.2fr]">
                  <GiftBoxArt color={form.boxColor} />
                  <div>
                    <p className="label">Choose a colourway</p>
                    <div className="flex flex-wrap gap-2">
                      {boxColors.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => set("boxColor", c.id)}
                          className={cn("flex items-center gap-2 rounded-full border px-3 py-2 text-sm", form.boxColor === c.id ? "border-ink bg-linen" : "border-line")}
                          aria-pressed={form.boxColor === c.id}
                        >
                          <span className="h-5 w-5 rounded-full" style={{ background: `linear-gradient(135deg, ${c.lid} 0 50%, ${c.body} 50% 100%)` }} />
                          {c.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ------------------------------------------------------ details */}
          {step === 2 && (
            <section>
              <h1 className="mt-4 text-5xl">Your details</h1>
              <p className="mt-2 text-ink-soft">For your receipt and a copy of the gift. We&apos;ll ask about the recipient next.</p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <Field label="First name" value={form.buyer.firstName} onChange={(v) => setBuyer("firstName", v)} autoComplete="given-name" />
                <Field label="Last name" value={form.buyer.lastName} onChange={(v) => setBuyer("lastName", v)} autoComplete="family-name" />
                <Field label="Email" type="email" value={form.buyer.email} onChange={(v) => setBuyer("email", v)} autoComplete="email" />
                <Field label="Phone" type="tel" value={form.buyer.phone} onChange={(v) => setBuyer("phone", v)} autoComplete="tel" />
              </div>
            </section>
          )}

          {/* ---------------------------------------------------- recipient */}
          {step === 3 && (
            <section>
              <h1 className="mt-4 text-5xl">Who&apos;s it for?</h1>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <Field label="Recipient's name" value={form.recipientName} onChange={(v) => set("recipientName", v)} placeholder="e.g. Yashar" />
                <Field label="From (how you sign it)" value={form.fromName} onChange={(v) => set("fromName", v)} placeholder="e.g. Dexter" />
              </div>
              <div className="mt-4">
                <label className="block">
                  <span className="label">Your message (optional)</span>
                  <textarea className="textarea" maxLength={rules.messageMaxLength} value={form.message} onChange={(e) => set("message", e.target.value)} placeholder="A few words they'll keep." />
                </label>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    {greetingIdeas.slice(0, 3).map((g) => (
                      <button key={g} type="button" onClick={() => set("message", g)} className="chip hover:border-sage" title={g}>
                        {g.split(/[.!,]/)[0]}…
                      </button>
                    ))}
                  </div>
                  <span className="text-xs text-muted">
                    {form.message.length}/{rules.messageMaxLength}
                  </span>
                </div>
              </div>

              {form.packaging === "ecert" ? (
                <div className="mt-10 space-y-6">
                  <div>
                    <p className="label">Send the e-certificate to</p>
                    <Segmented
                      value={form.sendTo}
                      onChange={(v) => set("sendTo", v as Form["sendTo"])}
                      options={[
                        ["recipient", "Straight to them"],
                        ["me", "To me (to print or forward)"],
                      ]}
                    />
                  </div>
                  {form.sendTo === "recipient" && (
                    <>
                      <Field label="Recipient's email" type="email" value={form.recipientEmail} onChange={(v) => set("recipientEmail", v)} />
                      <div>
                        <p className="label">When should it arrive?</p>
                        <Segmented
                          value={form.when}
                          onChange={(v) => set("when", v as Form["when"])}
                          options={[
                            ["now", "Right after payment"],
                            ["later", "On a date I choose"],
                          ]}
                        />
                        {form.when === "later" && (
                          <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            <label>
                              <span className="label">Date</span>
                              <input type="date" className="input" min={isoDateInToronto(0)} value={form.sendDate} onChange={(e) => set("sendDate", e.target.value)} />
                            </label>
                            <label>
                              <span className="label">Time (Toronto)</span>
                              <select className="select" value={form.sendTime} onChange={(e) => set("sendTime", e.target.value)}>
                                {[{ value: "00:00", label: "12:00 a.m. (midnight)" }, { value: "07:00", label: "7:00 a.m." }, ...timeSlots].map((t) => (
                                  <option key={t.value} value={t.value}>
                                    {t.label}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>
                        )}
                        <p className="mt-3 text-sm text-muted">You&apos;ll receive a copy at the same moment.</p>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="mt-10 space-y-6">
                  <div>
                    <p className="label">Delivery</p>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {(["courier", "post", "pickup"] as const).map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => set("deliveryMethod", d)}
                          aria-pressed={form.deliveryMethod === d}
                          className={cn("rounded-2xl border p-4 text-left transition", form.deliveryMethod === d ? "border-moss bg-sage-mist/50 ring-1 ring-moss" : "border-line bg-paper hover:border-sage")}
                        >
                          <p className="font-semibold">{delivery[d].name}</p>
                          <p className="mt-1 text-xs text-muted">{delivery[d].eta}</p>
                          <p className="mt-2 text-sm font-semibold">{delivery[d].priceCents ? formatMoney(delivery[d].priceCents) : "Free"}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  {form.deliveryMethod !== "pickup" ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Deliver to (name)" value={form.shipping.name} onChange={(v) => setShip("name", v)} />
                      <Field label="Phone for the courier" type="tel" value={form.shipping.phone} onChange={(v) => setShip("phone", v)} />
                      <Field label="Street address" value={form.shipping.line1} onChange={(v) => setShip("line1", v)} autoComplete="address-line1" />
                      <Field label="Apartment, suite (optional)" value={form.shipping.line2} onChange={(v) => setShip("line2", v)} autoComplete="address-line2" />
                      <Field label="City" value={form.shipping.city} onChange={(v) => setShip("city", v)} autoComplete="address-level2" />
                      <div className="grid grid-cols-2 gap-4">
                        <label>
                          <span className="label">Province</span>
                          <select className="select" value={form.shipping.province} onChange={(e) => setShip("province", e.target.value)}>
                            {provinces.map((p) => (
                              <option key={p}>{p}</option>
                            ))}
                          </select>
                        </label>
                        <Field label="Postal code" value={form.shipping.postalCode} onChange={(v) => setShip("postalCode", v.toUpperCase())} autoComplete="postal-code" />
                      </div>
                      <label className="sm:col-span-2">
                        <span className="label">Delivery notes (optional)</span>
                        <input className="input" value={form.shipping.notes} onChange={(e) => setShip("notes", e.target.value)} placeholder="Buzzer code, leave with concierge…" />
                      </label>
                    </div>
                  ) : (
                    <p className="rounded-2xl bg-paper px-5 py-4 text-ink-soft">We&apos;ll email you as soon as your box is ready to collect — usually within two hours during opening hours.</p>
                  )}
                </div>
              )}
            </section>
          )}

          {/* ------------------------------------------------------- review */}
          {step === 4 && (
            <section>
              <h1 className="mt-4 text-5xl">Review &amp; pay</h1>
              <div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_1fr]">
                {form.packaging === "ecert" ? (
                  <CertificateCard recipientName={form.recipientName} fromName={form.fromName} message={form.message} items={lines.map((l) => ({ title: l.title, optionLabel: l.optionLabel }))} />
                ) : (
                  <div className="rounded-[2rem] bg-paper p-8">
                    <GiftBoxArt color={form.boxColor} />
                  </div>
                )}
                <dl className="space-y-4 text-[0.95rem]">
                  <Row label="Gift for" value={`${form.recipientName} — from ${form.fromName}`} />
                  <Row label="Packaging" value={form.packaging === "ecert" ? "E-certificate" : `Gift box · ${boxColors.find((c) => c.id === form.boxColor)?.name}`} />
                  {form.packaging === "ecert" ? (
                    <Row label="Delivery" value={form.sendTo === "me" ? `Emailed to you (${form.buyer.email})` : `Emailed to ${form.recipientEmail}, ${sendAtLabel}`} />
                  ) : (
                    <Row
                      label="Delivery"
                      value={
                        form.deliveryMethod === "pickup"
                          ? "Pickup from our studio"
                          : `${delivery[form.deliveryMethod].name} to ${form.shipping.line1}, ${form.shipping.city} ${form.shipping.postalCode}`
                      }
                    />
                  )}
                  <Row label="Receipt to" value={`${form.buyer.firstName} ${form.buyer.lastName} · ${form.buyer.email}`} />
                </dl>
              </div>
              <label className="mt-8 flex items-start gap-3 text-[0.95rem] text-ink-soft">
                <input type="checkbox" className="mt-1 h-5 w-5 accent-[var(--color-moss)]" checked={form.acceptTerms} onChange={(e) => set("acceptTerms", e.target.checked)} />
                <span>
                  I agree to the <Link href="/legal/terms" className="underline" target="_blank">terms of sale</Link> and{" "}
                  <Link href="/legal/refunds" className="underline" target="_blank">refund policy</Link>.
                </span>
              </label>
            </section>
          )}

          {errors.length > 0 && (
            <div className="mt-6 rounded-2xl border border-clay/40 bg-clay-mist px-5 py-4 text-sm text-clay-deep" role="alert">
              {errors.map((e) => (
                <p key={e}>{e}</p>
              ))}
            </div>
          )}

          <div className="mt-8">
            {step < 4 ? (
              <button className="btn btn-primary px-8" onClick={next}>
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button className="btn btn-primary px-8" onClick={pay} disabled={submitting || paymentMode === "disabled"}>
                <Lock className="h-4 w-4" /> {submitting ? "Starting secure payment…" : `Pay ${formatMoney(totals.total)}`}
              </button>
            )}
            {step === 4 && (
              <p className="mt-3 text-sm text-muted">
                {paymentMode === "stripe"
                  ? "You'll be taken to Stripe's secure checkout (cards, Apple Pay, Google Pay)."
                  : paymentMode === "test"
                    ? "Test mode: you'll complete a simulated payment — no card is charged."
                    : "Online payments aren't switched on yet."}
              </p>
            )}
          </div>
        </div>

        {/* ------------------------------------------------------- summary */}
        <aside className="lg:col-span-4">
          <div className="sticky top-32 rounded-[2rem] border border-line bg-paper p-7">
            <p className="font-display text-2xl">Summary</p>
            <ul className="mt-4 space-y-2 border-b border-line pb-4 text-sm">
              {lines.map((l) => (
                <li key={l.experienceId} className="flex justify-between gap-3">
                  <span className="text-ink-soft">{l.title}</span>
                  <span className="shrink-0 text-muted">{formatMoney(l.priceCents)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-soft">Gift value {lines.length > 1 && <span className="text-muted">(most expensive)</span>}</dt>
                <dd>{formatMoney(valueCents)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-soft">{packaging[form.packaging].name}</dt>
                <dd>{totals.packagingFee ? formatMoney(totals.packagingFee) : "Free"}</dd>
              </div>
              {form.packaging === "box" && (
                <div className="flex justify-between">
                  <dt className="text-ink-soft">{delivery[deliveryId].name}</dt>
                  <dd>{totals.deliveryFee ? formatMoney(totals.deliveryFee) : "Free"}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-line pt-3 text-base font-semibold">
                <dt>Total</dt>
                <dd className="font-display text-2xl font-normal">{formatMoney(totals.total)}</dd>
              </div>
            </dl>
            <p className="mt-4 text-xs leading-relaxed text-muted">They choose one of {lines.length === 1 ? "this experience" : `these ${lines.length}`} — or swap for anything up to {formatMoney(valueCents)}.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder, autoComplete }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; autoComplete?: string }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input className="input" type={type} value={value} placeholder={placeholder} autoComplete={autoComplete} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function Segmented({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <div className="inline-flex flex-wrap rounded-full border border-line bg-paper p-1">
      {options.map(([v, label]) => (
        <button key={v} type="button" onClick={() => onChange(v)} aria-pressed={value === v} className={cn("rounded-full px-5 py-2.5 text-sm font-semibold transition", value === v ? "bg-moss text-linen" : "text-ink-soft hover:text-ink")}>
          {label}
        </button>
      ))}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-paper px-5 py-4">
      <dt className="text-xs uppercase tracking-[0.16em] text-muted">{label}</dt>
      <dd className="mt-1">{value}</dd>
    </div>
  );
}
