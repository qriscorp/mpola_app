import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Typography, Spacing } from "../../src/theme";
import { borrowerUser } from "../../src/services";
import { Ionicons } from "@expo/vector-icons";

export default function ProfileScreen() {
  const user = borrowerUser;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Profile</Text>

      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.initials}>
            {user.fullName
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </Text>
        </View>
        <Text style={styles.name}>{user.fullName}</Text>
        <Text style={styles.email}>{user.email}</Text>
        {user.kycVerified && (
          <View style={styles.kycBadge}>
            <Ionicons name="checkmark-circle" size={14} color={Colors.teal} />
            <Text style={styles.kycText}>KYC Verified</Text>
          </View>
        )}
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Phone</Text>
          <Text style={styles.infoValue}>{user.phone}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>NIN</Text>
          <Text style={styles.infoValue}>{user.nin}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Account Type</Text>
          <Text style={styles.infoValue}>{user.accountType}</Text>
        </View>
        <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
          <Text style={styles.infoLabel}>Member Since</Text>
          <Text style={styles.infoValue}>June 2024</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.lg,
  },
  title: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginBottom: Spacing.xxl,
  },
  avatarSection: { alignItems: "center", marginBottom: Spacing.xxl },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.teal,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  initials: { ...Typography.h2, color: Colors.white },
  name: { ...Typography.h3, color: Colors.textPrimary },
  email: { ...Typography.body, color: Colors.textSecondary, marginTop: 2 },
  kycBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: Spacing.sm,
  },
  kycText: { ...Typography.smallMedium, color: Colors.teal },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: Spacing.lg,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  infoLabel: { ...Typography.body, color: Colors.textSecondary },
  infoValue: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    textTransform: "capitalize",
  },
});
