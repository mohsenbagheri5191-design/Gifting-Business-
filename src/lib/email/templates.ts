import { rules, site } from "../config";
import { formatCode } from "../codes";
import { formatDate, formatMoney } from "../format";

/* Email-safe design: tables, inline styles. Email clients rarely load web fonts,
   so the display face falls back to the closest humanist sans on each device. */
const C = {
  bg: "#F4EFE6",
  card: "#FBF8F2",
  ink: "#1F241E",
  soft: "#4B4F46",
  muted: "#7A7468",
  line: "#E2D9C9",
  moss: "#3F4A36",
  clay: "#96593A",
  sand: "#EDE5D7",
};
const display = "'Tenor Sans', 'Gill Sans', 'Gill Sans MT', Optima, 'Trebuchet MS', Helvetica, Arial, sans-serif";
const sans = "Figtree, 'Helvetica Neue', Helvetica, Arial, sans-serif";

export type EmailContent = { subject: string; html: string; text: string };

function esc(s: string | null | undefined) {
  return (s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function layout(preheader: string, body: string) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(site.name)}</title></head>
<body style="margin:0;padding:0;background:${C.bg};">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};padding:32px 12px;">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">
    <tr><td style="padding:0 8px 20px;font-family:${display};font-size:19px;color:${C.moss};letter-spacing:6px;text-transform:uppercase;">${esc(site.name)}</td></tr>
    <tr><td style="background:${C.card};border:1px solid ${C.line};border-radius:20px;padding:36px 32px;font-family:${sans};color:${C.ink};font-size:15px;line-height:1.6;">
      ${body}
    </td></tr>
    <tr><td style="padding:20px 8px;font-family:${sans};font-size:12px;line-height:1.6;color:${C.muted};">
      ${esc(site.name)} · ${esc(site.tagline)}<br>
      Questions? Reply to this email or call ${esc(site.supportPhone)} (${esc(site.supportHours)}).
    </td></tr>
  </table>
</td></tr></table></body></html>`;
}

const h1 = (t: string) => `<h1 style="margin:0 0 12px;font-family:${display};font-weight:normal;font-size:30px;line-height:1.2;color:${C.ink};">${t}</h1>`;
const p = (t: string) => `<p style="margin:0 0 14px;">${t}</p>`;
const button = (href: string, label: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0;"><tr><td style="background:${C.moss};border-radius:999px;">
   <a href="${href}" style="display:inline-block;padding:14px 28px;font-family:${sans};font-size:15px;color:#F4EFE6;text-decoration:none;font-weight:600;">${esc(label)}</a></td></tr></table>`;
const codeBlock = (code: string) =>
  `<div style="margin:18px 0;padding:18px;border:1px dashed ${C.clay};border-radius:14px;background:${C.sand};text-align:center;">
    <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${C.muted};">Your gift code</div>
    <div style="font-family:'Courier New',monospace;font-size:26px;letter-spacing:3px;color:${C.ink};margin-top:6px;">${esc(formatCode(code))}</div>
  </div>`;
const list = (rows: string[]) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 14px;">${rows
    .map((r) => `<tr><td style="padding:10px 0;border-bottom:1px solid ${C.line};">${r}</td></tr>`)
    .join("")}</table>`;

type ItemLike = { title: string; optionLabel: string; duration: string };

function validityLine(expiresAt: Date | null) {
  return expiresAt ? `Valid until ${formatDate(expiresAt)}.` : "This gift never expires.";
}

/** The e-certificate itself — sent to the recipient (or to the buyer to print/forward). */
export function certificateEmail(args: {
  code: string;
  recipientName: string;
  fromName: string;
  message: string | null;
  items: ItemLike[];
  expiresAt: Date | null;
  toBuyer: boolean;
}): EmailContent {
  const redeemUrl = `${site.url}/redeem/${args.code}`;
  const certUrl = `${site.url}/certificate/${args.code}`;
  const choice = args.items.length > 1 ? `a choice of ${args.items.length} experiences` : "an experience";
  const subject = args.toBuyer
    ? `Your Cadeau gift for ${args.recipientName} is ready`
    : `${args.fromName} sent you a Cadeau`;
  const intro = args.toBuyer
    ? p(`Here is the Cadeau for <strong>${esc(args.recipientName)}</strong>. Print it, forward this email, or share the link below — it's all they need.`)
    : p(`<strong>${esc(args.fromName)}</strong> has given you ${choice}. Choose the one you love, pick a date, and we'll take care of the rest.`);
  const message = args.message
    ? `<div style="margin:18px 0;padding:18px 20px;border-left:3px solid ${C.clay};background:${C.bg};font-family:${display};font-size:17px;line-height:1.5;color:${C.soft};">“${esc(args.message)}”<div style="font-family:${sans};font-size:13px;margin-top:8px;color:${C.muted};">— ${esc(args.fromName)}</div></div>`
    : "";
  const items = list(
    args.items.map(
      (i) =>
        `<div style="font-family:${display};font-size:17px;">${esc(i.title)}</div><div style="font-size:13px;color:${C.muted};">${esc(i.optionLabel)} · ${esc(i.duration)}</div>`,
    ),
  );
  const html = layout(
    args.toBuyer ? `The gift for ${args.recipientName} is ready to share.` : `${args.fromName} sent you a gift. Choose your experience.`,
    `${h1(args.toBuyer ? "Your gift is ready" : `${esc(args.recipientName)}, this is for you`)}
     ${intro}${message}
     <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${C.muted};margin-top:18px;">${args.items.length > 1 ? "Choose one of" : "Your experience"}</div>
     ${items}
     ${codeBlock(args.code)}
     ${button(redeemUrl, "Choose your experience")}
     ${p(`<span style="font-size:13px;color:${C.muted};">Prefer to pick something else? You can swap for any experience on ${esc(site.name)} up to the gift's value, top up for something bigger, and keep any remaining balance for another day. ${validityLine(args.expiresAt)}</span>`)}
     ${p(`<a href="${certUrl}" style="color:${C.moss};">View or print the certificate</a>`)}`,
  );
  const text = [
    args.toBuyer ? `Your Cadeau gift for ${args.recipientName} is ready.` : `${args.fromName} sent you a Cadeau.`,
    args.message ? `\n“${args.message}” — ${args.fromName}\n` : "",
    `${args.items.length > 1 ? "Choose one of:" : "Your experience:"}`,
    ...args.items.map((i) => `- ${i.title} (${i.optionLabel}, ${i.duration})`),
    `\nYour gift code: ${formatCode(args.code)}`,
    `Choose your experience: ${redeemUrl}`,
    validityLine(args.expiresAt),
  ].join("\n");
  return { subject, html, text };
}

export function orderReceiptEmail(args: {
  orderId: string;
  number: string;
  buyerFirstName: string;
  mode: "gift" | "self";
  recipientName: string | null;
  items: (ItemLike & { priceCents: number })[];
  certificateValueCents: number;
  packagingFeeCents: number;
  deliveryFeeCents: number;
  totalCents: number;
  code: string;
  deliveryNote: string;
}): EmailContent {
  const url = `${site.url}/order/${args.orderId}`;
  const rows = args.items.map(
    (i) =>
      `<table role="presentation" width="100%"><tr><td><div style="font-family:${display};font-size:16px;">${esc(i.title)}</div><div style="font-size:13px;color:${C.muted};">${esc(i.optionLabel)}</div></td><td align="right" style="white-space:nowrap;color:${C.soft};">${formatMoney(i.priceCents)}</td></tr></table>`,
  );
  const totals = `<table role="presentation" width="100%" style="font-size:14px;color:${C.soft};">
    <tr><td>${args.mode === "gift" ? "Gift value (the most expensive experience)" : "Experience"}</td><td align="right">${formatMoney(args.certificateValueCents)}</td></tr>
    ${args.packagingFeeCents ? `<tr><td>Gift box</td><td align="right">${formatMoney(args.packagingFeeCents)}</td></tr>` : ""}
    ${args.deliveryFeeCents ? `<tr><td>Delivery</td><td align="right">${formatMoney(args.deliveryFeeCents)}</td></tr>` : ""}
    <tr><td style="padding-top:8px;color:${C.ink};font-weight:600;">Total paid</td><td align="right" style="padding-top:8px;color:${C.ink};font-weight:600;">${formatMoney(args.totalCents)}</td></tr></table>`;
  const html = layout(
    `Order ${args.number} confirmed.`,
    `${h1(`Thank you, ${esc(args.buyerFirstName)}`)}
     ${p(args.mode === "gift" ? `Your gift for <strong>${esc(args.recipientName ?? "")}</strong> is confirmed. ${esc(args.deliveryNote)}` : `Your booking request is in. ${esc(args.deliveryNote)}`)}
     <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${C.muted};margin-top:18px;">Order ${esc(args.number)}</div>
     ${list(rows)}${totals}
     ${codeBlock(args.code)}
     ${button(url, "View your order")}`,
  );
  const text = [
    `Thank you, ${args.buyerFirstName}. Order ${args.number} is confirmed.`,
    args.deliveryNote,
    ...args.items.map((i) => `- ${i.title} (${i.optionLabel}) ${formatMoney(i.priceCents)}`),
    `Total paid: ${formatMoney(args.totalCents)}`,
    `Gift code: ${formatCode(args.code)}`,
    `View your order: ${url}`,
  ].join("\n");
  return { subject: `Order ${args.number} confirmed — ${site.name}`, html, text };
}

type BookingLike = {
  reference: string;
  title: string;
  optionLabel: string;
  locationName: string | null;
  locationAddress: string | null;
  preferredDate1: string;
  preferredTime1: string;
  preferredDate2: string | null;
  preferredTime2: string | null;
  scheduledFor?: string | null;
  adminNote?: string | null;
  guestFirstName: string;
};

function prettyDay(d: string) {
  return formatDate(new Date(`${d}T12:00:00`), { weekday: "long" });
}

export function bookingRequestedEmail(b: BookingLike, code: string, remainingCents: number): EmailContent {
  const prefs = [`${prettyDay(b.preferredDate1)} at ${b.preferredTime1}`, b.preferredDate2 ? `${prettyDay(b.preferredDate2)} at ${b.preferredTime2 ?? ""}` : null].filter(Boolean);
  const html = layout(
    `We've received your booking request for ${b.title}.`,
    `${h1("Your request is in")}
     ${p(`Hi ${esc(b.guestFirstName)}, thank you! We're checking availability for <strong>${esc(b.title)}</strong> (${esc(b.optionLabel)}) and will confirm by email within a few hours (or by the next morning for late requests).`)}
     ${list([`<strong>Reference</strong><br>${esc(b.reference)}`, `<strong>Your preferred times</strong><br>${prefs.map(esc).join("<br>")}`, b.locationName ? `<strong>Location</strong><br>${esc(b.locationName)}` : ""].filter(Boolean))}
     ${remainingCents > 0 ? p(`You still have <strong>${formatMoney(remainingCents)}</strong> on your gift — use it for another experience any time.`) : ""}
     ${button(`${site.url}/redeem/${code}`, "Manage your gift")}`,
  );
  return {
    subject: `Booking request received — ${b.title}`,
    html,
    text: `We've received your booking request (${b.reference}) for ${b.title}. We'll confirm within a few hours. Manage your gift: ${site.url}/redeem/${code}`,
  };
}

export function bookingConfirmedEmail(b: BookingLike, code: string): EmailContent {
  const html = layout(
    `Confirmed: ${b.title} on ${b.scheduledFor}.`,
    `${h1("You're booked")}
     ${p(`Hi ${esc(b.guestFirstName)}, your experience is confirmed. We can't wait for you to enjoy it.`)}
     ${list([`<strong>${esc(b.title)}</strong><br>${esc(b.optionLabel)}`, `<strong>When</strong><br>${esc(b.scheduledFor ?? "")}`, b.locationName ? `<strong>Where</strong><br>${esc(b.locationName)}${b.locationAddress ? `<br>${esc(b.locationAddress)}` : ""}` : "", `<strong>Reference</strong><br>${esc(b.reference)}`].filter(Boolean))}
     ${b.adminNote ? p(`<em>${esc(b.adminNote)}</em>`) : ""}
     ${p(`Need to change something? Reply to this email at least 48 hours before your booking.`)}
     ${button(`${site.url}/redeem/${code}`, "View your booking")}`,
  );
  return {
    subject: `Confirmed: ${b.title}`,
    html,
    text: `Your booking ${b.reference} for ${b.title} is confirmed for ${b.scheduledFor}. ${b.locationName ?? ""}`,
  };
}

export function bookingDeclinedEmail(b: BookingLike, code: string, restoredCents: number): EmailContent {
  const html = layout(
    `We couldn't confirm your requested times.`,
    `${h1("Let's find another time")}
     ${p(`Hi ${esc(b.guestFirstName)}, unfortunately your preferred times for <strong>${esc(b.title)}</strong> weren't available.`)}
     ${b.adminNote ? p(`<em>${esc(b.adminNote)}</em>`) : ""}
     ${p(`Don't worry — ${formatMoney(restoredCents)} is back on your gift. Choose new dates or a different experience whenever you're ready.`)}
     ${button(`${site.url}/redeem/${code}`, "Choose again")}`,
  );
  return {
    subject: `About your booking request — ${b.title}`,
    html,
    text: `Your preferred times for ${b.title} weren't available. ${formatMoney(restoredCents)} is back on your gift: ${site.url}/redeem/${code}`,
  };
}

export function adminNotice(subject: string, lines: string[], link: string): EmailContent {
  const html = layout(subject, `${h1(esc(subject))}${lines.map((l) => p(esc(l))).join("")}${button(link, "Open in admin")}`);
  return { subject: `[${site.name}] ${subject}`, html, text: `${lines.join("\n")}\n${link}` };
}

export const emailNotes = {
  validity: () => (rules.certificateValidMonths > 0 ? `valid for ${rules.certificateValidMonths} months` : "never expires"),
};
