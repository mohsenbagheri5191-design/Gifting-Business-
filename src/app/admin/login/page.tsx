import { redirect } from "next/navigation";
import { adminPassword, isAdmin } from "@/lib/admin-auth";
import { Logo } from "@/components/Logo";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Sign in" };

export default async function AdminLogin() {
  if (await isAdmin()) redirect("/admin");
  const configured = !!adminPassword();
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-sm rounded-[2rem] border border-line bg-paper p-8">
        <Logo />
        <h1 className="mt-8 text-3xl">Team sign in</h1>
        {configured ? (
          <LoginForm devHint={process.env.NODE_ENV !== "production" && !process.env.ADMIN_PASSWORD} />
        ) : (
          <p className="mt-4 text-sm text-ink-soft">The admin is disabled until ADMIN_PASSWORD is set in the environment.</p>
        )}
      </div>
    </div>
  );
}
