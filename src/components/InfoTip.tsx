import React from "react";
import { TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../theme";

/** A small "i" icon that shows a short explainer in an Alert on tap — used
 * next to flow steps that aren't obvious from the UI alone (guarantors,
 * matching, offers). */
export function InfoTip({ title = "About this", text }: { title?: string; text: string }) {
  return (
    <TouchableOpacity
      onPress={() => Alert.alert(title, text)}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      accessibilityLabel="More information"
      accessibilityRole="button"
    >
      <Ionicons name="information-circle-outline" size={17} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}
