"use client";

import { useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";

type CountdownUnit = { label: string; value: string };
type EventInfo = { labelKey: string; valueKey: string };
type CountdownState = { countdown: CountdownUnit[]; showComingSoon: boolean };

/** Target event datetime — Figma "mms_B1.3_Countdown" (26/12/2025, 18:30 ICT). */
const EVENT_DATE = new Date("2026-12-26T18:30:00+07:00");

const EVENT_INFO: EventInfo[] = [
  { labelKey: "home:hero.eventInfo.timeLabel", valueKey: "home:hero.eventInfo.time" },
  { labelKey: "home:hero.eventInfo.locationLabel", valueKey: "home:hero.eventInfo.location" },
];

/**
 * Internal, untranslated countdown unit identifiers used by the store logic
 * (comparisons, React keys). The user-visible labels are resolved from these
 * via `COUNTDOWN_LABEL_KEYS` at render time — see `HeroInfoBlock`.
 */
const ZERO_COUNTDOWN: CountdownUnit[] = ["DAYS", "HOURS", "MINUTES"].map((label) => ({
  label,
  value: "00",
}));

const COUNTDOWN_LABEL_KEYS: Record<string, string> = {
  DAYS: "home:hero.countdown.days",
  HOURS: "home:hero.countdown.hours",
  MINUTES: "home:hero.countdown.minutes",
};

/**
 * Stable initial snapshot used both for the server render and for the first
 * client render before hydration — guarantees no SSR/hydration mismatch.
 * "Coming soon" stays visible until the real (post-mount) state is known.
 */
const INITIAL_STATE: CountdownState = {
  countdown: ZERO_COUNTDOWN,
  showComingSoon: true,
};

/** Pads a non-negative integer to 2 digits (e.g. 3 -> "03", 20 -> "20"). */
function pad2(n: number): string {
  return String(Math.max(0, n)).padStart(2, "0");
}

function computeState(): CountdownState {
  const diffMs = EVENT_DATE.getTime() - Date.now();
  if (diffMs <= 0) {
    return { countdown: ZERO_COUNTDOWN, showComingSoon: false };
  }
  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  return {
    countdown: [
      { label: "DAYS", value: pad2(days) },
      { label: "HOURS", value: pad2(hours) },
      { label: "MINUTES", value: pad2(minutes) },
    ],
    showComingSoon: true,
  };
}

/**
 * Module-level countdown store shared by every mounted instance — there is
 * only ever one countdown on the page. Recomputes and notifies subscribers
 * once per minute; the cached snapshot keeps `useSyncExternalStore` from
 * re-rendering on every call between ticks.
 */
let cachedState = INITIAL_STATE;
const listeners = new Set<() => void>();
let intervalId: ReturnType<typeof setInterval> | undefined;

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  if (intervalId === undefined) {
    // First subscriber: compute the real (post-mount) state immediately
    // instead of waiting up to 60s for the next tick, then start ticking.
    cachedState = computeState();
    intervalId = setInterval(() => {
      cachedState = computeState();
      listeners.forEach((listener) => listener());
    }, 60_000);
  }
  // Notify this subscriber so React re-checks the snapshot right away and
  // picks up the freshly computed state above.
  callback();
  return () => {
    listeners.delete(callback);
    if (listeners.size === 0 && intervalId !== undefined) {
      clearInterval(intervalId);
      intervalId = undefined;
    }
  };
}

function getSnapshot(): CountdownState {
  return cachedState;
}

function getServerSnapshot(): CountdownState {
  return INITIAL_STATE;
}

/**
 * Countdown + event info — Figma "Frame 523" (mms_B1_Countdown time,
 * mms_B2_Thông tin sự kiện). Digit tiles use the "Digital Numbers" display
 * font from the design; falls back to monospace since that font file isn't
 * bundled with the project.
 *
 * Counts down to a hardcoded event datetime, ticking once per minute via a
 * `useSyncExternalStore`-backed clock (hydration-safe: server + first client
 * render share the same zeroed snapshot, real time is read only after mount).
 */
export default function HeroInfoBlock() {
  const { t } = useTranslation();
  const { countdown, showComingSoon } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    // mm:2167:9034
    <div className="flex w-full flex-col items-start gap-4 font-(family-name:--font-montserrat) text-white">
      {/* mm:2167:9035 mms_B1_Countdown time */}
      <div className="flex flex-col items-start gap-4">
        {/* mm:2167:9036 */}
        {showComingSoon && <p className="text-[24px] leading-8 font-bold">{t("home:hero.countdown.comingSoon")}</p>}

        {/* mm:2167:9037 mms_B1.3_Countdown */}
        <div className="flex flex-wrap items-center gap-10">
          {countdown.map((unit) => (
            <div key={unit.label} className="flex flex-col items-start gap-3.5">
              {/* mm:2167:9039 Frame 485 — digit tiles */}
              <div className="flex items-center gap-3.5">
                {unit.value.split("").map((digit, i) => (
                  <div
                    key={i}
                    className="relative flex h-20.5 w-12.75 items-center justify-center overflow-hidden rounded-lg"
                  >
                    {/* mm:2167:9040 Rectangle 1 */}
                    <div
                      aria-hidden
                      className="absolute inset-0 rounded-lg border-[0.5px] border-[#FFEA9E] opacity-50 backdrop-blur-md"
                      style={{
                        background: "linear-gradient(180deg, #FFF 0%, rgba(255,255,255,0.10) 100%)",
                      }}
                    />
                    <span
                      className="relative text-[49px] leading-none"
                      style={{ fontFamily: "'Digital Numbers', monospace" }}
                    >
                      {digit}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[24px] leading-8 font-bold">{t(COUNTDOWN_LABEL_KEYS[unit.label])}</p>
            </div>
          ))}
        </div>
      </div>

      {/* mm:2167:9053 mms_B2_Thông tin sự kiện */}
      <div className="flex flex-col items-start gap-2">
        {/* mm:2167:9054 Frame 522 */}
        <div className="flex flex-wrap items-center gap-15">
          {EVENT_INFO.map((info) => (
            <p key={info.labelKey} className="flex items-center gap-1 text-[24px] leading-8 font-bold text-[#FFEA9E]">
              <span className="text-[16px] leading-6 tracking-[0.15px] text-white">{t(info.labelKey)}</span>{" "}
              {t(info.valueKey)}
            </p>
          ))}
        </div>
        {/* mm:2167:9061 */}
        <p className="text-[16px] leading-6 font-bold tracking-[0.5px]">{t("home:hero.eventInfo.livestreamNote")}</p>
      </div>
    </div>
  );
}
