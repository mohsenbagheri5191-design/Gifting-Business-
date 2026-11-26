import Link from "next/link";
import { notFound } from "next/navigation";
import { getCertificate } from "@/lib/redemptions";
import { formatCode } from "@/lib/codes";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import { setCertificateCancelled } from "../../../actions";
import { AdminTitle, Badge, Panel } from "../../ui";

export const metadata = { title: "Gift code" };

export default async function CertificateAdminPage({ params }: { params: Promise<{ code: string }> }) {
  const cert = await getCertificate((await params).code);
  if (!cert) notFound();
  return (
    <>
      <Link href="/admin/certificates" className="text-sm text-muted hover:text-ink">
        ← Gift codes
      </Link>
      <AdminTitle title={formatCode(cert.code)}>
        <Badge tone={cert.status === "active" ? "good" : "warn"}>{cert.status}</Badge>
      </AdminTitle>
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Panel className="p-6">
            <h2 className="text-2xl">Experiences in this gift</h2>
            <p className="mt-1 text-sm text-muted">Prices locked at purchase (price protection).</p>
            <ul className="mt-4 divide-y divide-line text-sm">
              {cert.items.map((i) => (
                <li key={i.id} className="flex justify-between py-2.5">
                  <span>
                    {i.title} <span className="text-muted">· {i.optionLabel}</span>
                  </span>
                  <span>{formatMoney(i.priceCents)}</span>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel className="p-6">
            <h2 className="text-2xl">Bookings</h2>
            {cert.redemptions.length === 0 ? (
              <p className="mt-3 text-sm text-muted">Not redeemed yet{cert.firstViewedAt ? ` (first opened ${formatDateTime(cert.firstViewedAt)})` : ""}.</p>
            ) : (
              <ul className="mt-4 space-y-3 text-sm">
                {cert.redemptions.map((r) => (
                  <li key={r.id} className="rounded-xl bg-linen px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold">
                        {r.title} · {r.optionLabel}
                      </span>
                      <Badge>{r.status.replace("_", " ")}</Badge>
                    </div>
                    <p className="text-muted">
                      {r.reference} · {formatMoney(r.priceCents)} (gift {formatMoney(r.fromBalanceCents)}
                      {r.topUpCents ? ` + top-up ${formatMoney(r.topUpCents)} ${r.topUpStatus}` : ""}) · {r.guestFirstName} {r.guestLastName}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
        <div className="space-y-6">
          <Panel className="p-6 text-sm">
            <p className="text-muted">Balance</p>
            <p className="font-display text-4xl">{formatMoney(cert.balanceCents)}</p>
            <p className="text-muted">of {formatMoney(cert.valueCents)}</p>
            <dl className="mt-4 space-y-1">
              <div>
                <dt className="inline text-muted">For: </dt>
                <dd className="inline">{cert.recipientName}</dd>
              </div>
              {cert.fromName && (
                <div>
                  <dt className="inline text-muted">From: </dt>
                  <dd className="inline">{cert.fromName}</dd>
                </div>
              )}
              <div>
                <dt className="inline text-muted">Issued: </dt>
                <dd className="inline">{formatDateTime(cert.issuedAt)}</dd>
              </div>
              <div>
                <dt className="inline text-muted">Expires: </dt>
                <dd className="inline">{cert.expiresAt ? formatDate(cert.expiresAt) : "never"}</dd>
              </div>
            </dl>
            {cert.orderId && (
              <Link href={`/admin/orders/${cert.orderId}`} className="mt-4 block font-semibold text-moss">
                View order →
              </Link>
            )}
            <form action={setCertificateCancelled} className="mt-6">
              <input type="hidden" name="code" value={cert.code} />
              <input type="hidden" name="cancelled" value={cert.isCancelled ? "false" : "true"} />
              <button className="btn btn-outline btn-sm">{cert.isCancelled ? "Reactivate code" : "Cancel (void) code"}</button>
            </form>
          </Panel>
        </div>
      </div>
    </>
  );
}
