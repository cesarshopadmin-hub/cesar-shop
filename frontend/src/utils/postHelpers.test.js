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
    expect(normalizeText("ألعاب")).toBe("ألعاب");
  });

  it("trims Arabic text correctly", () => {
    expect(normalizeText("  ألعاب  ")).toBe("ألعاب");
  });
});

// ─────────────────────────────────────────────
// matchesCategory
// ─────────────────────────────────────────────
describe("matchesCategory", () => {
  // ── "all" case ──────────────────────────────
  describe('when selectedCategory is "all"', () => {
    it("returns true for any non-empty postCategory", () => {
      expect(matchesCategory("ألعاب", "all")).toBe(true);
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

  // ── "ألعاب" prefix logic ────────────────────
  describe('when selectedCategory is "ألعاب"', () => {
    it('returns true when postCategory is exactly "ألعاب"', () => {
      expect(matchesCategory("ألعاب", "ألعاب")).toBe(true);
    });

    it('returns true when postCategory starts with "ألعاب" (sub-category)', () => {
      expect(matchesCategory("ألعاب موبايل", "ألعاب")).toBe(true);
    });

    it('returns true when postCategory starts with "ألعاب" with extra spacing', () => {
      expect(matchesCategory("  ألعاب موبايل  ", "ألعاب")).toBe(true);
    });

    it('returns false when postCategory does not start with "ألعاب"', () => {
      expect(matchesCategory("حسابات سوشيال ميديا", "ألعاب")).toBe(false);
    });

    it("returns false for an empty postCategory", () => {
      expect(matchesCategory("", "ألعاب")).toBe(false);
    });

    it("returns false for a null postCategory", () => {
      expect(matchesCategory(null, "ألعاب")).toBe(false);
    });
  });

  // ── Exact match cases ───────────────────────
  describe("exact category matching (non-'all', non-'ألعاب')", () => {
    it("returns true for an exact match", () => {
      expect(matchesCategory("حسابات سوشيال ميديا", "حسابات سوشيال ميديا")).toBe(true);
    });

    it("returns true for a match that differs only in surrounding spaces", () => {
      expect(matchesCategory("  حسابات سوشيال ميديا  ", "حسابات سوشيال ميديا")).toBe(true);
    });

    it("returns false when the postCategory is a different category", () => {
      expect(matchesCategory("ألعاب", "حسابات سوشيال ميديا")).toBe(false);
    });

    it("returns false for a partial match that is not a prefix match", () => {
      expect(matchesCategory("حسابات", "حسابات سوشيال ميديا")).toBe(false);
    });

    it('returns true for the "أخرى" category when it matches exactly', () => {
      expect(matchesCategory("أخرى", "أخرى")).toBe(true);
    });

    it('returns false for "أخرى" when postCategory is something else', () => {
      expect(matchesCategory("ألعاب", "أخرى")).toBe(false);
    });

    it("returns false for an empty postCategory against a real category", () => {
      expect(matchesCategory("", "حسابات سوشيال ميديا")).toBe(false);
    });

    it("returns false for a null postCategory against a real category", () => {
      expect(matchesCategory(null, "حسابات سوشيال ميديا")).toBe(false);
    });
  });
});
