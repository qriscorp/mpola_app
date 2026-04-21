import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius } from "../../src/theme";
import { Button } from "../../src/components";

const steps = [
  { label: "Application Submitted", done: true },
  { label: "Lender Review", active: true },
  { label: "Receive Offers", done: false },
  { label: "Accept Offer", done: false },
  { label: "Funds Disbursed", done: false },
];

export default function ApplicationSentScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🚀</Text>
        <Text style={styles.title}>Application Sent!</Text>
        <Text style={styles.ref}>Ref: LF-2025-04-8821</Text>

        {/* Status Timeline */}
        <View style={styles.timeline}>
          {steps.map((step, i) => (
            <View key={i} style={styles.timelineItem}>
              <View style={styles.timelineLeft}>
                <View
                  style={[
                    styles.dot,
                    step.done && styles.dotDone,
                    step.active && styles.dotActive,
                  ]}
                >
                  {step.done && (
                    <Ionicons name="checkmark" size={10} color={Colors.white} />
                  )}
                  {step.active && <View style={styles.dotPulse} />}
                </View>
                {i < steps.length - 1 && (
                  <View style={[styles.line, step.done && styles.lineDone]} />
                )}
              </View>
              <Text
                style={[
                  styles.timelineLabel,
                  (step.done || step.active) && styles.timelineLabelActive,
                ]}
              >
                {step.label}
              </Text>
            </View>
          ))}
        </View>

        <Button
          title="Track Application →"
          onPress={() => router.push("/(borrower)/loans")}
          color={Colors.teal}
        />
        <View style={{ height: Spacing.md }} />
        <Button
          title="Go to Dashboard"
          onPress={() => router.replace("/(borrower)/home")}
          variant="outline"
          color={Colors.teal}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing.xxl,
  },
  emoji: { fontSize: 48, textAlign: "center", marginBottom: Spacing.md },
  title: { ...Typography.h1, color: Colors.textPrimary, textAlign: "center" },
  ref: {
    ...Typography.small,
    color: Colors.textMuted,
    textAlign: "center",
    marginBottom: Spacing.xxxl,
  },
  timeline: { marginBottom: Spacing.xxxl, paddingLeft: Spacing.lg },
  timelineItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    minHeight: 48,
  },
  timelineLeft: { alignItems: "center", width: 24, marginRight: Spacing.md },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },
  dotDone: { backgroundColor: Colors.teal },
  dotActive: { backgroundColor: Colors.teal },
  dotPulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.white,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 2,
  },
  lineDone: { backgroundColor: Colors.teal },
  timelineLabel: { ...Typography.body, color: Colors.textMuted, paddingTop: 1 },
  timelineLabelActive: { color: Colors.textPrimary, fontWeight: "600" },
});
