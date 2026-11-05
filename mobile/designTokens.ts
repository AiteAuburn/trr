/** Shared palette for every mobile surface, including preview-only routes. */
export const palette = {
  canvas: "#F7F8F4",
  surface: "#FFFFFF",
  ink: "#183F36",
  text: "#29473E",
  secondary: "#62766C",
  muted: "#6D7C72",
  brand: "#26735D",
  wash: "#EAF2EA",
  subtle: "#F1F5EF",
  border: "#DFE7DD",
  accentBorder: "#CDDED0",
  neutral: "#EFF2EC",
  danger: "#AA4548",
  dangerWash: "#FBEFEC",
  warning: "#8E572D",
  warningWash: "#FFF5E7",
  warningBorder: "#EAD9BE",
  onBrand: "#FFFFFF"
} as const;

export const motion = { enter: 220, breathe: 1100 } as const;
