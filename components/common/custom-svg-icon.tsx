"use client";

import { ReactSVG } from "react-svg";

interface CustomSvgIconProps {
  /** Path to an SVG file under `public/` (e.g. `/kudos/icons/send.svg`). */
  src: string;
  /** Sizing/color classes. `react-svg` applies these to the injected `<svg>`,
   *  so `h-/w-` size the icon and `text-*` colors it (SVG paths use currentColor). */
  className?: string;
}

/**
 * Renders a public SVG file inline via `react-svg` (`<ReactSVG>` fetches the
 * file and injects its markup). Because the injected `<svg>` receives
 * `className`, callers size it with `h-/w-` and recolor it with `text-*` as
 * long as the source SVG paints with `currentColor`. Shared across the app so
 * every file-based icon renders through one consistent component.
 */
export default function CustomSvgIcon({ src, className = "" }: CustomSvgIconProps) {
  // react-svg nests the injected <svg> inside its own (unsized) wrapper span and
  // keeps the SVG's intrinsic width/height, so sizing classes on the outer span
  // don't reach it. `[&>span]:contents` collapses react-svg's wrapper out of
  // layout and `[&_svg]:h-full/w-full` makes the injected SVG fill the sized
  // outer span — so `h-/w-` on `className` controls the rendered icon size.
  return (
    <span className={`inline-block shrink-0 [&_svg]:block [&_svg]:size-full [&>span]:contents ${className}`}>
      <ReactSVG src={src} wrapper="span" />
    </span>
  );
}
