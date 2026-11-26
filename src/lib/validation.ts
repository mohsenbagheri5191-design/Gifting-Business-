import { z } from "zod";

/** An error whose message is safe to show to the customer. */
export class UserError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
    this.name = "UserError";
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[\d\s().-]{7,20}$/;
const POSTAL_RE = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;

export const zName = z.string().trim().min(1, "Please enter a name").max(80, "That name is too long");
export const zEmail = z.string().trim().toLowerCase().max(200).regex(EMAIL_RE, "Please enter a valid email address");
export const zPhone = z.string().trim().regex(PHONE_RE, "Please enter a valid phone number");
export const zPostal = z.string().trim().toUpperCase().regex(POSTAL_RE, "Please enter a valid postal code (e.g. M5V 2T6)");
export const zDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Please choose a date");
export const zTime = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Please choose a time");
export const zId = z.coerce.number().int().positive();

export function firstIssue(err: z.ZodError): string {
  const issue = err.issues[0];
  if (!issue) return "Please check the form and try again.";
  if (issue.code === "invalid_value" && issue.path.includes("acceptTerms")) return "Please accept the terms to continue.";
  return issue.message && !issue.message.startsWith("Invalid input") ? issue.message : `Please check “${issue.path.join(".") || "the form"}”.`;
}

/** YYYY-MM-DD for "today" in Toronto. */
export function todayInToronto(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

export function isFutureDate(d: string) {
  return d > todayInToronto();
}
