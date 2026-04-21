import { Platform } from "react-native";

const fontFamily = Platform.select({
  ios: "System",
  android: "Roboto",
  default: "System",
});

export const Typography = {
  h1: { fontSize: 28, fontWeight: "700" as const, lineHeight: 34 },
  h2: { fontSize: 22, fontWeight: "700" as const, lineHeight: 28 },
  h3: { fontSize: 18, fontWeight: "600" as const, lineHeight: 24 },
  h4: { fontSize: 16, fontWeight: "600" as const, lineHeight: 22 },
  body: { fontSize: 14, fontWeight: "400" as const, lineHeight: 20 },
  bodyMedium: { fontSize: 14, fontWeight: "500" as const, lineHeight: 20 },
  bodySemibold: { fontSize: 14, fontWeight: "600" as const, lineHeight: 20 },
  small: { fontSize: 12, fontWeight: "400" as const, lineHeight: 16 },
  smallMedium: { fontSize: 12, fontWeight: "500" as const, lineHeight: 16 },
  caption: { fontSize: 10, fontWeight: "400" as const, lineHeight: 14 },
  button: { fontSize: 16, fontWeight: "600" as const, lineHeight: 20 },
  buttonSmall: { fontSize: 14, fontWeight: "600" as const, lineHeight: 18 },
  tabLabel: { fontSize: 10, fontWeight: "500" as const, lineHeight: 14 },
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
