import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Image, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { Colors, Spacing, BorderRadius, Shadow, useScaledTypography } from "../theme";
import { useLoanChatViewModel, useAdminChatViewModel, useProfileViewModel } from "../viewmodels";
import { ChatAttachment } from "../services";
import { SkeletonList } from "./Skeleton";

type ThreadMessage = {
  id: string;
  senderId: string | null;
  message: string | null;
  fileUrl: string | null;
  fileName: string | null;
  createdAt: string;
};

function isImageFile(name: string | null): boolean {
  if (!name) return false;
  return /\.(jpe?g|png)$/i.test(name);
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function isSameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

function dateLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (isSameDay(d, today)) return "Today";
  if (isSameDay(d, yesterday)) return "Yesterday";
  return d.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
}

function ThreadView({
  title,
  subtitle,
  onBack,
  isLoading,
  found,
  messages,
  myId,
  readAt,
  accentColor,
  text,
  setText,
  attachment,
  setAttachment,
  send,
  sending,
}: {
  title: string;
  subtitle?: string;
  onBack: () => void;
  isLoading: boolean;
  found: boolean;
  messages: ThreadMessage[];
  myId: string | undefined;
  readAt: string | null | undefined;
  accentColor: string;
  text: string;
  setText: (v: string) => void;
  attachment: ChatAttachment | null;
  setAttachment: (a: ChatAttachment | null) => void;
  send: () => void;
  sending: boolean;
}) {
  const typography = useScaledTypography();
  const styles = useMemo(() => makeStyles(typography), [typography]);

  const header = (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} accessibilityLabel="Go back" accessibilityRole="button">
        <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        {!!subtitle && <Text style={styles.headerSubtitle} numberOfLines={1}>{subtitle}</Text>}
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={{ flex: 1 }}>
        {header}
        <View style={{ padding: Spacing.lg }}>
          <SkeletonList count={3} cardHeight={56} />
        </View>
      </View>
    );
  }

  if (!found) {
    return (
      <View style={{ flex: 1 }}>
        {header}
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Conversation not found.</Text>
        </View>
      </View>
    );
  }

  const handlePickAttachment = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/*"],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setAttachment({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType });
  };

  return (
    <View style={{ flex: 1 }}>
      {header}
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {messages.length === 0 ? (
          <Text style={styles.emptyInline}>No messages yet — say hello.</Text>
        ) : (
          messages.map((m, i) => {
            const mine = m.senderId === myId;
            const prev = i > 0 ? messages[i - 1] : null;
            const newDay = !prev || !isSameDay(new Date(prev.createdAt), new Date(m.createdAt));
            const grouped = !newDay && !!prev && prev.senderId === m.senderId;
            return (
              <View key={m.id}>
                {newDay && (
                  <View style={styles.dateSeparator}>
                    <Text style={styles.dateSeparatorText}>{dateLabel(m.createdAt)}</Text>
                  </View>
                )}
                <View
                  style={[
                    styles.bubble,
                    { marginTop: grouped ? 2 : Spacing.sm },
                    mine
                      ? [styles.bubbleMine, { backgroundColor: accentColor }]
                      : styles.bubbleTheirs,
                  ]}
                >
                  {m.fileUrl && isImageFile(m.fileName) && (
                    <TouchableOpacity onPress={() => Linking.openURL(m.fileUrl!)}>
                      <Image source={{ uri: m.fileUrl }} style={styles.attachmentImage} resizeMode="cover" />
                    </TouchableOpacity>
                  )}
                  {m.fileUrl && !isImageFile(m.fileName) && (
                    <TouchableOpacity
                      style={[styles.fileChip, !mine && { backgroundColor: Colors.surface }]}
                      onPress={() => Linking.openURL(m.fileUrl!)}
                    >
                      <Ionicons
                        name="document-text-outline"
                        size={14}
                        color={mine ? Colors.white : accentColor}
                      />
                      <Text
                        style={[styles.fileChipText, !mine && { color: Colors.textPrimary }]}
                        numberOfLines={1}
                      >
                        {m.fileName ?? "Attachment"}
                      </Text>
                    </TouchableOpacity>
                  )}
                  {!!m.message && (
                    <Text style={[styles.bubbleText, !mine && { color: Colors.textPrimary }]}>
                      {m.message}
                    </Text>
                  )}
                  <View style={styles.bubbleFooter}>
                    <Text style={[styles.bubbleTime, !mine && { color: Colors.textMuted }]}>
                      {formatTime(m.createdAt)}
                    </Text>
                    {mine && (
                      <Ionicons
                        name={readAt && m.createdAt <= readAt ? "checkmark-done" : "checkmark"}
                        size={14}
                        color={Colors.white}
                        style={{ opacity: readAt && m.createdAt <= readAt ? 0.95 : 0.7 }}
                      />
                    )}
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {attachment && (
        <View style={styles.pendingChip}>
          <Ionicons name="attach" size={14} color={Colors.textMuted} />
          <Text style={styles.pendingChipText} numberOfLines={1}>
            {attachment.name}
          </Text>
          <TouchableOpacity onPress={() => setAttachment(null)}>
            <Ionicons name="close" size={14} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.inputRow}>
        <TouchableOpacity style={styles.attachBtn} onPress={handlePickAttachment}>
          <Ionicons name="attach" size={20} color={Colors.textMuted} />
        </TouchableOpacity>
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
          disabled={sending || (!text.trim() && !attachment)}
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

/** One loan's message thread between its borrower and lender — deliberately
 * scoped to a Loan, not an open DM system (see routers/chat.py for why).
 * Mirrors DisputeDetailScreenContent's bubble styling, minus the
 * admin/resolution-lock concepts that don't apply to a plain chat. */
export function ChatThreadScreenContent({
  loanId,
  onBack,
  accentColor = Colors.teal,
}: {
  loanId: string;
  onBack: () => void;
  accentColor?: string;
}) {
  const { profile } = useProfileViewModel();
  const { chat, isLoading, text, setText, attachment, setAttachment, send, sending } = useLoanChatViewModel(loanId);

  return (
    <ThreadView
      title={chat?.otherParty.name ?? "Loading…"}
      onBack={onBack}
      isLoading={isLoading}
      found={!!chat}
      messages={chat?.messages ?? []}
      myId={profile?.id}
      readAt={chat?.otherPartyReadAt}
      accentColor={accentColor}
      text={text}
      setText={setText}
      attachment={attachment}
      setAttachment={setAttachment}
      send={send}
      sending={sending}
    />
  );
}

/** The user's own conversation with Mpola Support — a persistent thread per
 * user, not per-loan, alongside (not replacing) the SupportTicket system. */
export function AdminChatThreadScreenContent({
  onBack,
  accentColor = Colors.teal,
}: {
  onBack: () => void;
  accentColor?: string;
}) {
  const { profile } = useProfileViewModel();
  const { chat, isLoading, text, setText, attachment, setAttachment, send, sending } = useAdminChatViewModel();

  return (
    <ThreadView
      title="Mpola Support"
      subtitle="Our team usually replies within a day"
      onBack={onBack}
      isLoading={isLoading}
      found={!!chat}
      messages={chat?.messages ?? []}
      myId={profile?.id}
      readAt={chat?.adminLastSeenAt}
      accentColor={accentColor}
      text={text}
      setText={setText}
      attachment={attachment}
      setAttachment={setAttachment}
      send={send}
      sending={sending}
    />
  );
}

function makeStyles(typography: ReturnType<typeof useScaledTypography>) {
  return StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    headerTitle: { ...typography.bodyMedium, color: Colors.textPrimary, fontWeight: "700" },
    headerSubtitle: { ...typography.caption, color: Colors.textMuted, marginTop: 1 },
    scroll: { padding: Spacing.lg, flexGrow: 1 },
    emptyState: { flex: 1, alignItems: "center", justifyContent: "center", padding: Spacing.xl },
    emptyText: { ...typography.body, color: Colors.textMuted, textAlign: "center" },
    emptyInline: { ...typography.body, color: Colors.textMuted, textAlign: "center", marginTop: Spacing.xl },
    dateSeparator: { alignItems: "center", marginTop: Spacing.md, marginBottom: Spacing.sm },
    dateSeparatorText: {
      ...typography.caption,
      color: Colors.textMuted,
      backgroundColor: Colors.surface,
      paddingHorizontal: Spacing.md,
      paddingVertical: 4,
      borderRadius: BorderRadius.full,
      overflow: "hidden",
    },
    bubble: { maxWidth: "82%", borderRadius: BorderRadius.lg, padding: Spacing.sm, paddingHorizontal: Spacing.md, ...Shadow.sm },
    bubbleMine: { alignSelf: "flex-end", borderBottomRightRadius: 4 },
    bubbleTheirs: { alignSelf: "flex-start", backgroundColor: Colors.surface, borderBottomLeftRadius: 4 },
    bubbleText: { ...typography.small, color: Colors.white },
    bubbleFooter: { flexDirection: "row", alignItems: "center", gap: 3, alignSelf: "flex-end", marginTop: 3 },
    bubbleTime: { ...typography.caption, color: Colors.white, opacity: 0.7 },
    attachmentImage: {
      width: 190,
      height: 140,
      borderRadius: BorderRadius.md,
      marginBottom: Spacing.xs,
    },
    fileChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.xs,
      marginBottom: Spacing.xs,
      backgroundColor: "rgba(255,255,255,0.15)",
      borderRadius: BorderRadius.md,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
    },
    fileChipText: { ...typography.small, color: Colors.white, flexShrink: 1 },
    pendingChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.xs,
      marginHorizontal: Spacing.md,
      marginTop: Spacing.sm,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      backgroundColor: Colors.surfaceLift,
      borderRadius: BorderRadius.md,
    },
    pendingChipText: { ...typography.small, color: Colors.textSecondary, flex: 1 },
    inputRow: {
      flexDirection: "row",
      gap: Spacing.xs,
      padding: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: Colors.border,
      alignItems: "flex-end",
    },
    attachBtn: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
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
