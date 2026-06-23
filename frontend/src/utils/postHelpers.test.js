import { describe, it, expect } from "vitest";
import { normalizeText, matchesCategory } from "./postHelpers.js";

// ─────────────────────────────────────────────
// normalizeText
// ─────────────────────────────────────────────
describe("normalizeText", () => {
  it("returns a lowercase version of a normal string", () => {
    expect(normalizeText("Hello")).toBe("hello");
  });

  it("converts a fully uppercase string to lowercase", () => {
    expect(normalizeText("GAMING")).toBe("gaming");
  });

  it("trims leading whitespace", () => {
    expect(normalizeText("  hello")).toBe("hello");
  });

  it("trims trailing whitespace", () => {
    expect(normalizeText("hello  ")).toBe("hello");
  });

  it("trims both leading and trailing whitespace", () => {
    expect(normalizeText("  Hello World  ")).toBe("hello world");
  });

  it("returns an empty string when called with an empty string", () => {
    expect(normalizeText("")).toBe("");
  });

  it("returns an empty string when called with null", () => {
    expect(normalizeText(null)).toBe("");
  });

  it("returns an empty string when called with undefined", () => {
    expect(normalizeText(undefined)).toBe("");
  });

  it("converts numeric values to their string representation", () => {
    expect(normalizeText(42)).toBe("42");
  });

  it("preserves Arabic text (case-insensitive has no effect on Arabic)", () => {
    expect(normalizeText("ببجي")).toBe("ببجي");
  });

  it("trims Arabic text correctly", () => {
    expect(normalizeText("  ببجي  ")).toBe("ببجي");
  });
});

// ─────────────────────────────────────────────
// matchesCategory
// ─────────────────────────────────────────────
describe("matchesCategory", () => {
  // ── "all" case ──────────────────────────────
  describe('when selectedCategory is "all"', () => {
    it("returns true for any non-empty postCategory", () => {
      expect(matchesCategory("ببجي", "all")).toBe(true);
    });

    it("returns true for an empty postCategory", () => {
      expect(matchesCategory("", "all")).toBe(true);
    });

    it("returns true for a null postCategory", () => {
      expect(matchesCategory(null, "all")).toBe(true);
    });

    it("returns true for an undefined postCategory", () => {
      expect(matchesCategory(undefined, "all")).toBe(true);
    });
  });

  // ── Exact match cases ───────────────────────
  describe("exact category matching", () => {
    it("returns true for an exact match", () => {
      expect(matchesCategory("حسابات سوشيال ميديا", "حسابات سوشيال ميديا")).toBe(true);
    });

    it("returns true for a match that differs only in surrounding spaces", () => {
      expect(matchesCategory("  حسابات سوشيال ميديا  ", "حسابات سوشيال ميديا")).toBe(true);
    });

    it("returns false when the postCategory is a different category", () => {
      expect(matchesCategory("ببجي", "حسابات سوشيال ميديا")).toBe(false);
    });

    it("returns false for a partial match", () => {
      expect(matchesCategory("حسابات", "حسابات سوشيال ميديا")).toBe(false);
    });

    it('returns true for the "اخري" category when it matches exactly', () => {
      expect(matchesCategory("اخري", "اخري")).toBe(true);
    });

    it('returns false for "اخري" when postCategory is something else', () => {
      expect(matchesCategory("ببجي", "اخري")).toBe(false);
    });

    it("returns false for an empty postCategory against a real category", () => {
      expect(matchesCategory("", "حسابات سوشيال ميديا")).toBe(false);
    });

    it("returns false for a null postCategory against a real category", () => {
      expect(matchesCategory(null, "حسابات سوشيال ميديا")).toBe(false);
    });
  });
});
