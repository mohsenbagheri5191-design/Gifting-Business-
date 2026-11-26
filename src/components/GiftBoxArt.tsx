import { boxColors, type BoxColorId } from "@/lib/config";
import { cn } from "@/lib/ui";

/** Isometric illustration of the Keepsake gift box in any of the colourways. */
export function GiftBoxArt({ color = "sage", className }: { color?: BoxColorId | string; className?: string }) {
  const c = boxColors.find((b) => b.id === color) ?? boxColors[0];
  const shade = (o: number) => `rgba(20,24,18,${o})`;
  return (
    <svg viewBox="0 0 320 270" className={cn("h-auto w-full", className)} role="img" aria-label={`${c.name} gift box`}>
      <ellipse cx="160" cy="254" rx="118" ry="13" fill={shade(0.12)} />
      {/* body */}
      <polygon points="52,122.5 160,172 160,250 52,200.5" fill={c.body} />
      <polygon points="160,172 268,122.5 268,200.5 160,250" fill={c.body} />
      <polygon points="160,172 268,122.5 268,200.5 160,250" fill={shade(0.14)} />
      {/* lid */}
      <polygon points="40,95 160,150 160,172 40,117" fill={c.lid} />
      <polygon points="40,95 160,150 160,172 40,117" fill={shade(0.06)} />
      <polygon points="160,150 280,95 280,117 160,172" fill={c.lid} />
      <polygon points="160,150 280,95 280,117 160,172" fill={shade(0.18)} />
      <polygon points="160,40 280,95 160,150 40,95" fill={c.lid} />
      {/* ribbons */}
      <polygon points="91.8,118.74 108.2,126.26 108.2,226.26 91.8,218.74" fill={c.ribbon} />
      <polygon points="211.8,126.26 228.2,118.74 228.2,218.74 211.8,226.26" fill={c.ribbon} />
      <polygon points="211.8,126.26 228.2,118.74 228.2,218.74 211.8,226.26" fill={shade(0.12)} />
      <polygon points="91.8,71.25 211.8,126.25 228.2,118.75 108.2,63.75" fill={c.ribbon} />
      <polygon points="211.8,63.75 91.8,118.75 108.2,126.25 228.2,71.25" fill={c.ribbon} />
      {/* bow */}
      <g fill={c.ribbon} stroke={shade(0.12)} strokeWidth="1">
        <path d="M160 92c-10-18-38-26-44-14-5 10 22 20 44 14Z" />
        <path d="M160 92c10-18 38-26 44-14 5 10-22 20-44 14Z" />
        <path d="M157 96c-6 10-14 22-22 28l6 3c7-6 14-16 19-28Z" />
        <path d="M163 96c6 10 14 22 22 28l-6 3c-7-6-14-16-19-28Z" />
        <ellipse cx="160" cy="93" rx="8" ry="6" />
      </g>
      {/* embossed mark on the front-right face */}
      <g transform="translate(182 172) skewY(-24.6)" opacity="0.45" fill="none" stroke={c.accent} strokeWidth="1.3">
        <path d="M6 30V14a8 8 0 0 1 16 0v16" />
        <path d="M14 28v-9" />
      </g>
    </svg>
  );
}
