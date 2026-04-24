import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Colors, Typography, Spacing, BorderRadius } from "../../src/theme";
import { Button, Input } from "../../src/components";
import { useAuthViewModel } from "../../src/viewmodels";
import {
  apiRefreshSignupDraft,
  clearSignupDraft,
  clearSignupFormDraft,
  getSignupFormDraft,
  getSignupDraftNextStep,
  saveSignupFormDraft,
  type SignupDraftState,
} from "../../src/services/auth";

export default function LenderRegisterScreen() {
  const router = useRouter();
  const vm = useAuthViewModel();
  const [existingDraft, setExistingDraft] = useState<SignupDraftState | null>(
    null,
  );

  const hasMeaningfulFormDraft = (
    formDraft: {
      fullName?: string;
      nin?: string;
      phone?: string;
      email?: string;
      password?: string;
    } | null,
  ) =>
    Boolean(
      formDraft?.fullName ||
      formDraft?.nin ||
      formDraft?.phone ||
      formDraft?.email ||
      formDraft?.password,
    );

  const getResumeRoute = (draft: SignupDraftState) =>
    getSignupDraftNextStep(draft) === "verify-phone"
      ? "/verify-phone?portal=lender"
      : getSignupDraftNextStep(draft) === "completed"
        ? "/sign-in"
        : "/verify-email?portal=lender";

  useEffect(() => {
    const loadDraft = async () => {
      const draft = await apiRefreshSignupDraft();
      if (draft?.role === "lender") {
        setExistingDraft(draft);
      } else {
        setExistingDraft(null);

        const formDraft = await getSignupFormDraft();
        if (formDraft?.role === "lender" && hasMeaningfulFormDraft(formDraft)) {
          vm.setFullName(formDraft.fullName || "");
          vm.setNin(formDraft.nin || "");
          vm.setPhone(formDraft.phone || "");
          vm.setEmail(formDraft.email || "");
          vm.setPassword(formDraft.password || "");
          vm.setAccountType(
            formDraft.accountType === "business" ? "business" : "individual",
          );
          vm.setAgreed(!!formDraft.agreed);
        }
      }
    };
    void loadDraft();
  }, []);

  useEffect(() => {
    if (existingDraft) return;

    const persist = async () => {
      const hasAnyValue =
        !!vm.fullName || !!vm.nin || !!vm.phone || !!vm.email || !!vm.password;

      if (!hasAnyValue) {
        await clearSignupFormDraft();
        return;
      }

      await saveSignupFormDraft({
        role: "lender",
        fullName: vm.fullName,
        nin: vm.nin,
        phone: vm.phone,
        email: vm.email,
        password: vm.password,
        accountType: vm.accountType,
        agreed: vm.agreed,
      });
    };

    void persist();
  }, [
    existingDraft,
    vm.fullName,
    vm.nin,
    vm.phone,
    vm.email,
    vm.password,
    vm.accountType,
    vm.agreed,
  ]);

  const handleRegister = async () => {
    const success = await vm.register("lender");
    if (success) {
      const latestDraft = await apiRefreshSignupDraft();
      if (latestDraft?.role === "lender") {
        router.replace(getResumeRoute(latestDraft));
        return;
      }
      router.replace("/verify-email?portal=lender");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Become a Lender</Text>
        <Text style={styles.headerSub}>
          Start earning by lending to verified borrowers
        </Text>
      </View>

      <ScrollView
        style={styles.form}
        contentContainerStyle={styles.formContent}
        showsVerticalScrollIndicator={false}
      >
        {existingDraft && (
          <View style={styles.resumeCard}>
            <Text style={styles.resumeTitle}>Resume signup draft</Text>
            <Text style={styles.resumeText}>
              Continue verification for {existingDraft.email}
            </Text>
            <View style={styles.resumeActions}>
              <TouchableOpacity
                onPress={async () => {
                  const latestDraft = await apiRefreshSignupDraft();
                  if (latestDraft?.role === "lender") {
                    router.replace(getResumeRoute(latestDraft));
                    return;
                  }
                  setExistingDraft(null);
                }}
              >
                <Text style={styles.resumeLink}>Continue</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  await clearSignupDraft();
                  await clearSignupFormDraft();
                  setExistingDraft(null);
                  vm.setFullName("");
                  vm.setNin("");
                  vm.setPhone("");
                  vm.setEmail("");
                  vm.setPassword("");
                  vm.setAccountType("individual");
                  vm.setAgreed(false);
                }}
              >
                <Text style={styles.resumeReset}>Start over</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Account Type Toggle */}
        <View style={styles.toggle}>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              vm.accountType === "individual" && styles.toggleActive,
            ]}
            onPress={() => vm.setAccountType("individual")}
          >
            <Text
              style={[
                styles.toggleText,
                vm.accountType === "individual" && styles.toggleTextActive,
              ]}
            >
              Individual
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              vm.accountType === "business" && styles.toggleActive,
            ]}
            onPress={() => vm.setAccountType("business")}
          >
            <Text
              style={[
                styles.toggleText,
                vm.accountType === "business" && styles.toggleTextActive,
              ]}
            >
              Business
            </Text>
          </TouchableOpacity>
        </View>

        <Input
          label="Full Name"
          value={vm.fullName}
          onChangeText={vm.setFullName}
          placeholder="Enter your full name"
          error={vm.errors.fullName}
        />
        <Input
          label="National ID Number (NIN)"
          value={vm.nin}
          onChangeText={vm.setNin}
          placeholder="CM940XXXXXXX"
          error={vm.errors.nin}
        />
        <Input
          label="Phone Number"
          value={vm.phone}
          onChangeText={vm.setPhone}
          placeholder="7XX XXX XXX"
          prefix="+256"
          keyboardType="phone-pad"
          error={vm.errors.phone}
        />
        <Input
          label="Email Address"
          value={vm.email}
          onChangeText={vm.setEmail}
          placeholder="you@email.com"
          keyboardType="email-address"
          error={vm.errors.email}
        />
        <Input
          label="Password"
          value={vm.password}
          onChangeText={vm.setPassword}
          placeholder="Create a strong password"
          secureTextEntry
          error={vm.errors.password}
        />

        {/* Terms */}
        <TouchableOpacity
          style={styles.termsRow}
          onPress={() => vm.setAgreed(!vm.agreed)}
        >
          <View style={[styles.checkbox, vm.agreed && styles.checkboxActive]}>
            {vm.agreed && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.termsText}>
            I agree to the{" "}
            <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </TouchableOpacity>

        <Button
          title="Continue to Verification →"
          onPress={handleRegister}
          color={Colors.gold}
          loading={vm.loading}
          disabled={!vm.canSubmit}
        />

        <TouchableOpacity
          onPress={() => router.push("/sign-in")}
          style={styles.signInRow}
        >
          <Text style={styles.signInText}>Already have an account? </Text>
          <Text style={[styles.signInText, styles.signInLink]}>Sign In</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.xxl,
    paddingTop: Spacing.lg,
  },
  headerTitle: { ...Typography.h1, color: Colors.white },
  headerSub: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  form: { flex: 1 },
  formContent: { padding: Spacing.xxl, paddingBottom: 40 },
  resumeCard: {
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  resumeTitle: { ...Typography.bodySemibold, color: Colors.textPrimary },
  resumeText: {
    ...Typography.small,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  resumeActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
    marginTop: Spacing.sm,
  },
  resumeLink: { ...Typography.smallMedium, color: Colors.gold },
  resumeReset: { ...Typography.smallMedium, color: Colors.textMuted },
  toggle: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: 3,
    marginBottom: Spacing.xxl,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: "center",
    borderRadius: BorderRadius.sm,
  },
  toggleActive: { backgroundColor: Colors.surfaceLift },
  toggleText: { ...Typography.bodyMedium, color: Colors.textSecondary },
  toggleTextActive: { color: Colors.gold },
  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.xxl,
    gap: Spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  checkboxActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  checkmark: { color: Colors.white, fontSize: 12, fontWeight: "700" },
  termsText: { ...Typography.small, color: Colors.textSecondary, flex: 1 },
  termsLink: { color: Colors.gold, fontWeight: "600" },
  signInRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: Spacing.xxl,
  },
  signInText: { ...Typography.body, color: Colors.textSecondary },
  signInLink: { color: Colors.gold, fontWeight: "600" },
});
