"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { CODE_LENGTH, formatCode, normalizeCode } from "@/lib/codes";
import { formatDate, formatMoney } from "@/lib/format";
import { cn } from "@/lib/ui";

/** The 14-character code input (bodo's "Активувати сертифікат"). */
export function CodeForm({ mode = "redeem", initialError, large = true }: { mode?: "redeem" | "check"; initialError?: string; large?: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState(initialError ?? "");
  const [busy, setBusy] = useState(false);
  const [balance, setBalance] = useState<{ balanceCents: number; valueCents: number; status: string; expiresAt: string | null } | null>(null);

  const normalized = normalizeCode(value);

  function onChange(v: string) {
    const n = normalizeCode(v).slice(0, CODE_LENGTH);
    setValue(n.length > 7 ? `${n.slice(0, 7)}-${n.slice(7)}` : n);
    setError("");
    setBalance(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (normalized.length !== CODE_LENGTH) {
      setError("Gift codes are 14 letters and numbers.");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/redeem/lookup", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code: normalized }) });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "We couldn't check that code.");
      return;
    }
    if (mode === "check") setBalance(data);
    else router.push(`/redeem/${data.code}`);
  }

  return (
    <form onSubmit={submit} className="w-full">
      <label htmlFor="gift-code" className="label">
        Your 14-character gift code
      </label>
      <div className={cn("flex flex-col gap-3 sm:flex-row", large && "sm:items-stretch")}>
        <input
          id="gift-code"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="XXXXXXX-XXXXXXX"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          inputMode="text"
          className={cn("input flex-1 font-mono uppercase tracking-[0.2em]", large && "min-h-16 text-xl sm:text-2xl")}
          aria-invalid={!!error}
          aria-describedby="code-help"
        />
        <button className={cn("btn btn-primary", large && "min-h-16 px-8")} disabled={busy}>
          {busy ? "Checking…" : mode === "check" ? "Check balance" : "Continue"} <ArrowRight className="h-4 w-4" />
        </button>
      </div>
      <p id="code-help" className={cn("mt-2 text-sm", error ? "text-clay-deep" : "text-muted")} role={error ? "alert" : undefined}>
        {error || "You'll find it on your gift card or in the email. Dashes and spaces don't matter."}
      </p>
      {balance && (
        <div className="mt-5 rounded-2xl border border-sage/60 bg-sage-mist/60 p-5">
          <p className="text-sm text-ink-soft">Gift {formatCode(normalized)}</p>
          <p className="mt-1 font-display text-3xl">{formatMoney(balance.balanceCents)} available</p>
          <p className="mt-1 text-sm text-muted">
            Original value {formatMoney(balance.valueCents)} · {balance.expiresAt ? `valid until ${formatDate(balance.expiresAt)}` : "never expires"}
            {balance.status !== "active" && ` · ${balance.status}`}
          </p>
          <button type="button" onClick={() => router.push(`/redeem/${normalized}`)} className="btn btn-primary btn-sm mt-4">
            Use it now
          </button>
        </div>
      )}
    </form>
  );
}
