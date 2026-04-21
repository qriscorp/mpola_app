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
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadow,
} from "../../src/theme";
import { Button, Badge } from "../../src/components";
import { borrowerProfiles } from "../../src/services";

export default function BorrowerProfileScreen() {
  const router = useRouter();
  const { borrowerId } = useLocalSearchParams<{ borrowerId: string }>();

  const borrower =
    borrowerProfiles.find((b) => b.id === borrowerId) ?? borrowerProfiles[0];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Borrower Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Avatar + Name */}
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.initials}>{borrower.initials}</Text>
          </View>
          <Text style={styles.name}>{borrower.name}</Text>
          <Text style={styles.meta}>
            {borrower.location} • Member since {borrower.memberSince}
          </Text>
          <View style={styles.badges}>
            {borrower.kycVerified && (
              <View style={styles.kycBadge}>
                <Ionicons
                  name="checkmark-circle"
                  size={14}
                  color={Colors.teal}
                />
                <Text style={styles.kycText}>KYC Verified</Text>
              </View>
            )}
            <Badge
              label={borrower.loanType === "personal" ? "Personal" : "Business"}
              variant={borrower.loanType === "personal" ? "success" : "gold"}
            />
          </View>
        </View>

        {/* Loan Request Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Loan Request</Text>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Amount</Text>
            <Text style={styles.cardValue}>
              UGX {borrower.amount.toLocaleString()}
            </Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Duration</Text>
            <Text style={styles.cardValue}>{borrower.duration} months</Text>
          </View>
          <View style={[styles.cardRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.cardLabel}>Purpose</Text>
            <Text
              style={[styles.cardValue, { flex: 1, textAlign: "right" }]}
              numberOfLines={2}
            >
              {borrower.purpose}
            </Text>
          </View>
        </View>

        {/* Credit Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Credit Information</Text>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Occupation</Text>
            <Text style={styles.cardValue}>{borrower.occupation}</Text>
          </View>
          {borrower.businessAge && (
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Business Age</Text>
              <Text style={styles.cardValue}>{borrower.businessAge}</Text>
            </View>
          )}
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Previous Loans</Text>
            <Text style={styles.cardValue}>{borrower.previousLoans}</Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Documents</Text>
            <Text style={styles.cardValue}>
              {borrower.documentsCount} uploaded
            </Text>
          </View>
          <View style={[styles.cardRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.cardLabel}>Guarantors</Text>
            <Text style={styles.cardValue}>
              {borrower.guarantorsCount} confirmed
            </Text>
          </View>
        </View>

        {/* Make Offer Button */}
        <Button
          title="Make an Offer →"
          onPress={() =>
            router.push({
              pathname: "/(lender)/make-offer",
              params: { borrowerId: borrower.id, borrowerName: borrower.name },
            })
          }
          color={Colors.gold}
          style={{ marginTop: Spacing.md }}
        />

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
    backgroundColor: Colors.white,
  },
  headerTitle: { ...Typography.h3, color: Colors.textPrimary },
  scroll: { padding: Spacing.lg, paddingBottom: 40 },
  profileSection: {
    alignItems: "center",
    marginBottom: Spacing.xxl,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.goldLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  initials: { ...Typography.h2, color: Colors.goldDark },
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
  kycText: { ...Typography.smallMedium, color: Colors.teal },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadow.sm,
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
    borderBottomColor: Colors.borderLight,
  },
  cardLabel: { ...Typography.body, color: Colors.textSecondary },
  cardValue: { ...Typography.bodyMedium, color: Colors.textPrimary },
  backLink: {
    alignItems: "center",
    marginTop: Spacing.xl,
  },
  backLinkText: { ...Typography.body, color: Colors.gold },
});
