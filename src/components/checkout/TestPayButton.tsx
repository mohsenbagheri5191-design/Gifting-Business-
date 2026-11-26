"use client";

import { useState } from "react";
import { Lock } from "lucide-react";

export function TestPayButton({ purpose, reference, amountLabel, already }: { purpose: "order" | "topup"; reference: string; amountLabel: string; already: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function pay() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/payments/test", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ purpose, ref: reference }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Payment failed.");
      setBusy(false);
      return;
    }
    window.location.href = data.redirectUrl;
  }

  return (
    <>
      <button onClick={pay} disabled={busy} className="btn btn-primary mt-6 w-full">
        <Lock className="h-4 w-4" /> {already ? "Already paid — continue" : busy ? "Processing…" : `Pay ${amountLabel}`}
      </button>
      {error && <p className="mt-3 text-sm text-clay-deep">{error}</p>}
    </>
  );
}
