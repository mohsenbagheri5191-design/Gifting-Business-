import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { getCertificate } from "@/lib/redemptions";
import { site } from "@/lib/config";
import { CertificateCard } from "@/components/CertificateCard";
import { PrintButton } from "@/components/PrintButton";

export const metadata: Metadata = { title: "Gift certificate", robots: { index: false } };

export default async function CertificatePage({ params }: { params: Promise<{ code: string }> }) {
  const cert = await getCertificate((await params).code);
  if (!cert || cert.kind !== "gift") notFound();
  const qrSvg = await QRCode.toString(`${site.url}/redeem/${cert.code}`, { type: "svg", margin: 0, color: { dark: "#1f241e", light: "#ffffff" } });

  return (
    <div className="container-page max-w-3xl py-12">
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">Print this page, save it as a PDF, or share the link.</p>
        <div className="flex gap-2">
          <PrintButton />
          <Link href={`/redeem/${cert.code}`} className="btn btn-primary btn-sm">
            Choose an experience
          </Link>
        </div>
      </div>
      <CertificateCard
        recipientName={cert.recipientName ?? ""}
        fromName={cert.fromName}
        message={cert.message}
        items={cert.items.map((i) => ({ title: i.title, optionLabel: i.optionLabel }))}
        code={cert.code}
        expiresAt={cert.expiresAt}
        qrSvg={qrSvg}
      />
      <ol className="mt-10 grid gap-4 text-sm text-ink-soft sm:grid-cols-3">
        {[
          ["Open", `Go to ${site.url.replace(/^https?:\/\//, "")}/redeem or scan the code.`],
          ["Choose", "Pick one of the experiences — or swap for anything up to the gift's value."],
          ["Book", "Tell us your preferred dates. We confirm everything with the venue."],
        ].map(([t, d], i) => (
          <li key={t} className="rounded-2xl bg-paper p-5">
            <p className="font-display text-xl text-ink">
              {i + 1}. {t}
            </p>
            <p className="mt-1">{d}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
