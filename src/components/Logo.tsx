import React from "react";
import { Image, ImageStyle, StyleProp } from "react-native";
import { Colors } from "../theme";

interface Props {
  size?: number;
  color?: string;
  style?: StyleProp<ImageStyle>;
}

/** The real Mpola brand mark — matches the website's white-on-dark
 * treatment (its `brightness-0 invert` CSS filter) via RN's Image
 * `tintColor`, which flattens the two-tone PNG to one solid color. */
export function Logo({ size = 34, color = Colors.white, style }: Props) {
  return (
    <Image
      source={require("../../assets/mpola_logo-3.png")}
      style={[{ width: size, height: size, tintColor: color }, style]}
      resizeMode="contain"
    />
  );
}
