import { notFound } from "next/navigation";

// Renders the site's 404 (with header and footer) for any unknown URL.
export default function Missing() {
  notFound();
}
