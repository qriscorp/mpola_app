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
import { Colors, Typography, Spacing, BorderRadius } from "../../src/theme";
import { Button, Input } from "../../src/components";
import { useAuthViewModel } from "../../src/viewmodels";

export default function BorrowerRegisterScreen() {
  const router = useRouter();
  const vm = useAuthViewModel();

  const handleRegister = async () => {
    const success = await vm.register("borrower");
    if (success) router.replace("/(borrower)/home");
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Get a Loan</Text>
        <Text style={styles.headerSub}>Create your borrower account</Text>
      </View>

      <ScrollView
        style={styles.form}
        contentContainerStyle={styles.formContent}
        showsVerticalScrollIndicator={false}
      >
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
          title="Create Account →"
          onPress={handleRegister}
          color={Colors.teal}
          loading={vm.loading}
          disabled={!vm.canSubmit}
        />

        <TouchableOpacity
          onPress={() => router.push("/(borrower)/home")}
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
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
  },
  headerTitle: { ...Typography.h1, color: Colors.white },
  headerSub: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  form: { flex: 1 },
  formContent: { paddingHorizontal: Spacing.xl, paddingBottom: 40 },
  toggle: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    padding: 4,
    marginBottom: Spacing.xxl,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: "center",
    borderRadius: BorderRadius.full,
  },
  toggleActive: { backgroundColor: Colors.teal },
  toggleText: { ...Typography.bodyMedium, color: Colors.textSecondary },
  toggleTextActive: { color: Colors.white },
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
  checkboxActive: { backgroundColor: Colors.teal, borderColor: Colors.teal },
  checkmark: { color: Colors.white, fontSize: 12, fontWeight: "700" },
  termsText: { ...Typography.small, color: Colors.textSecondary, flex: 1 },
  termsLink: { color: Colors.teal, fontWeight: "600" },
  signInRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: Spacing.xxl,
  },
  signInText: { ...Typography.body, color: Colors.textSecondary },
  signInLink: { color: Colors.teal, fontWeight: "600" },
});
