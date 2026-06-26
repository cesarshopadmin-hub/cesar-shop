/**
 * Optimizes Cloudinary image URLs by injecting f_auto and q_auto parameters.
 *
 * @param {string} url - The original image URL
 * @returns {string} The optimized image URL
 */
export const optimizeImage = (url) => {
  if (!url) {
    return "";
  }
  if (!url.includes("res.cloudinary.com")) {
    return url;
  }
  if (url.includes("f_auto") || url.includes("q_auto")) {
    return url;
  }
  return url.replace("/image/upload/", "/image/upload/f_auto,q_auto/");
};
