import { describe, expect, it } from "vitest";
import { CODE_ALPHABET, formatCode, generateCertificateCode, isValidCode, normalizeCode } from "../src/lib/codes";
import { certificateValueCents, giftOrderTotals, splitRedemption } from "../src/lib/pricing";

describe("certificate codes", () => {
  it("are 14 random characters from an unambiguous alphabet", () => {
    for (let i = 0; i < 2000; i++) {
      const code = generateCertificateCode();
      expect(code).toHaveLength(14);
      expect(isValidCode(code)).toBe(true);
      expect(code).not.toMatch(/[ILOU]/);
    }
  });

  it("do not repeat", () => {
    const set = new Set(Array.from({ length: 50_000 }, generateCertificateCode));
    expect(set.size).toBe(50_000);
  });

  it("use every symbol roughly evenly (no modulo bias)", () => {
    const counts = new Map<string, number>();
    for (let i = 0; i < 20_000; i++) for (const ch of generateCertificateCode()) counts.set(ch, (counts.get(ch) ?? 0) + 1);
    expect(counts.size).toBe(CODE_ALPHABET.length);
    const expected = (20_000 * 14) / 32;
    for (const n of counts.values()) expect(Math.abs(n - expected) / expected).toBeLessThan(0.1);
  });

  it("forgive typing mistakes", () => {
    expect(normalizeCode(" 7kq2m9x-rbwd4th ")).toBe("7KQ2M9XRBWD4TH");
    expect(normalizeCode("o0iIlL")).toBe("001111");
    expect(formatCode("7KQ2M9XRBWD4TH")).toBe("7KQ2M9X-RBWD4TH");
    expect(isValidCode("7KQ2M9XRBWD4T")).toBe(false);
    expect(isValidCode("7KQ2M9XRBWD4TU")).toBe(false);
  });
});

describe("pricing", () => {
  it("charges only for the most expensive experience in the gift", () => {
    expect(certificateValueCents([{ priceCents: 16000 }, { priceCents: 13500 }, { priceCents: 12000 }])).toBe(16000);
  });

  it("adds packaging and delivery on top", () => {
    const t = giftOrderTotals([{ priceCents: 9500 }, { priceCents: 24000 }], "box", "courier");
    expect(t).toEqual({ certificateValueCents: 24000, packagingFeeCents: 1500, deliveryFeeCents: 2000, totalCents: 27500 });
    expect(giftOrderTotals([{ priceCents: 9500 }], "ecert", "email").totalCents).toBe(9500);
  });

  it("splits a choice between balance and top-up", () => {
    expect(splitRedemption(9500, 24000)).toEqual({ fromBalanceCents: 9500, topUpCents: 0, remainingBalanceCents: 14500 });
    expect(splitRedemption(32000, 24000)).toEqual({ fromBalanceCents: 24000, topUpCents: 8000, remainingBalanceCents: 0 });
  });
});
