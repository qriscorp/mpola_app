import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, BorderRadius, useScaledTypography } from "../theme";
import { useLoanChatViewModel, useProfileViewModel } from "../viewmodels";
import { SkeletonList } from "./Skeleton";

/** One loan's message thread between its borrower and lender — deliberately
 * scoped to a Loan, not an open DM system (see routers/chat.py for why).
 * Mirrors DisputeDetailScreenContent's bubble styling, minus the
 * admin/resolution-lock concepts that don't apply to a plain chat. */
export function ChatThreadScreenContent({
  loanId,
  accentColor = Colors.teal,
}: {
  loanId: string;
  accentColor?: string;
}) {
  const typography = useScaledTypography();
  const styles = useMemo(() => makeStyles(typography), [typography]);
  const { profile } = useProfileViewModel();
  const { chat, isLoading, text, setText, send, sending } = useLoanChatViewModel(loanId);

  if (isLoading) {
    return (
      <View style={{ padding: Spacing.lg }}>
        <SkeletonList count={3} cardHeight={56} />
      </View>
    );
  }

  if (!chat) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>Conversation not found.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {chat.messages.length === 0 ? (
          <Text style={styles.emptyInline}>No messages yet — say hello.</Text>
        ) : (
          chat.messages.map((m) => {
            const mine = m.senderId === profile?.id;
            return (
              <View
                key={m.id}
                style={[
                  styles.bubble,
                  mine
                    ? { backgroundColor: accentColor, alignSelf: "flex-end" }
                    : { backgroundColor: Colors.surfaceLift, alignSelf: "flex-start" },
                ]}
              >
                <Text style={styles.bubbleText}>{m.message}</Text>
                <Text style={styles.bubbleTime}>{new Date(m.createdAt).toLocaleString()}</Text>
              </View>
            );
          })
        )}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Write a message…"
          placeholderTextColor={Colors.textMuted}
          value={text}
          onChangeText={setText}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: accentColor }]}
          onPress={send}
          disabled={sending || !text.trim()}
        >
          {sending ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Ionicons name="send" size={16} color={Colors.white} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function makeStyles(typography: ReturnType<typeof useScaledTypography>) {
  return StyleSheet.create({
    scroll: { padding: Spacing.lg, gap: Spacing.sm, flexGrow: 1 },
    emptyState: { flex: 1, alignItems: "center", justifyContent: "center", padding: Spacing.xl },
    emptyText: { ...typography.body, color: Colors.textMuted, textAlign: "center" },
    emptyInline: { ...typography.body, color: Colors.textMuted, textAlign: "center", marginTop: Spacing.xl },
    bubble: { maxWidth: "82%", borderRadius: BorderRadius.lg, padding: Spacing.sm, marginBottom: Spacing.sm },
    bubbleText: { ...typography.small, color: Colors.white },
    bubbleTime: { ...typography.caption, color: Colors.white, opacity: 0.7, marginTop: 2 },
    inputRow: {
      flexDirection: "row",
      gap: Spacing.xs,
      padding: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: Colors.border,
      alignItems: "flex-end",
    },
    input: {
      flex: 1,
      backgroundColor: Colors.surfaceLift,
      borderRadius: BorderRadius.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      color: Colors.textPrimary,
      maxHeight: 100,
    },
    sendBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
    },
  });
}
