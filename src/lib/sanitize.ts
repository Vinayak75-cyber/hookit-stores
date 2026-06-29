/**
 * Escape HTML special characters to prevent XSS attacks.
 * Converts <, >, &, ", and ' to their HTML entities.
 */
export function escapeHtml(text: string | null | undefined): string {
  if (!text) return "";
  
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
  };
  
  return text.replace(/[&<>"'/]/g, (char) => map[char] || char);
}