import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { Logo } from "@/components/Logo";
import { logout } from "../actions";

const nav = [
  ["/admin", "Dashboard"],
  ["/admin/orders", "Orders"],
  ["/admin/bookings", "Bookings"],
  ["/admin/certificates", "Gift codes"],
  ["/admin/experiences", "Experiences"],
  ["/admin/reviews", "Reviews"],
  ["/admin/leads", "Enquiries"],
  ["/admin/emails", "Emails"],
];

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="lg:grid lg:min-h-screen lg:grid-cols-[240px_1fr]">
      <aside className="bg-forest text-linen lg:sticky lg:top-0 lg:h-screen">
        <div className="flex items-center justify-between px-6 py-5 lg:block">
          <Link href="/admin">
            <Logo light />
          </Link>
          <p className="hidden text-xs text-linen/50 lg:mt-1 lg:block">Back office</p>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:px-3">
          {nav.map(([href, label]) => (
            <Link key={href} href={href} className="shrink-0 rounded-xl px-4 py-2.5 text-[0.95rem] text-linen/80 hover:bg-linen/10 hover:text-linen">
              {label}
            </Link>
          ))}
        </nav>
        <div className="hidden px-6 pt-6 lg:block">
          <Link href="/" className="block text-sm text-linen/60 hover:text-linen" target="_blank">
            View site ↗
          </Link>
          <form action={logout} className="mt-3">
            <button className="text-sm text-linen/60 hover:text-linen">Sign out</button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 px-4 py-8 sm:px-8 lg:px-10">{children}</main>
    </div>
  );
}
