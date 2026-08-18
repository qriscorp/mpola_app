import React, { useMemo, useState } from "react";
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
import { Colors, Spacing, BorderRadius, useScaledTypography } from "../../src/theme";
import { useProfileViewModel } from "../../src/viewmodels";
import {
  SkeletonHero,
  SkeletonCard,
  BiometricToggle,
  SessionsSection,
  KYCUploadSection,
  ConfirmModal,
  LoadingScreen,
} from "../../src/components";

function MenuRow({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  const typography = useScaledTypography();
  const menuStyles = useMemo(() => makeMenuStyles(typography), [typography]);
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

function makeMenuStyles(typography: ReturnType<typeof useScaledTypography>) {
  return StyleSheet.create({
    row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: Spacing.md },
    left: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
    label: { ...typography.bodyMedium, color: Colors.textPrimary },
  });
}

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, isLoading, error, signOut, updateProfile } = useProfileViewModel();
  const typography = useScaledTypography();
  const styles = useMemo(() => makeStyles(typography), [typography]);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleConfirmSignOut = async () => {
    setSigningOut(true);
    await signOut();
  };

  if (signingOut) {
    return <LoadingScreen color={Colors.teal} />;
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: Spacing.lg }}>
          <Text style={{ color: Colors.textMuted }}>
            Couldn't load your profile. Please try again.
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
        {/* Header — Profile is reached by pushing from Home's avatar, not
            a tab root, so it needs a real way back rather than the logo
            mark tab roots show. */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
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
          <KYCUploadSection accentColor={Colors.teal} />
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
              value={profile.notifOfferReceived ?? true}
              onValueChange={(v) => updateProfile({ notifOfferReceived: v })}
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
              <Text style={styles.toggleTitle}>Payment Reminders</Text>
              <Text style={styles.toggleSub}>A few days before due date</Text>
            </View>
            <Switch
              value={profile.notifPaymentReminder ?? true}
              onValueChange={(v) => updateProfile({ notifPaymentReminder: v })}
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
              <Text style={styles.toggleTitle}>Application Status</Text>
              <Text style={styles.toggleSub}>When your loan request expires or changes</Text>
            </View>
            <Switch
              value={profile.notifApplicationStatus ?? true}
              onValueChange={(v) => updateProfile({ notifApplicationStatus: v })}
              trackColor={{ true: Colors.teal }}
            />
          </View>
        </View>

        {/* Support & Settings */}
        <Text style={styles.sectionLabel}>SUPPORT & SETTINGS</Text>
        <View style={[styles.card, { paddingVertical: 0 }]}>
          <MenuRow icon="settings-outline" label="Settings" onPress={() => router.push("/(borrower)/settings")} />
          <View style={{ borderTopWidth: 1, borderTopColor: Colors.border }}>
            <MenuRow icon="gift-outline" label="Invite Friends" onPress={() => router.push("/(borrower)/referrals")} />
          </View>
          <View style={{ borderTopWidth: 1, borderTopColor: Colors.border }}>
            <MenuRow icon="help-circle-outline" label="Help & Support" onPress={() => router.push("/(borrower)/help")} />
          </View>
        </View>

        {/* Security */}
        <Text style={styles.sectionLabel}>SECURITY</Text>
        <View style={styles.card}>
          <BiometricToggle accentColor={Colors.teal} />
          <View style={{ height: Spacing.md }} />
          <SessionsSection accentColor={Colors.teal} />
        </View>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={() => setShowSignOutConfirm(true)}>
          <Ionicons name="log-out-outline" size={18} color={Colors.danger} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      <ConfirmModal
        visible={showSignOutConfirm}
        icon="log-out-outline"
        title="Sign out?"
        message="You'll need to sign in again to use Mpola."
        confirmLabel="Sign Out"
        destructive
        onCancel={() => setShowSignOutConfirm(false)}
        onConfirm={handleConfirmSignOut}
      />
    </SafeAreaView>
  );
}

function makeStyles(typography: ReturnType<typeof useScaledTypography>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scroll: { padding: Spacing.lg, paddingBottom: 136 },
    header: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: Spacing.xl,
      gap: Spacing.sm,
    },
    headerTitle: { ...typography.h3, color: Colors.white, flex: 1 },
    avatarSmall: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: Colors.teal,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarSmallText: {
      ...typography.bodyMedium,
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
    initials: { ...typography.h2, color: Colors.white },
    name: { ...typography.h3, color: Colors.white },
    sub: { ...typography.small, color: Colors.textMuted, marginTop: 4 },
    sectionLabel: {
      ...typography.caption,
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
    kycLabel: { ...typography.body, color: Colors.textPrimary, flex: 1 },
    kycBadge: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: 3,
      borderRadius: BorderRadius.full,
    },
    kycVerified: { backgroundColor: Colors.successBg },
    kycPending: { backgroundColor: Colors.warningBg },
    kycBadgeText: { ...typography.caption, fontWeight: "600" },
    kycVerifiedText: { color: Colors.success },
    kycPendingText: { color: Colors.warning },
    toggleRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: Spacing.sm,
    },
    toggleTitle: { ...typography.bodyMedium, color: Colors.textPrimary },
    toggleSub: { ...typography.small, color: Colors.textMuted, marginTop: 2 },
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
    signOutText: { ...typography.buttonSmall, color: Colors.danger },
  });
}
