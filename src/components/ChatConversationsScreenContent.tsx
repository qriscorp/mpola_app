import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, BorderRadius, useScaledTypography } from "../theme";
import { useChatConversationsViewModel } from "../viewmodels";
import { SkeletonList } from "./Skeleton";

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function initials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Every loan the current user is a party to (either role) with a
 * message — the floating-chat-button equivalent's landing screen on
 * mobile (see (borrower)/messages.tsx, (lender)/messages.tsx). Tapping a
 * row opens ChatThreadScreenContent for that specific loan. */
export function ChatConversationsScreenContent({
  chatRoute,
  adminChatRoute,
  accentColor = Colors.teal,
}: {
  chatRoute: string;
  adminChatRoute: string;
  accentColor?: string;
}) {
  const router = useRouter();
  const typography = useScaledTypography();
  const styles = useMemo(() => makeStyles(typography), [typography]);
  const { conversations, isLoading } = useChatConversationsViewModel();

  const adminRow = (
    <TouchableOpacity
      style={styles.row}
      onPress={() => router.push(adminChatRoute as any)}
    >
      <View style={[styles.avatar, { backgroundColor: accentColor }]}>
        <Ionicons name="headset-outline" size={20} color={Colors.white} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>Mpola Support</Text>
        <Text style={styles.preview} numberOfLines={1}>Chat with our team</Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={{ padding: Spacing.lg }}>
        <SkeletonList count={4} cardHeight={64} />
      </View>
    );
  }

  if (conversations.length === 0) {
    return (
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {adminRow}
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            No loan conversations yet — once you have a loan with someone, you can message them here.
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      {adminRow}
      {conversations.map((c) => (
        <TouchableOpacity
          key={c.loanId}
          style={styles.row}
          onPress={() => router.push({ pathname: chatRoute as any, params: { loanId: c.loanId } })}
        >
          <View style={[styles.avatar, { backgroundColor: accentColor }]}>
            <Text style={styles.avatarText}>{initials(c.otherPartyName)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.rowTop}>
              <Text style={styles.name}>{c.otherPartyName ?? "—"}</Text>
              <Text style={styles.time}>{timeAgo(c.lastMessageAt)}</Text>
            </View>
            <Text style={styles.preview} numberOfLines={1}>
              {c.lastMessage ?? `Loan of UGX ${c.loanAmount.toLocaleString()}`}
            </Text>
          </View>
          {c.unreadCount > 0 && (
            <View style={[styles.unreadBadge, { backgroundColor: accentColor }]}>
              <Text style={styles.unreadText}>{c.unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

function makeStyles(typography: ReturnType<typeof useScaledTypography>) {
  return StyleSheet.create({
    scroll: { padding: Spacing.lg },
    emptyState: { flex: 1, alignItems: "center", justifyContent: "center", padding: Spacing.xl },
    emptyText: { ...typography.body, color: Colors.textMuted, textAlign: "center" },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      backgroundColor: Colors.surface,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      marginBottom: Spacing.sm,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: { ...typography.bodyMedium, color: Colors.white, fontWeight: "700" },
    rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    name: { ...typography.bodyMedium, color: Colors.textPrimary },
    time: { ...typography.caption, color: Colors.textMuted },
    preview: { ...typography.small, color: Colors.textSecondary, marginTop: 2 },
    unreadBadge: {
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      paddingHorizontal: 5,
      alignItems: "center",
      justifyContent: "center",
    },
    unreadText: { ...typography.caption, color: Colors.white, fontWeight: "700" },
  });
}
