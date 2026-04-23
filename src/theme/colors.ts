export const Colors = {
  // Primary dark backgrounds
  navy: "#1B2B3A",
  navyLight: "#2A3F52",
  navyDark: "#111D28",

  // Screen backgrounds (dark theme)
  background: "#0F1B26", // main screen background
  surface: "#1B2B3A", // card / panel background
  surfaceAlt: "#162231", // slightly darker card variant
  surfaceLift: "#243040", // elevated surface / inputs

  // Borrower accent
  teal: "#2BB5A0",
  tealDark: "#239E8C",
  tealLight: "#1E3130", // subtle teal-tinted dark bg

  // Lender accent
  gold: "#C4A55A",
  goldDark: "#B0923E",
  goldLight: "#1A2540", // subtle gold-tinted dark bg

  // Borders
  border: "#2A3F52",
  borderLight: "#1E3040",

  // Text (dark-mode)
  textPrimary: "#FFFFFF",
  textSecondary: "#8A9BA8",
  textMuted: "#556070",
  textWhite: "#FFFFFF",

  // Neutrals
  white: "#FFFFFF",

  // Status
  success: "#22C55E",
  successBg: "#1A3A28",
  successLight: "#DCFCE7",
  warning: "#F59E0B",
  warningBg: "#2D2A18",
  warningLight: "#FEF3C7",
  danger: "#EF4444",
  dangerBg: "#3A1A1A",
  dangerLight: "#FEE2E2",
  info: "#3B82F6",
  infoLight: "#DBEAFE",

  // Overlays
  overlay: "rgba(0,0,0,0.6)",
  shadow: "rgba(0,0,0,0.3)",
};

export const BorrowerColors = {
  primary: Colors.teal,
  primaryDark: Colors.tealDark,
  bg: "#0D1C1B",
  card: "#132221",
  cardAlt: "#1E3130",
};

export const LenderColors = {
  primary: Colors.gold,
  primaryDark: Colors.goldDark,
  bg: "#0C1520",
  card: "#1A2540",
  cardAlt: "#1D2A45",
};
