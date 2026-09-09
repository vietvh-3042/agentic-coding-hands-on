/**
 * Formats an ISO timestamp as "HH:mmAM/PM" (matches the design's ticker
 * format, e.g. "08:30PM"). UTC extraction — see format-kudo-timestamp.ts
 * for why (avoids a server/client hydration mismatch).
 *
 * Shared by the Spotlight word-cloud tooltip (`spotlight-name-node.tsx`)
 * and the Spotlight activity ticker (`spotlight-board.tsx`), which both
 * render this exact format from the design.
 */
export function formatTimeOfDay(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const hours24 = date.getUTCHours();
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;
  return `${String(hours12).padStart(2, "0")}:${minutes}${period}`;
}
