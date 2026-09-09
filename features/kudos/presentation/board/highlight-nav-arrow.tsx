/**
 * Prev/next carousel arrow — shared by the big B.2.1/B.2.2 slide buttons and
 * the small B.5.1/B.5.3 pagination buttons (both instances of componentId
 * 186:1425, only the inner arrow asset size/id differs — 335:10893/335:10890).
 */

/** Shared mask-image style so the arrow renders via `currentColor` (see write-kudos-bar.tsx). */
function arrowMaskStyle(direction: "left" | "right"): React.CSSProperties {
  const src = `/kudos/highlight/arrow-${direction}.svg`;
  return {
    maskImage: `url(${src})`,
    WebkitMaskImage: `url(${src})`,
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
    maskSize: "contain",
    WebkitMaskSize: "contain",
    maskPosition: "center",
    WebkitMaskPosition: "center",
  };
}

export interface NavArrowButtonProps {
  direction: "left" | "right";
  disabled: boolean;
  onClick: () => void;
  size?: "small" | "large";
  label: string;
}

export function NavArrowButton({ direction, disabled, onClick, size = "small", label }: NavArrowButtonProps) {
  const box = size === "large" ? "h-20 w-20" : "h-12 w-12";
  const icon = size === "large" ? "h-[60px] w-[60px]" : "h-7 w-7";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`flex ${box} shrink-0 items-center justify-center rounded disabled:cursor-not-allowed disabled:opacity-30`}
    >
      <span aria-hidden className={`inline-block ${icon} bg-current text-white`} style={arrowMaskStyle(direction)} />
    </button>
  );
}
