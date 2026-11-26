/** Escapes text for HTML content and double- or single-quoted attributes. Import-free: the owner page and the email builder share it. */
export function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
