import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Colors, Typography, Spacing, BorderRadius } from "../theme";
import { Card } from "./Card";
import { SkeletonCard } from "./Skeleton";
import { fetchReferralInfo } from "../services";

export function ReferralScreenContent({ accentColor = Colors.teal }: { accentColor?: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["referrals", "me"],
    queryFn: fetchReferralInfo,
  });

  const handleCopy = async () => {
    if (!data?.referral_link) return;
    await Clipboard.setStringAsync(data.referral_link);
  };

  if (isLoading) {
    return (
      <View style={{ gap: Spacing.lg }}>
        <SkeletonCard height={160} />
        <SkeletonCard height={120} />
      </View>
    );
  }

  return (
    <View style={{ gap: Spacing.lg }}>
      <Card style={styles.heroCard}>
        <View style={[styles.iconCircle, { backgroundColor: accentColor + "25" }]}>
          <Ionicons name="gift-outline" size={28} color={accentColor} />
        </View>
        <Text style={styles.title}>
          Invite friends, earn UGX {(data?.bonus_per_referral ?? 20).toLocaleString()}
        </Text>
        <Text style={styles.sub}>
          Share your link — the moment someone signs up with it, UGX{" "}
          {(data?.bonus_per_referral ?? 20).toLocaleString()} lands straight in your wallet.
          No limit on how many friends you invite.
        </Text>

        <View style={styles.linkBox}>
          <Text style={styles.linkText} numberOfLines={1}>
            {data?.referral_link}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.copyBtn, { backgroundColor: accentColor }]}
          onPress={handleCopy}
        >
          <Ionicons name="copy-outline" size={16} color={Colors.white} />
          <Text style={styles.copyBtnText}>Copy Link</Text>
        </TouchableOpacity>

        <Text style={styles.code}>
          Your code: <Text style={{ fontWeight: "700" }}>{data?.referral_code}</Text>
        </Text>

        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: accentColor + "18" }]}>
            <Text style={styles.statValue}>{data?.total_referred ?? 0}</Text>
            <Text style={styles.statLabel}>Friends joined</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: accentColor + "18" }]}>
            <Text style={styles.statValue}>UGX {(data?.total_earned ?? 0).toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total earned</Text>
          </View>
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>
          People you&apos;ve referred ({data?.total_referred ?? 0})
        </Text>
        {!data?.referred_users?.length ? (
          <Text style={styles.emptyText}>No referrals yet.</Text>
        ) : (
          data.referred_users.map((u, i) => (
            <View key={i} style={styles.referredRow}>
              <Text style={styles.referredName}>{u.full_name ?? "Mpola user"}</Text>
              <Text style={styles.referredMeta}>
                {u.role} · {new Date(u.created_at).toLocaleDateString()}
              </Text>
            </View>
          ))
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: { alignItems: "center" },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  title: { ...Typography.h4, color: Colors.textPrimary, textAlign: "center" },
  sub: {
    ...Typography.small,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  linkBox: {
    width: "100%",
    backgroundColor: Colors.surfaceLift,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  linkText: { ...Typography.small, color: Colors.textPrimary },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  copyBtnText: { ...Typography.buttonSmall, color: Colors.white },
  code: { ...Typography.small, color: Colors.textMuted, marginTop: Spacing.md },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    width: "100%",
  },
  statBox: {
    flex: 1,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    alignItems: "center",
  },
  statValue: { ...Typography.h4, color: Colors.textPrimary },
  statLabel: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
  sectionTitle: { ...Typography.h4, color: Colors.textPrimary, marginBottom: Spacing.md },
  emptyText: { ...Typography.body, color: Colors.textMuted, textAlign: "center", paddingVertical: Spacing.lg },
  referredRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  referredName: { ...Typography.bodyMedium, color: Colors.textPrimary },
  referredMeta: { ...Typography.caption, color: Colors.textMuted },
});
