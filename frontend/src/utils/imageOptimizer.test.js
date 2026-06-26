import { describe, it, expect } from "vitest";
import { optimizeImage } from "./imageOptimizer.js";

describe("optimizeImage", () => {
  it("returns an empty string if url is falsy", () => {
    expect(optimizeImage(null)).toBe("");
    expect(optimizeImage(undefined)).toBe("");
    expect(optimizeImage("")).toBe("");
  });

  it("returns original url if it is not a Cloudinary url", () => {
    const localBlob = "blob:http://localhost:5173/some-uuid";
    const externalLink = "https://images.unsplash.com/photo-123456";
    expect(optimizeImage(localBlob)).toBe(localBlob);
    expect(optimizeImage(externalLink)).toBe(externalLink);
  });

  it("returns original url if it already contains f_auto or q_auto", () => {
    const alreadyOptimizedF = "https://res.cloudinary.com/demo/image/upload/f_auto/v1234/sample.jpg";
    const alreadyOptimizedQ = "https://res.cloudinary.com/demo/image/upload/q_auto/v1234/sample.jpg";
    const alreadyOptimizedBoth = "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto/v1234/sample.jpg";
    expect(optimizeImage(alreadyOptimizedF)).toBe(alreadyOptimizedF);
    expect(optimizeImage(alreadyOptimizedQ)).toBe(alreadyOptimizedQ);
    expect(optimizeImage(alreadyOptimizedBoth)).toBe(alreadyOptimizedBoth);
  });

  it("injects f_auto,q_auto options after /image/upload/ for standard Cloudinary URLs", () => {
    const rawCloudinary = "https://res.cloudinary.com/demo/image/upload/v123456/sample.jpg";
    const expected = "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto/v123456/sample.jpg";
    expect(optimizeImage(rawCloudinary)).toBe(expected);
  });
});
