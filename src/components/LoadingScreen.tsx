import React from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Spacing } from "../theme";
import { Logo } from "./Logo";

/** The app's one canonical full-screen loading state — a screen that has
 * nothing to show yet (no layout worth rendering early) drops this in
 * instead of `null`/blank, which is what reads as a jarring flash/snap
 * when navigating. Screens whose layout renders immediately and only a
 * section of content is pending should keep using the shape-matched
 * Skeleton* components instead — this is for "nothing here yet at all." */
export function LoadingScreen({ color = Colors.teal }: { color?: string }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Logo size={48} style={styles.logo} />
        <ActivityIndicator size="small" color={color} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, alignItems: "center", justifyContent: "center", gap: Spacing.lg },
  logo: { opacity: 0.9 },
});
