"use client";

import { useState } from "react";
import { cn } from "@/lib/ui";

export function ReviewForm({ experienceId }: { experienceId: number }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setState("sending");
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ experienceId, rating, authorName: fd.get("name"), authorEmail: fd.get("email"), body: fd.get("body"), consent: fd.get("consent") === "on" }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) setState("done");
    else {
      setError(data.error ?? "Something went wrong.");
      setState("error");
    }
  }

  if (state === "done")
    return <p className="rounded-2xl bg-sage-mist px-5 py-4 text-moss">Thank you! Your review will appear once our team has checked it.</p>;

  if (!open)
    return (
      <button className="btn btn-outline" onClick={() => setOpen(true)}>
        Write a review
      </button>
    );

  return (
    <form onSubmit={submit} className="card max-w-xl space-y-4 p-6">
      <div>
        <p className="label">Your rating</p>
        <div className="flex gap-1" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              type="button"
              key={n}
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              onClick={() => setRating(n)}
              className={cn("text-3xl leading-none transition", n <= rating ? "text-gold" : "text-line")}
            >
              ★
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="label">Name</span>
          <input name="name" required maxLength={80} className="input" />
        </label>
        <label>
          <span className="label">Email (not shown)</span>
          <input name="email" type="email" required className="input" />
        </label>
      </div>
      <label className="block">
        <span className="label">Your review</span>
        <textarea name="body" required minLength={10} maxLength={1500} className="textarea" />
      </label>
      <label className="flex items-start gap-3 text-sm text-ink-soft">
        <input type="checkbox" name="consent" required className="mt-1 h-4 w-4 accent-[var(--color-moss)]" />
        I agree that my review and first name may be shown on Cadeau.
      </label>
      {state === "error" && <p className="text-sm text-clay-deep">{error}</p>}
      <button className="btn btn-primary" disabled={state === "sending"}>
        {state === "sending" ? "Sending…" : "Submit review"}
      </button>
    </form>
  );
}
