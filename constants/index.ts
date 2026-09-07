export interface IOption {
  label: string;
  value: number;
}

export const DEPARTMENTS: IOption[] = [
  { label: "CEVC1", value: 1 },
  { label: "CEVC2", value: 2 },
  { label: "CEVC3", value: 3 },
  { label: "CEVC4", value: 4 },
];

export function departmentLabel(value: number): string {
  return DEPARTMENTS.find((h) => h.value === value)?.label ?? "";
}

export interface NavRoute {
  /** i18n label key in the "nav" namespace. */
  key: string;
  /** Real route path. */
  url: string;
}

/**
 * Primary nav routes, shared by the site header (`nav-links.tsx`) and footer
 * (`site-footer.tsx`) so both stay in sync. Each entry's label comes from the
 * "nav" i18n namespace; the active item is the one whose `url` matches the
 * current pathname.
 */
export const ROUTERS: readonly NavRoute[] = [
  { key: "aboutSaa", url: "/about" },
  { key: "awardInformation", url: "/award-info" },
  { key: "sunKudos", url: "/sun-kudos" },
];

/** Max images attachable to a single KUDOS (Figma "Image" field cap). */
export const KUDOS_MAX_IMAGES = 5;

/** Max hashtags selectable on a single KUDOS (SAA hashtag picker cap). */
export const KUDOS_MAX_HASHTAGS = 5;
