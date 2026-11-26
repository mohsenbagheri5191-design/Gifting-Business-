/* eslint-disable @next/next/no-img-element */
import { cn } from "@/lib/ui";

const WIDTHS = [400, 640, 960, 1280, 1600, 2000];

/**
 * Responsive image. Unsplash URLs get a srcset served (and resized) by Unsplash's CDN;
 * any other URL (e.g. your own uploads) is used as-is.
 */
export function Img({
  src,
  alt,
  className,
  sizes = "(min-width: 1024px) 33vw, 100vw",
  priority = false,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  if (!src) return <div className={cn("bg-sand", className)} aria-hidden />;
  const loading = priority ? "eager" : "lazy";
  if (!src.startsWith("https://images.unsplash.com/")) {
    return <img src={src} alt={alt} className={className} loading={loading} decoding="async" />;
  }
  const u = (w: number) => `${src}?auto=format&fit=crop&w=${w}&q=72`;
  return (
    <img
      src={u(1280)}
      srcSet={WIDTHS.map((w) => `${u(w)} ${w}w`).join(", ")}
      sizes={sizes}
      alt={alt}
      className={className}
      loading={loading}
      decoding="async"
      fetchPriority={priority ? "high" : undefined}
    />
  );
}
