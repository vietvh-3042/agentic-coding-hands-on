"use client";

import { useEffect, useState } from "react";

export interface CountdownParts {
  /** Whole days remaining, clamped to the 2-digit display range 0–99. */
  days: number;
  /** Hours component, 0–23. */
  hours: number;
  /** Minutes component, 0–59. */
  minutes: number;
  /** Seconds component, 0–59. */
  seconds: number;
}

const ALL_ZERO: CountdownParts = { days: 0, hours: 0, minutes: 0, seconds: 0 };

/** Break a target instant (ms) into days/hours/minutes/seconds remaining from now. */
function computeParts(targetMs: number): CountdownParts {
  const diff = targetMs - Date.now();
  if (!Number.isFinite(diff) || diff <= 0) return ALL_ZERO;

  const totalSeconds = Math.floor(diff / 1_000);
  return {
    days: Math.min(99, Math.floor(totalSeconds / 86_400)),
    hours: Math.floor((totalSeconds % 86_400) / 3_600),
    minutes: Math.floor((totalSeconds % 3_600) / 60),
    seconds: totalSeconds % 60,
  };
}

/**
 * Live countdown to an ISO datetime, re-computed every second.
 *
 * Returns `null` until mounted so server and first client render agree (both
 * show "00"), avoiding hydration mismatch — the clock only exists on the client.
 */
export function useCountdown(iso: string): CountdownParts | null {
  const [parts, setParts] = useState<CountdownParts | null>(null);

  useEffect(() => {
    const targetMs = new Date(iso).getTime();
    const tick = () => setParts(computeParts(targetMs));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [iso]);

  return parts;
}
