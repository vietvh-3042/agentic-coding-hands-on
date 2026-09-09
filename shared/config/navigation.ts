export interface NavRoute {
  key: string;
  url: string;
}

export const ROUTERS: readonly NavRoute[] = [
  { key: "aboutSaa", url: "/about" },
  { key: "awardInformation", url: "/award-info" },
  { key: "sunKudos", url: "/sun-kudos" },
];
