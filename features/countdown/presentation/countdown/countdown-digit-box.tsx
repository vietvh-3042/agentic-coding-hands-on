/**
 * A single LED-style countdown digit — Figma "Group" (Rectangle 1 + digit).
 * A frosted rounded box (translucent white gradient, yellow border, blur) with
 * a dim DSEG7 "8" ghost (all segments) behind the bright lit digit, matching
 * the real 7-segment display look. Box size/border/gradient are verbatim Figma.
 */
export default function CountdownDigitBox({ char }: { char: string }) {
  return (
    <div className="relative h-[122.88px] w-[76.8px] shrink-0">
      {/* mm:I…;186:2616 Rectangle 1 — frosted box (own 0.5 opacity layer so the
          digit above stays fully lit). */}
      <div
        className="absolute inset-0 rounded-xl border-[0.75px] border-[#FFEA9E] opacity-50 backdrop-blur-[24.96px]"
        style={{
          background: "linear-gradient(180deg, #FFF 0%, rgba(255, 255, 255, 0.10) 100%)",
        }}
      />
      {/* unlit segment ghost */}
      <span
        aria-hidden
        className="absolute inset-0 grid place-items-center font-[DSEG7,monospace] text-[73.73px] leading-none text-white/12"
      >
        8
      </span>
      {/* lit digit */}
      <span className="absolute inset-0 grid place-items-center font-[DSEG7,monospace] text-[73.73px] leading-none text-white [text-shadow:0_0_8px_rgba(255,255,255,0.35)]">
        {char}
      </span>
    </div>
  );
}
