import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Colors, Spacing, BorderRadius, useScaledTypography } from "../theme";
import { fetchLoginSessions, signOutEverywhere } from "../services";
import { SkeletonList } from "./Skeleton";
import { ConfirmModal } from "./ConfirmModal";

function summarize(ua: string | null): string {
  if (!ua) return "Unknown device";
  if (/mpola/i.test(ua)) return "Mpola app";
  if (/mobile/i.test(ua)) return "Mobile browser";
  return "Browser";
}

export function SessionsSection({ accentColor = Colors.teal }: { accentColor?: string }) {
  const typography = useScaledTypography();
  const styles = useMemo(() => makeStyles(typography), [typography]);
  const qc = useQueryClient();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const { data: sessions, isLoading } = useQuery({
    queryKey: ["sessions"],
    queryFn: fetchLoginSessions,
  });

  const signOutAll = useMutation({
    mutationFn: signOutEverywhere,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
      setConfirmVisible(false);
      Alert.alert("Done", res.message);
    },
    onError: () => setConfirmVisible(false),
  });

  return (
    <View>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Active Sessions</Text>
        <TouchableOpacity onPress={() => setConfirmVisible(true)}>
          <Text style={styles.signOutLink}>Sign out everywhere</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <SkeletonList count={2} cardHeight={56} />
      ) : !sessions?.length ? (
        <Text style={styles.emptyText}>No recent login activity.</Text>
      ) : (
        sessions.map((s) => (
          <View key={s.id} style={styles.row}>
            <View style={styles.iconCircle}>
              <Ionicons name="phone-portrait-outline" size={16} color={Colors.textSecondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.deviceText}>
                {summarize(s.user_agent)}
                {s.is_most_recent && <Text style={{ color: accentColor }}> · Current</Text>}
              </Text>
              <Text style={styles.metaText}>
                {s.ip_address ?? "Unknown IP"} · {new Date(s.created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>
        ))
      )}

      <ConfirmModal
        visible={confirmVisible}
        icon="log-out-outline"
        title="Sign out everywhere?"
        message="You'll need to sign in again on every device."
        confirmLabel="Sign Out"
        destructive
        loading={signOutAll.isPending}
        onCancel={() => setConfirmVisible(false)}
        onConfirm={() => signOutAll.mutate()}
      />
    </View>
  );
}

function makeStyles(typography: ReturnType<typeof useScaledTypography>) {
  return StyleSheet.create({
    headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.sm },
    title: { ...typography.bodyMedium, color: Colors.textPrimary },
    signOutLink: { ...typography.small, color: Colors.danger, fontWeight: "600" },
    emptyText: { ...typography.small, color: Colors.textMuted, paddingVertical: Spacing.md },
    row: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, paddingVertical: Spacing.sm },
    iconCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: Colors.surfaceLift,
      alignItems: "center",
      justifyContent: "center",
    },
    deviceText: { ...typography.small, color: Colors.textPrimary },
    metaText: { ...typography.caption, color: Colors.textMuted },
  });
}
