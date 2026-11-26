"use client";

import { useState } from "react";

export function LeadForm({ type, submitLabel = "Send", showCompany = false, messageLabel = "Message" }: { type: "corporate" | "contact" | "partner"; submitLabel?: string; showCompany?: boolean; messageLabel?: string }) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setState("sending");
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type, ...Object.fromEntries(fd.entries()) }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) setState("done");
    else {
      setError(data.error ?? "Something went wrong.");
      setState("error");
    }
  }

  if (state === "done")
    return (
      <div className="rounded-[1.75rem] bg-sage-mist p-8">
        <p className="font-display text-3xl">Thank you</p>
        <p className="mt-2 text-ink-soft">We&apos;ve received your message and will reply within one business day.</p>
      </div>
    );

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <label>
        <span className="label">Name</span>
        <input name="name" required maxLength={80} className="input" autoComplete="name" />
      </label>
      <label>
        <span className="label">Email</span>
        <input name="email" type="email" required className="input" autoComplete="email" />
      </label>
      <label>
        <span className="label">Phone {showCompany ? "" : "(optional)"}</span>
        <input name="phone" type="tel" className="input" autoComplete="tel" required={showCompany} />
      </label>
      {showCompany ? (
        <label>
          <span className="label">Company</span>
          <input name="company" required className="input" autoComplete="organization" />
        </label>
      ) : (
        <span className="hidden sm:block" />
      )}
      <label className="sm:col-span-2">
        <span className="label">{messageLabel}</span>
        <textarea name="message" className="textarea" maxLength={3000} />
      </label>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      {state === "error" && <p className="text-sm text-clay-deep sm:col-span-2">{error}</p>}
      <div className="sm:col-span-2">
        <button className="btn btn-primary px-8" disabled={state === "sending"}>
          {state === "sending" ? "Sending…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
