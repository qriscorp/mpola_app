import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
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

const MPOLA_WEB_URL = "https://mpola.co";

const licenceStatusMeta: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: "Active", color: Colors.success, bg: Colors.successBg },
  not_issued: { label: "Not Yet Issued", color: Colors.warning, bg: Colors.warningBg },
  expired: { label: "Expired", color: Colors.danger, bg: Colors.dangerBg },
};

function LicenceCard({
  licenceNumber,
  licenceStatus,
  licenceValidUntil,
  canSign,
  onSign,
  signing,
}: {
  licenceNumber: string | null;
  licenceStatus: "not_issued" | "active" | "expired" | null;
  licenceValidUntil: string | null;
  canSign: boolean;
  onSign: () => void;
  signing: boolean;
}) {
  const [agreed, setAgreed] = useState(false);
  const status = licenceStatus ?? "not_issued";
  const meta = licenceStatusMeta[status];
  const showSignAction = canSign && (status === "not_issued" || status === "expired");
  const typography = useScaledTypography();
  const licenceStyles = useMemo(() => makeLicenceStyles(typography), [typography]);

  return (
    <View style={licenceStyles.card}>
      <View style={licenceStyles.header}>
        <View style={licenceStyles.iconBox}>
          <Ionicons name="shield-checkmark" size={20} color={Colors.white} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={licenceStyles.title}>Mpola Lender Licence</Text>
          <Text style={licenceStyles.subtitle}>
            {status === "active"
              ? "Issued under Mpola's licensing framework"
              : status === "expired"
                ? "Expired — sign the agreement again to renew"
                : canSign
                  ? "Sign the agreement below to issue your licence"
                  : "Issued once your KYC is verified"}
          </Text>
        </View>
      </View>

      <View style={licenceStyles.grid}>
        <View style={licenceStyles.cell}>
          <Text style={licenceStyles.cellLabel}>Licence No.</Text>
          <Text style={licenceStyles.cellValue}>
            {licenceNumber ??
              // No real number exists yet to show or hide — the backend no
              // longer sends one pre-issuance (see repository/user_repo.py's
              // _lender_licence_info). A masked placeholder rather than "—"
              // makes clear there WILL be one, just not readable yet.
              (status === "not_issued" ? "LND-••••-••••" : "—")}
          </Text>
        </View>
        <View style={licenceStyles.cell}>
          <Text style={licenceStyles.cellLabel}>Valid Until</Text>
          <Text style={[licenceStyles.cellValue, { color: Colors.gold }]}>
            {licenceValidUntil ? new Date(licenceValidUntil).toLocaleDateString() : "Not yet issued"}
          </Text>
        </View>
        <View style={licenceStyles.cell}>
          <Text style={licenceStyles.cellLabel}>Max Pool</Text>
          <Text style={licenceStyles.cellValue}>—</Text>
        </View>
        <View style={licenceStyles.cell}>
          <Text style={licenceStyles.cellLabel}>Status</Text>
          <View style={[licenceStyles.badge, { backgroundColor: meta.bg }]}>
            <Text style={[licenceStyles.badgeText, { color: meta.color }]}>{meta.label}</Text>
          </View>
        </View>
      </View>

      {showSignAction && (
        <View style={licenceStyles.signBlock}>
          <TouchableOpacity
            style={licenceStyles.agreeRow}
            onPress={() => setAgreed(!agreed)}
          >
            <View style={[licenceStyles.checkbox, agreed && licenceStyles.checkboxActive]}>
              {agreed && <Text style={licenceStyles.checkmark}>✓</Text>}
            </View>
            <Text style={licenceStyles.agreeText} onPress={() => setAgreed(!agreed)}>
              I agree to the{" "}
              <Text
                style={licenceStyles.agreeLink}
                onPress={() => WebBrowser.openBrowserAsync(`${MPOLA_WEB_URL}/platform-terms`)}
              >
                Terms of Service
              </Text>
              ,{" "}
              <Text
                style={licenceStyles.agreeLink}
                onPress={() => WebBrowser.openBrowserAsync(`${MPOLA_WEB_URL}/privacy-policy`)}
              >
                Privacy Policy
              </Text>
              , and{" "}
              <Text
                style={licenceStyles.agreeLink}
                onPress={() => WebBrowser.openBrowserAsync(`${MPOLA_WEB_URL}/lender-code-of-conduct`)}
              >
                Lender Code of Conduct
              </Text>
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[licenceStyles.signBtn, (!agreed || signing) && { opacity: 0.4 }]}
            disabled={!agreed || signing}
            onPress={() => {
              onSign();
              setAgreed(false);
            }}
          >
            <Text style={licenceStyles.signBtnText}>
              {signing ? "Signing…" : status === "expired" ? "Sign & Renew Licence" : "Sign Agreement"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function makeLicenceStyles(typography: ReturnType<typeof useScaledTypography>) {
  return StyleSheet.create({
    card: {
      backgroundColor: Colors.navy,
      borderRadius: BorderRadius.lg,
      borderWidth: 2,
      borderColor: Colors.gold,
      padding: Spacing.lg,
      marginBottom: Spacing.sm,
    },
    header: { flexDirection: "row", gap: Spacing.md, marginBottom: Spacing.lg },
    iconBox: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: Colors.gold,
      alignItems: "center",
      justifyContent: "center",
    },
    title: { ...typography.bodyMedium, color: Colors.white, fontWeight: "700" },
    subtitle: { ...typography.caption, color: Colors.white + "80", marginTop: 2 },
    grid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.lg },
    cell: { width: "42%" },
    cellLabel: { ...typography.caption, color: Colors.white + "80", textTransform: "uppercase", letterSpacing: 0.5 },
    cellValue: { ...typography.bodyMedium, color: Colors.white, fontWeight: "700", marginTop: 2 },
    badge: { alignSelf: "flex-start", paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadius.full, marginTop: 2 },
    badgeText: { ...typography.caption, fontWeight: "600" },
    signBlock: {
      marginTop: Spacing.lg,
      paddingTop: Spacing.lg,
      borderTopWidth: 1,
      borderTopColor: Colors.white + "20",
      gap: Spacing.md,
    },
    agreeRow: { flexDirection: "row", gap: Spacing.sm },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 5,
      borderWidth: 1.5,
      borderColor: Colors.white + "60",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 1,
    },
    checkboxActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
    checkmark: { color: Colors.navy, fontSize: 12, fontWeight: "700" },
    agreeText: { ...typography.small, color: Colors.white + "cc", flex: 1 },
    agreeLink: { color: Colors.gold, fontWeight: "600" },
    signBtn: {
      backgroundColor: Colors.gold,
      borderRadius: BorderRadius.md,
      paddingVertical: Spacing.sm,
      alignItems: "center",
    },
    signBtnText: { ...typography.buttonSmall, color: Colors.navy },
  });
}

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

export default function LenderAccountScreen() {
  const router = useRouter();
  const { profile, isLoading, error, signOut, signAgreement, isSigningAgreement, updateProfile } = useProfileViewModel();
  const typography = useScaledTypography();
  const styles = useMemo(() => makeStyles(typography), [typography]);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleConfirmSignOut = async () => {
    setSigningOut(true);
    await signOut();
  };

  if (signingOut) {
    return <LoadingScreen color={Colors.gold} />;
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: Spacing.lg }}>
          <Text style={{ color: Colors.textMuted }}>
            Couldn't load your account. Please try again.
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
        {/* Header — Account is reached by pushing from Home's avatar, not
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

        {/* Licence */}
        <LicenceCard
          licenceNumber={profile.licenceNumber}
          licenceStatus={profile.licenceStatus}
          licenceValidUntil={profile.licenceValidUntil}
          canSign={profile.kycVerified}
          signing={isSigningAgreement}
          onSign={() =>
            signAgreement(undefined, {
              onError: (e: any) =>
                Alert.alert("Failed to sign", e?.message || "Please try again."),
            })
          }
        />

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
              value={profile.notifNewApplication ?? true}
              onValueChange={(v) => updateProfile({ notifNewApplication: v })}
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
              value={profile.notifRepaymentReceived ?? true}
              onValueChange={(v) => updateProfile({ notifRepaymentReceived: v })}
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
              <Text style={styles.toggleTitle}>Overdue Loan Alerts</Text>
              <Text style={styles.toggleSub}>When a repayment is missed</Text>
            </View>
            <Switch
              value={profile.notifLoanOverdue ?? true}
              onValueChange={(v) => updateProfile({ notifLoanOverdue: v })}
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
              <Text style={styles.toggleTitle}>Weekly Portfolio Digest</Text>
              <Text style={styles.toggleSub}>In-app summary of your active book</Text>
            </View>
            <Switch
              value={profile.notifPortfolioDigest ?? false}
              onValueChange={(v) => updateProfile({ notifPortfolioDigest: v })}
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
        </View>

        {/* Security */}
        <Text style={styles.sectionLabel}>SECURITY</Text>
        <View style={styles.card}>
          <BiometricToggle accentColor={Colors.gold} />
          <View style={{ height: Spacing.md }} />
          <SessionsSection accentColor={Colors.gold} />
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
      backgroundColor: Colors.gold,
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
      backgroundColor: Colors.gold,
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
      backgroundColor: Colors.successBg,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 3,
      borderRadius: BorderRadius.full,
    },
    kycBadgeText: {
      ...typography.caption,
      color: Colors.success,
      fontWeight: "600",
    },
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
