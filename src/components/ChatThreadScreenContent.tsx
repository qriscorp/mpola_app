import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Image, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { Colors, Spacing, BorderRadius, useScaledTypography } from "../theme";
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

function ThreadView({
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

  if (isLoading) {
    return (
      <View style={{ padding: Spacing.lg }}>
        <SkeletonList count={3} cardHeight={56} />
      </View>
    );
  }

  if (!found) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>Conversation not found.</Text>
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
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {messages.length === 0 ? (
          <Text style={styles.emptyInline}>No messages yet — say hello.</Text>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === myId;
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
                {m.fileUrl && isImageFile(m.fileName) && (
                  <TouchableOpacity onPress={() => Linking.openURL(m.fileUrl!)}>
                    <Image source={{ uri: m.fileUrl }} style={styles.attachmentImage} resizeMode="cover" />
                  </TouchableOpacity>
                )}
                {m.fileUrl && !isImageFile(m.fileName) && (
                  <TouchableOpacity style={styles.fileChip} onPress={() => Linking.openURL(m.fileUrl!)}>
                    <Ionicons name="document-text-outline" size={14} color={Colors.white} />
                    <Text style={styles.fileChipText} numberOfLines={1}>
                      {m.fileName ?? "Attachment"}
                    </Text>
                  </TouchableOpacity>
                )}
                {!!m.message && <Text style={styles.bubbleText}>{m.message}</Text>}
                <View style={styles.bubbleFooter}>
                  <Text style={styles.bubbleTime}>{new Date(m.createdAt).toLocaleString()}</Text>
                  {mine && (
                    <Ionicons
                      name={readAt && m.createdAt <= readAt ? "checkmark-done" : "checkmark"}
                      size={14}
                      color={Colors.white}
                      style={{ opacity: readAt && m.createdAt <= readAt ? 0.9 : 0.7 }}
                    />
                  )}
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
  accentColor = Colors.teal,
}: {
  loanId: string;
  accentColor?: string;
}) {
  const { profile } = useProfileViewModel();
  const { chat, isLoading, text, setText, attachment, setAttachment, send, sending } = useLoanChatViewModel(loanId);

  return (
    <ThreadView
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
  accentColor = Colors.teal,
}: {
  accentColor?: string;
}) {
  const { profile } = useProfileViewModel();
  const { chat, isLoading, text, setText, attachment, setAttachment, send, sending } = useAdminChatViewModel();

  return (
    <ThreadView
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
    scroll: { padding: Spacing.lg, gap: Spacing.sm, flexGrow: 1 },
    emptyState: { flex: 1, alignItems: "center", justifyContent: "center", padding: Spacing.xl },
    emptyText: { ...typography.body, color: Colors.textMuted, textAlign: "center" },
    emptyInline: { ...typography.body, color: Colors.textMuted, textAlign: "center", marginTop: Spacing.xl },
    bubble: { maxWidth: "82%", borderRadius: BorderRadius.lg, padding: Spacing.sm, marginBottom: Spacing.sm },
    bubbleText: { ...typography.small, color: Colors.white },
    bubbleFooter: { flexDirection: "row", alignItems: "center", gap: 3, alignSelf: "flex-end", marginTop: 2 },
    bubbleTime: { ...typography.caption, color: Colors.white, opacity: 0.7 },
    attachmentImage: {
      width: 180,
      height: 130,
      borderRadius: BorderRadius.md,
      marginBottom: Spacing.xs,
    },
    fileChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.xs,
      marginBottom: Spacing.xs,
    },
    fileChipText: { ...typography.small, color: Colors.white, textDecorationLine: "underline", flexShrink: 1 },
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
