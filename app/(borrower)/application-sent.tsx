import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius } from "../../src/theme";

const steps = [
  { label: "Application Submitted", done: true },
  { label: "Lender Review", done: false },
  { label: "Approval", done: false },
  { label: "Disbursement", done: false },
  { label: "Repayment", done: false },
];

export default function ApplicationSentScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.logoRow}>
          <View style={styles.logoBox}>
            <Text style={styles.logoLetter}>L</Text>
          </View>
          <Text style={styles.logoText}>WeLend</Text>
        </View>

        {/* Check icon */}
        <View style={styles.checkCircle}>
          <Ionicons name="checkmark" size={36} color={Colors.teal} />
        </View>

        <Text style={styles.title}>Application{"\n"}Submitted!</Text>
        <Text style={styles.sub}>
          Sent to James Mugisha. You'll be notified once reviewed.
        </Text>

        {/* Ref card */}
        <View style={styles.refCard}>
          <View style={styles.refRow}>
            <Text style={styles.refLabel}>Ref No.</Text>
            <Text style={styles.refValue}>#APP-20240091</Text>
          </View>
          <View
            style={[
              styles.refRow,
              {
                borderTopWidth: 1,
                borderTopColor: Colors.border,
                paddingTop: Spacing.sm,
              },
            ]}
          >
            <Text style={styles.refLabel}>Status</Text>
            <View style={styles.reviewBadge}>
              <Text style={styles.reviewBadgeText}>Under Review</Text>
            </View>
          </View>
        </View>

        {/* Timeline */}
        <View style={styles.timeline}>
          {steps.map((step, i) => (
            <View key={i} style={styles.timelineItem}>
              <View style={styles.timelineLeft}>
                <View style={[styles.dot, step.done && styles.dotDone]}>
                  {step.done ? (
                    <Ionicons name="checkmark" size={12} color={Colors.white} />
                  ) : (
                    <Text style={styles.dotNum}>{i + 1}</Text>
                  )}
                </View>
                {i < steps.length - 1 && (
                  <View style={[styles.line, step.done && styles.lineDone]} />
                )}
              </View>
              <Text
                style={[
                  styles.timelineLabel,
                  step.done && styles.timelineLabelDone,
                ]}
              >
                {step.label}
              </Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.replace("/(borrower)/home")}
        >
          <Text style={styles.primaryBtnText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.xl, paddingBottom: 48 },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xxl,
  },
  logoBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: Colors.teal,
    alignItems: "center",
    justifyContent: "center",
  },
  logoLetter: { fontSize: 16, fontWeight: "700", color: Colors.white },
  logoText: { ...Typography.h3, color: Colors.white },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.teal + "25",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.white,
    textAlign: "center",
    lineHeight: 36,
    marginBottom: Spacing.sm,
  },
  sub: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.xxl,
  },
  refCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xxl,
  },
  refRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.xs,
  },
  refLabel: { ...Typography.body, color: Colors.textMuted },
  refValue: {
    ...Typography.bodyMedium,
    color: Colors.white,
    fontWeight: "700",
  },
  reviewBadge: {
    backgroundColor: Colors.warningBg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  reviewBadgeText: {
    ...Typography.caption,
    color: Colors.warning,
    fontWeight: "600",
  },
  timeline: { marginBottom: Spacing.xxl },
  timelineItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    minHeight: 44,
  },
  timelineLeft: { alignItems: "center", width: 28, marginRight: Spacing.md },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dotDone: { backgroundColor: Colors.teal, borderColor: Colors.teal },
  dotNum: { ...Typography.caption, color: Colors.textMuted },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.border,
    marginVertical: 2,
  },
  lineDone: { backgroundColor: Colors.teal },
  timelineLabel: { ...Typography.body, color: Colors.textMuted, paddingTop: 2 },
  timelineLabelDone: { color: Colors.white, fontWeight: "600" },
  primaryBtn: {
    backgroundColor: Colors.teal,
    borderRadius: BorderRadius.full,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryBtnText: { ...Typography.button, color: Colors.white },
});
