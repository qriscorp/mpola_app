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
import { useRouter } from "expo-router";
import { Colors, Typography, Spacing, BorderRadius } from "../../src/theme";
import { useProfileViewModel } from "../../src/viewmodels";
import { SkeletonHero, SkeletonCard, BiometricToggle, SessionsSection, KYCUploadSection } from "../../src/components";

function MenuRow({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={menuStyles.row} onPress={onPress}>
      <View style={menuStyles.left}>
        <Ionicons name={icon} size={20} color={Colors.textSecondary} />
        <Text style={menuStyles.label}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}

const menuStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: Spacing.md },
  left: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  label: { ...Typography.bodyMedium, color: Colors.textPrimary },
});

export default function LenderAccountScreen() {
  const router = useRouter();
  const { profile, isLoading, error, signOut } = useProfileViewModel();
  const [offersNotif, setOffersNotif] = useState(true);
  const [repayNotif, setRepayNotif] = useState(true);

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: Spacing.lg }}>
          <Text style={{ color: Colors.textMuted }}>
            Couldn&apos;t load your account. Please try again.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading || !profile) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.lg }}>
          <SkeletonHero height={120} />
          <SkeletonCard height={140} />
          <SkeletonCard height={100} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const initials = profile.fullName
    .split(" ")
    .map((n: string) => n[0])
    .join("");

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
          <Text style={styles.name}>{profile.fullName}</Text>
          <Text style={styles.sub}>{profile.email}</Text>
        </View>

        {/* KYC */}
        <Text style={styles.sectionLabel}>KYC VERIFICATION</Text>
        <View style={styles.card}>
          <KYCUploadSection accentColor={Colors.gold} />
        </View>

        {/* Notifications */}
        <Text style={styles.sectionLabel}>NOTIFICATIONS</Text>
        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.toggleTitle}>New Applications</Text>
              <Text style={styles.toggleSub}>When borrowers apply</Text>
            </View>
            <Switch
              value={offersNotif}
              onValueChange={setOffersNotif}
              trackColor={{ true: Colors.gold }}
            />
          </View>
          <View
            style={[
              styles.toggleRow,
              { borderTopWidth: 1, borderTopColor: Colors.border },
            ]}
          >
            <View>
              <Text style={styles.toggleTitle}>Repayment Received</Text>
              <Text style={styles.toggleSub}>When borrower pays</Text>
            </View>
            <Switch
              value={repayNotif}
              onValueChange={setRepayNotif}
              trackColor={{ true: Colors.gold }}
            />
          </View>
        </View>

        {/* Support & Settings */}
        <Text style={styles.sectionLabel}>SUPPORT & SETTINGS</Text>
        <View style={[styles.card, { paddingVertical: 0 }]}>
          <MenuRow icon="settings-outline" label="Settings" onPress={() => router.push("/(lender)/settings")} />
          <View style={{ borderTopWidth: 1, borderTopColor: Colors.border }}>
            <MenuRow icon="gift-outline" label="Invite Friends" onPress={() => router.push("/(lender)/referrals")} />
          </View>
          <View style={{ borderTopWidth: 1, borderTopColor: Colors.border }}>
            <MenuRow icon="help-circle-outline" label="Help & Support" onPress={() => router.push("/(lender)/help")} />
          </View>
          <View style={{ borderTopWidth: 1, borderTopColor: Colors.border }}>
            <MenuRow icon="alert-circle-outline" label="Disputes" onPress={() => router.push("/(lender)/disputes")} />
          </View>
        </View>

        {/* Security */}
        <Text style={styles.sectionLabel}>SECURITY</Text>
        <View style={styles.card}>
          <BiometricToggle accentColor={Colors.gold} />
          <View style={{ height: Spacing.md }} />
          <SessionsSection accentColor={Colors.gold} />
        </View>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={signOut}>
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
    backgroundColor: Colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  logoLetter: { fontSize: 16, fontWeight: "700", color: Colors.white },
  headerTitle: { ...Typography.h3, color: Colors.white, flex: 1 },
  avatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.gold,
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
    backgroundColor: Colors.gold,
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
    backgroundColor: Colors.successBg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  kycBadgeText: {
    ...Typography.caption,
    color: Colors.success,
    fontWeight: "600",
  },
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
