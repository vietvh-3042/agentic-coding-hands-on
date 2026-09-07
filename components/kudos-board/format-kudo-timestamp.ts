/**
 * Formats an ISO timestamp as `"HH:mm - MM/DD/YYYY"` (the design's literal
 * time format, e.g. "10:00 - 10/30/2025"). Uses UTC extraction methods
 * deliberately: this runs inside "use client" cards, which Next.js still
 * renders once on the server for the initial response — local-time methods
 * (`getHours`, etc.) would format differently if the server and the
 * visitor's browser sit in different timezones, causing a hydration
 * mismatch. UTC extraction is a fixed function of the ISO instant, so server
 * and client always agree.
 */
export function formatKudoTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mm = String(date.getUTCMinutes()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const year = date.getUTCFullYear();

  return `${hh}:${mm} - ${month}/${day}/${year}`;
}
