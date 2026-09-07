"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { LAUNCH_AT } from "@/lib/countdown-config";
import { useCountdown } from "@/hooks/use-countdown";
import CountdownDigitBox from "./countdown-digit-box";

/** One countdown unit — Figma "1_Days" etc.: two digit boxes + a label. */
function CountdownUnit({ value, label }: { value: number; label: string }) {
  const [tens, ones] = String(value).padStart(2, "0").split("");
  return (
    // mm:2268:35139 unit — boxes row + left-aligned label
    <div className="flex flex-col items-start gap-5.25">
      <div className="flex flex-row gap-5.25">
        <CountdownDigitBox char={tens} />
        <CountdownDigitBox char={ones} />
      </div>
      <span className="font-(family-name:--font-montserrat) text-[36px] leading-12 font-bold text-white">{label}</span>
    </div>
  );
}

/**
 * Countdown block — Figma "Countdown time" (2268:35136). Title + a row of the
 * DAYS / HOURS / MINUTES / SECONDS units, ticking every second toward LAUNCH_AT.
 * Scales down on smaller viewports so the row never overflows.
 */
export default function CountdownTimer() {
  const router = useRouter();
  const { t } = useTranslation();
  const parts = useCountdown(LAUNCH_AT);
  const { days, hours, minutes, seconds } = parts ?? {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  };

  // Once the countdown hits 00:00:00:00 the event is live — send the user to
  // the homepage. `parts` is null until mounted, so this only fires post-mount
  // (never during SSR), when the real remaining time has actually elapsed.
  // `replace` keeps the dead countdown out of the browser history.
  const expired = parts !== null && parts.days === 0 && parts.hours === 0 && parts.minutes === 0 && parts.seconds === 0;
  useEffect(() => {
    if (expired) router.replace("/about");
  }, [expired, router]);

  return (
    <div className="flex origin-center scale-50 flex-col items-center gap-6 sm:scale-75 md:scale-100">
      {/* mm:2268:35137 title */}
      <p className="text-center font-(family-name:--font-montserrat) text-[36px] leading-12 font-bold text-white">
        {t("countdown:title")}
      </p>
      {/* mm:2268:35138 Time — 4 units */}
      <div className="flex flex-row items-center gap-15">
        <CountdownUnit value={days} label={t("countdown:days")} />
        <CountdownUnit value={hours} label={t("countdown:hours")} />
        <CountdownUnit value={minutes} label={t("countdown:minutes")} />
        <CountdownUnit value={seconds} label={t("countdown:seconds")} />
      </div>
    </div>
  );
}
