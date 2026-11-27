"use client";

import { useActionState } from "react";
import { login } from "../actions";

export function LoginForm({ devHint }: { devHint: boolean }) {
  const [state, action, pending] = useActionState(login, null);
  return (
    <form action={action} className="mt-6 space-y-4">
      <label className="block">
        <span className="label">Password</span>
        <input name="password" type="password" required autoFocus className="input" autoComplete="current-password" />
      </label>
      {state?.error && <p className="text-sm text-clay-deep">{state.error}</p>}
      <button className="btn btn-primary w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
      {devHint && <p className="text-xs text-muted">Development password: cadeau-admin (set ADMIN_PASSWORD to change it).</p>}
    </form>
  );
}
