/**
 * Pen icon (write/edit affordance) — used by the FAB "Viết KUDOS" pill
 * (mm:I313:9140;214:3732;186:1763) and the Thể lệ drawer footer's edit
 * button. Extracted from `components/homepage/widget-button.tsx` so both
 * call sites share one module instead of two copies of the same path data.
 */
export default function IconPen(props: React.SVGProps<SVGSVGElement>) {
  return (
    // mm:I313:9140;214:3732;186:1763
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M20.8067 6.72951C21.1967 6.33951 21.1967 5.68951 20.8067 5.31951L18.4667 2.97951C18.0967 2.58951 17.4467 2.58951 17.0567 2.97951L15.2167 4.80951L18.9667 8.55951M3.09668 16.9395V20.6895H6.84668L17.9067 9.61951L14.1567 5.86951L3.09668 16.9395Z"
        fill="currentColor"
      />
    </svg>
  );
}
