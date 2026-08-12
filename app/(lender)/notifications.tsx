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
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius } from "../../src/theme";
import { useNotificationsViewModel } from "../../src/viewmodels";
import { SkeletonList } from "../../src/components";
import { notificationHref } from "../../src/services/notifications";

const iconMap: Record<string, { name: string; color: string; bg: string }> = {
  loan_offer: {
    name: "gift-outline",
    color: Colors.gold,
    bg: Colors.gold + "25",
  },
  offer_accepted: {
    name: "checkmark-circle",
    color: Colors.gold,
    bg: Colors.gold + "25",
  },
  offer_declined: {
    name: "close-circle-outline",
    color: Colors.textSecondary,
    bg: Colors.surface,
  },
  lender_offer_template: {
    name: "gift-outline",
    color: Colors.gold,
    bg: Colors.gold + "25",
  },
  auto_match_cooldown_lifted: {
    name: "time-outline",
    color: Colors.warning,
    bg: Colors.warningBg,
  },
  offer_expired: {
    name: "hourglass-outline",
    color: Colors.textSecondary,
    bg: Colors.surface,
  },
  guarantor_response: {
    name: "people-outline",
    color: Colors.teal,
    bg: Colors.teal + "25",
  },
  guarantor_invite_received: {
    name: "people-outline",
    color: Colors.teal,
    bg: Colors.teal + "25",
  },
  guarantor_still_pending: {
    name: "time-outline",
    color: Colors.warning,
    bg: Colors.warningBg,
  },
  application_expired: {
    name: "hourglass-outline",
    color: Colors.textSecondary,
    bg: Colors.surface,
  },
  guarantor_request_expired: {
    name: "hourglass-outline",
    color: Colors.textSecondary,
    bg: Colors.surface,
  },
  repayment: {
    name: "cash-outline",
    color: Colors.teal,
    bg: Colors.teal + "25",
  },
  payment: {
    name: "wallet-outline",
    color: Colors.teal,
    bg: Colors.teal + "25",
  },
  overdue: { name: "alert-circle", color: Colors.danger, bg: Colors.dangerBg },
  general: {
    name: "information-circle",
    color: Colors.textSecondary,
    bg: Colors.surface,
  },
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { notifications, unreadCount, isLoading, markRead, markAllRead } =
    useNotificationsViewModel();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.markAllText}>Mark all</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      {isLoading ? (
        <View style={styles.scroll}>
          <SkeletonList count={4} cardHeight={76} />
        </View>
      ) : (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {notifications.map((n) => {
          const icon = (n.type && iconMap[n.type]) || iconMap.general;
          const href = notificationHref(n.type, true);
          return (
            <TouchableOpacity
              key={n.id}
              onPress={() => {
                if (!n.read) markRead(n.id);
                if (href) router.push(href as any);
              }}
              style={[styles.notifCard, !n.read && styles.notifCardUnread]}
            >
              <View style={[styles.notifIcon, { backgroundColor: icon.bg }]}>
                <Ionicons
                  name={icon.name as any}
                  size={20}
                  color={icon.color}
                />
              </View>
              <View style={styles.notifContent}>
                <View style={styles.notifTitleRow}>
                  <Text style={styles.notifTitle}>{n.title}</Text>
                  {!n.read && <View style={styles.dot} />}
                </View>
                <Text style={styles.notifMessage} numberOfLines={2}>
                  {n.message}
                </Text>
                <Text style={styles.notifTime}>
                  {new Date(n.timestamp).toLocaleDateString()}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {notifications.length === 0 && (
          <View style={styles.empty}>
            <Ionicons
              name="notifications-off-outline"
              size={48}
              color={Colors.textMuted}
            />
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        )}
      </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerCenter: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  headerTitle: { ...Typography.h3, color: Colors.white },
  unreadBadge: {
    backgroundColor: Colors.danger,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadText: { ...Typography.caption, color: Colors.white, fontWeight: "700" },
  markAllText: { ...Typography.smallMedium, color: Colors.gold },
  scroll: { padding: Spacing.lg, paddingBottom: 40 },
  notifCard: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  notifCardUnread: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.gold,
  },
  notifIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  notifContent: { flex: 1 },
  notifTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  notifTitle: { ...Typography.bodyMedium, color: Colors.textPrimary },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.gold,
  },
  notifMessage: {
    ...Typography.small,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  notifTime: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: Spacing.section,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textMuted,
    marginTop: Spacing.md,
  },
});
