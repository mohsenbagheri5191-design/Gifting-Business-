"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Lock } from "lucide-react";

export function TopUpActions({ code, reference, amountLabel }: { code: string; reference: string; amountLabel: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"" | "pay" | "cancel">("");
  const [error, setError] = useState("");

  async function call(path: string, kind: "pay" | "cancel") {
    setBusy(kind);
    setError("");
    const res = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code, reference }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      setBusy("");
      return;
    }
    if (kind === "pay") window.location.href = data.redirectUrl;
    else {
      router.refresh();
      setBusy("");
    }
  }

  return (
    <div className="mt-6">
      <div className="flex flex-wrap gap-2">
        <button className="btn btn-primary" disabled={!!busy} onClick={() => call("/api/redemptions/pay", "pay")}>
          <Lock className="h-4 w-4" /> {busy === "pay" ? "Opening payment…" : `Pay ${amountLabel}`}
        </button>
        <button className="btn btn-outline" disabled={!!busy} onClick={() => call("/api/redemptions/cancel", "cancel")}>
          {busy === "cancel" ? "Cancelling…" : "Cancel and choose again"}
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-clay-deep">{error}</p>}
    </div>
  );
}
