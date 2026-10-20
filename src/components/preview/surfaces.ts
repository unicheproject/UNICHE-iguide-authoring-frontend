/** The visitor surfaces as the stand-in preview draws them (`04` §6; DECISIONS.md D-014, D-015). */
export const SURFACES = {
  WEB: { label: "Web", caption: "Desktop browser, 1280 wide", width: 1280, height: 860, font: 16 },
  MOBILE: { label: "Mobile", caption: "Phone, 390 wide", width: 390, height: 780, font: 15 },
  KIOSK: { label: "Kiosk", caption: "Kiosk screen, 1080 wide", width: 1080, height: 1500, font: 24 },
} as const;

export type Surface = keyof typeof SURFACES;
