import { Platform } from "react-native";

const fontFamily = Platform.select({
  ios: "System",
  android: "Roboto",
  default: "System",
});

export const Typography = {
  h1: { fontSize: 30, fontWeight: "700" as const, lineHeight: 36 },
  h2: { fontSize: 24, fontWeight: "700" as const, lineHeight: 30 },
  h3: { fontSize: 20, fontWeight: "600" as const, lineHeight: 26 },
  h4: { fontSize: 18, fontWeight: "600" as const, lineHeight: 24 },
  body: { fontSize: 16, fontWeight: "400" as const, lineHeight: 22 },
  bodyMedium: { fontSize: 16, fontWeight: "500" as const, lineHeight: 22 },
  bodySemibold: { fontSize: 16, fontWeight: "600" as const, lineHeight: 22 },
  small: { fontSize: 14, fontWeight: "400" as const, lineHeight: 18 },
  smallMedium: { fontSize: 14, fontWeight: "500" as const, lineHeight: 18 },
  caption: { fontSize: 12, fontWeight: "400" as const, lineHeight: 16 },
  button: { fontSize: 18, fontWeight: "600" as const, lineHeight: 22 },
  buttonSmall: { fontSize: 16, fontWeight: "600" as const, lineHeight: 20 },
  tabLabel: { fontSize: 12, fontWeight: "500" as const, lineHeight: 16 },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  section: 40,
};

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
};

export const Shadow = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
};
