/**
 * Normalizes a text value for comparison:
 * - Converts null/undefined to an empty string
 * - Trims surrounding whitespace
 * - Converts to lowercase
 *
 * @param {*} value - The value to normalize.
 * @returns {string} The normalized string.
 */
export function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .trim();
}

/**
 * Determines whether a post's category matches the currently selected category filter.
 *
 * Rules:
 * - "all" always matches every post.
 * - "ألعاب" matches any post whose category *starts with* "ألعاب" (covers sub-categories like "ألعاب موبايل").
 * - Any other value requires an exact (normalized) match.
 *
 * @param {string} postCategory     - The category value stored on the post.
 * @param {string} selectedCategory - The category the user has selected in the UI filter.
 * @returns {boolean} True when the post should be included in the filtered list.
 */
export function matchesCategory(postCategory, selectedCategory) {
  if (selectedCategory === "all") {
    return true;
  }

  const normalizedPostCategory = normalizeText(postCategory);

  if (selectedCategory === "ألعاب") {
    return normalizedPostCategory.startsWith("ألعاب");
  }

  return normalizedPostCategory === normalizeText(selectedCategory);
}
