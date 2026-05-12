import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius } from "../../src/theme";
import { borrowerUser } from "../../src/services";

const KYC_ITEMS = [
  { label: "National ID", icon: "document-outline", status: "verified" },
  { label: "Phone Number", icon: "phone-portrait-outline", status: "verified" },
  { label: "Bank Statement", icon: "grid-outline", status: "pending" },
];

export default function ProfileScreen() {
  const user = borrowerUser;
  const initials = user.fullName
    .split(" ")
    .map((n: string) => n[0])
    .join("");
  const [offersNotif, setOffersNotif] = useState(true);
  const [repayNotif, setRepayNotif] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Text style={styles.logoLetter}>M</Text>
          </View>
          <Text style={styles.headerTitle}>Account</Text>
          <View style={styles.avatarSmall}>
            <Text style={styles.avatarSmallText}>{initials}</Text>
          </View>
        </View>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.initials}>{initials}</Text>
          </View>
          <Text style={styles.name}>{user.fullName}</Text>
          <Text style={styles.sub}>Borrower since Feb 2024</Text>
        </View>

        {/* KYC */}
        <Text style={styles.sectionLabel}>KYC STATUS</Text>
        <View style={styles.card}>
          {KYC_ITEMS.map((item, i) => (
            <View
              key={item.label}
              style={[
                styles.kycRow,
                i < KYC_ITEMS.length - 1 && styles.kycRowBorder,
              ]}
            >
              <Ionicons
                name={item.icon as any}
                size={20}
                color={Colors.textSecondary}
                style={{ marginRight: Spacing.sm }}
              />
              <Text style={styles.kycLabel}>{item.label}</Text>
              <View
                style={[
                  styles.kycBadge,
                  item.status === "verified"
                    ? styles.kycVerified
                    : styles.kycPending,
                ]}
              >
                <Text
                  style={[
                    styles.kycBadgeText,
                    item.status === "verified"
                      ? styles.kycVerifiedText
                      : styles.kycPendingText,
                  ]}
                >
                  {item.status === "verified" ? "Verified" : "Pending"}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Notifications */}
        <Text style={styles.sectionLabel}>NOTIFICATIONS</Text>
        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.toggleTitle}>New Lender Offers</Text>
              <Text style={styles.toggleSub}>When lenders respond</Text>
            </View>
            <Switch
              value={offersNotif}
              onValueChange={setOffersNotif}
              trackColor={{ true: Colors.teal }}
            />
          </View>
          <View
            style={[
              styles.toggleRow,
              { borderTopWidth: 1, borderTopColor: Colors.border },
            ]}
          >
            <View>
              <Text style={styles.toggleTitle}>Repayment Reminders</Text>
              <Text style={styles.toggleSub}>3 days before due date</Text>
            </View>
            <Switch
              value={repayNotif}
              onValueChange={setRepayNotif}
              trackColor={{ true: Colors.teal }}
            />
          </View>
        </View>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn}>
          <Ionicons name="log-out-outline" size={18} color={Colors.danger} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingBottom: 48 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
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
  headerTitle: { ...Typography.h3, color: Colors.white, flex: 1 },
  avatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.teal,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarSmallText: {
    ...Typography.bodyMedium,
    color: Colors.white,
    fontWeight: "700",
  },
  avatarSection: { alignItems: "center", marginBottom: Spacing.xxl },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.teal,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  initials: { ...Typography.h2, color: Colors.white },
  name: { ...Typography.h3, color: Colors.white },
  sub: { ...Typography.small, color: Colors.textMuted, marginTop: 4 },
  sectionLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  kycRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  kycRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  kycLabel: { ...Typography.body, color: Colors.textPrimary, flex: 1 },
  kycBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  kycVerified: { backgroundColor: Colors.successBg },
  kycPending: { backgroundColor: Colors.warningBg },
  kycBadgeText: { ...Typography.caption, fontWeight: "600" },
  kycVerifiedText: { color: Colors.success },
  kycPendingText: { color: Colors.warning },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  toggleTitle: { ...Typography.bodyMedium, color: Colors.textPrimary },
  toggleSub: { ...Typography.small, color: Colors.textMuted, marginTop: 2 },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    marginTop: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.danger + "50",
  },
  signOutText: { ...Typography.buttonSmall, color: Colors.danger },
});
