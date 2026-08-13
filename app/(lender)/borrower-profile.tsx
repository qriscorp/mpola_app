import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius } from "../../src/theme";
import { Button, Badge, SkeletonHero, SkeletonCard } from "../../src/components";
import { useApplicationDetailViewModel } from "../../src/viewmodels";
import { applicationStatusLabel } from "../../src/services/applicationStatus";
import { formatDuration } from "../../src/services/duration";

function initials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function BorrowerProfileScreen() {
  const router = useRouter();
  const { applicationId } = useLocalSearchParams<{ applicationId: string }>();
  const { application, isLoading, error } = useApplicationDetailViewModel(
    applicationId ?? "",
  );

  if (!applicationId || error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: Spacing.lg }}>
          <Text style={{ color: Colors.textMuted }}>
            {error ? "This application couldn't be found." : "No application selected."}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading || !application) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.lg }}>
          <SkeletonHero height={130} />
          <SkeletonCard height={160} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const verified = application.borrower?.kycStatus === "verified";

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Application Detail</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Avatar + Name */}
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.initials}>
              {initials(application.borrower?.fullName)}
            </Text>
          </View>
          <Text style={styles.name}>
            {application.borrower?.fullName ?? "Borrower"}
          </Text>
          <Text style={styles.meta}>
            Credit score: {application.borrower?.creditScore ?? "—"}
          </Text>
          <View style={styles.badges}>
            <View style={[styles.kycBadge, !verified && styles.kycBadgeUnverified]}>
              <Ionicons
                name={verified ? "checkmark-circle" : "help-circle-outline"}
                size={14}
                color={verified ? Colors.teal : Colors.textMuted}
              />
              <Text style={[styles.kycText, !verified && styles.kycTextUnverified]}>
                {verified ? "Verified" : "Not Verified"}
              </Text>
            </View>
            <Badge
              label={
                application.loanType === "personal" ? "Personal" : "Business"
              }
              variant={application.loanType === "personal" ? "success" : "gold"}
            />
          </View>
        </View>

        {/* Loan Request Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Loan Request</Text>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Amount</Text>
            <Text style={styles.cardValue}>
              UGX {application.amount.toLocaleString()}
            </Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Duration</Text>
            <Text style={styles.cardValue}>{formatDuration(application.duration, application.durationDays)}</Text>
          </View>
          <View style={[styles.cardRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.cardLabel}>Purpose</Text>
            <Text
              style={[styles.cardValue, { flex: 1, textAlign: "right" }]}
              numberOfLines={2}
            >
              {application.purpose ?? "—"}
            </Text>
          </View>
        </View>

        {/* Guarantors */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Guarantors ({application.guarantors?.length ?? 0})
          </Text>
          {application.guarantors && application.guarantors.length > 0 ? (
            application.guarantors.map((g, i, arr) => (
              <View
                key={g.id}
                style={[
                  styles.cardRow,
                  i === arr.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <Text style={styles.cardLabel}>{g.fullName ?? g.username}</Text>
                <Text style={styles.cardValue}>{g.relationshipType ?? "—"}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.cardLabel}>No guarantors added</Text>
          )}
        </View>

        {/* Make Offer Button */}
        {application.status === "pending" ? (
          <Button
            title="Make an Offer →"
            onPress={() =>
              router.push({
                pathname: "/(lender)/make-offer",
                params: {
                  applicationId: application.id,
                  borrowerName: application.borrower?.fullName ?? "Borrower",
                },
              })
            }
            color={Colors.gold}
            style={{ marginTop: Spacing.md }}
          />
        ) : (
          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>
              Status: {applicationStatusLabel(application.status, application.loanStatus)}
            </Text>
          </View>
        )}

        <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
          <Text style={styles.backLinkText}>← Back to Browse</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerTitle: { ...Typography.h3, color: Colors.white },
  scroll: { padding: Spacing.lg, paddingBottom: 40 },
  profileSection: {
    alignItems: "center",
    marginBottom: Spacing.xxl,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.gold + "25",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  initials: { ...Typography.h2, color: Colors.gold },
  name: { ...Typography.h2, color: Colors.textPrimary },
  meta: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  badges: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  kycBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  kycBadgeUnverified: { opacity: 0.9 },
  kycText: { ...Typography.smallMedium, color: Colors.teal },
  kycTextUnverified: { color: Colors.textMuted },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cardLabel: { ...Typography.body, color: Colors.textSecondary },
  cardValue: { ...Typography.bodyMedium, color: Colors.textPrimary },
  statusPill: {
    marginTop: Spacing.md,
    alignItems: "center",
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
  },
  statusPillText: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    textTransform: "capitalize",
  },
  backLink: {
    alignItems: "center",
    marginTop: Spacing.xl,
  },
  backLinkText: { ...Typography.body, color: Colors.gold },
});
