/**
 * Shared field-label / field-error primitives for the write-Kudo form —
 * Figma "Title" instances (416:5550) and the red inline error beneath them.
 * Extracted from `kudos-form-fields.tsx` so `kudos-title-input.tsx` can reuse
 * the exact same pair rather than restating the type scale.
 */

/** Width of the fixed label column, and the matching indent for anything that
 *  must line up under the input beside it (139px label + 16px row gap). */
export const FIELD_CONTENT_INDENT = "ml-38.75";

/** Bold navy field label with a red required asterisk.
 *  `fixed` pins the label to a 139px column: the design hugs the label on the
 *  hashtag (108px) and image (74px) rows, but fixes it on the recipient and
 *  Danh hiệu rows so both of their inputs start at the same x (555 at design
 *  width). Without it those two adjacent inputs would stagger by ~12px.
 *
 *  `whitespace-nowrap` because the browser's Montserrat measures a few px wider
 *  than Figma's: "Người nhận*" wrapped to two lines inside the fixed 139px
 *  column. It now bleeds a little into the row's 16px gap instead, which keeps
 *  both the single-line label AND the shared input edge the design asks for. */
export function FieldLabel({
  children,
  required,
  fixed,
}: {
  children: React.ReactNode;
  required?: boolean;
  fixed?: boolean;
}) {
  return (
    <span
      className={`shrink-0 text-[22px] leading-7 font-bold whitespace-nowrap text-[#00101A] ${
        fixed ? "w-[139px]" : "max-w-[139px]"
      }`}
    >
      {children}
      {required && <span className="ml-0.5 text-[#CF1322]">*</span>}
    </span>
  );
}

/** Red inline field error, aligned under the input column. */
export function FieldError({ children }: { children: React.ReactNode }) {
  return <p className={`${FIELD_CONTENT_INDENT} text-sm font-bold text-[#CF1322]`}>{children}</p>;
}
