import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Colors, Spacing, BorderRadius, useScaledTypography } from "../theme";
import { Card } from "./Card";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { SkeletonList } from "./Skeleton";
import {
  fetchFaqs,
  fetchMySupportTickets,
  fetchSupportTicket,
  createSupportTicket,
  replySupportTicket,
  type SupportTicket,
} from "../services";

const CATEGORIES: { value: string; label: string }[] = [
  { value: "general", label: "General" },
  { value: "wallet", label: "Wallet" },
  { value: "loan", label: "Loan" },
  { value: "kyc", label: "KYC" },
  { value: "bug", label: "Bug" },
  { value: "other", label: "Other" },
];

function Chip({ label, active, onPress, color }: { label: string; active: boolean; onPress: () => void; color: string }) {
  const typography = useScaledTypography();
  const styles = useMemo(() => makeStyles(typography), [typography]);
  return (
    <TouchableOpacity
      style={[styles.chip, active && { backgroundColor: color, borderColor: color }]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const statusVariant: Record<string, "info" | "warning" | "success" | "default"> = {
  open: "info",
  in_progress: "warning",
  resolved: "success",
  closed: "default",
};

export function HelpScreenContent({ accentColor = Colors.teal }: { accentColor?: string }) {
  const qc = useQueryClient();
  const typography = useScaledTypography();
  const styles = useMemo(() => makeStyles(typography), [typography]);
  const [faqSearch, setFaqSearch] = useState("");
  const { data: faqs, isLoading: faqsLoading } = useQuery({
    queryKey: ["faqs", faqSearch],
    queryFn: () => fetchFaqs(faqSearch.trim() || undefined),
  });
  const { data: tickets, isLoading } = useQuery({
    queryKey: ["support", "mine"],
    queryFn: fetchMySupportTickets,
  });

  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("general");
  const [message, setMessage] = useState("");
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [reply, setReply] = useState("");

  const { data: activeTicket } = useQuery({
    queryKey: ["support", activeTicketId],
    queryFn: () => fetchSupportTicket(activeTicketId as string),
    enabled: !!activeTicketId,
  });

  const create = useMutation({
    mutationFn: createSupportTicket,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["support", "mine"] });
      setSubject("");
      setCategory("general");
      setMessage("");
      setShowForm(false);
    },
  });

  const replyMutation = useMutation({
    mutationFn: (vars: { id: string; message: string }) => replySupportTicket(vars.id, vars.message),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["support", activeTicketId] });
      qc.invalidateQueries({ queryKey: ["support", "mine"] });
      setReply("");
    },
  });

  return (
    <View style={{ gap: Spacing.lg }}>
      <Card>
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search FAQs..."
            placeholderTextColor={Colors.textMuted}
            value={faqSearch}
            onChangeText={setFaqSearch}
          />
        </View>
        {faqsLoading ? (
          <SkeletonList count={2} cardHeight={48} />
        ) : !faqs?.length ? (
          <Text style={styles.emptyText}>
            {faqSearch ? "No FAQs match your search." : "No FAQs available right now."}
          </Text>
        ) : (
          faqs.map((item) => (
            <View key={item.id} style={styles.faqItem}>
              <Text style={styles.faqQ}>{item.question}</Text>
              <Text style={styles.faqA}>{item.answer}</Text>
            </View>
          ))
        )}
      </Card>

      <Card>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>Support Tickets</Text>
          <TouchableOpacity onPress={() => setShowForm((v) => !v)}>
            <Ionicons name="add-circle" size={26} color={accentColor} />
          </TouchableOpacity>
        </View>

        {showForm && (
          <View style={styles.formBox}>
            <TextInput
              style={styles.input}
              placeholder="Subject"
              placeholderTextColor={Colors.textMuted}
              value={subject}
              onChangeText={setSubject}
            />
            <Text style={styles.fieldLabel}>Category</Text>
            <View style={styles.chipRow}>
              {CATEGORIES.map((c) => (
                <Chip key={c.value} label={c.label} active={category === c.value} onPress={() => setCategory(c.value)} color={accentColor} />
              ))}
            </View>
            <TextInput
              style={[styles.input, { height: 90, textAlignVertical: "top" }]}
              placeholder="Describe your issue..."
              placeholderTextColor={Colors.textMuted}
              value={message}
              onChangeText={setMessage}
              multiline
            />
            <Button
              title={create.isPending ? "Submitting…" : "Submit Ticket"}
              onPress={() => create.mutate({ subject, category, message })}
              color={accentColor}
              disabled={create.isPending || !subject.trim() || !message.trim()}
            />
          </View>
        )}

        {isLoading ? (
          <SkeletonList count={2} cardHeight={56} />
        ) : !tickets?.length ? (
          <Text style={styles.emptyText}>No support tickets yet.</Text>
        ) : (
          tickets.map((t: SupportTicket) => (
            <TouchableOpacity
              key={t.id}
              style={styles.ticketRow}
              onPress={() => setActiveTicketId(t.id === activeTicketId ? null : t.id)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.ticketSubject}>{t.subject}</Text>
                <Text style={styles.ticketMeta}>
                  {t.message_count} message{t.message_count === 1 ? "" : "s"}
                </Text>
              </View>
              <Badge label={t.status.replace("_", " ")} variant={statusVariant[t.status] ?? "default"} />
            </TouchableOpacity>
          ))
        )}

        {activeTicket && (
          <View style={styles.threadBox}>
            <ScrollView style={{ maxHeight: 220 }}>
              {activeTicket.messages?.map((m) => (
                <View
                  key={m.id}
                  style={[
                    styles.messageBubble,
                    m.is_admin
                      ? { backgroundColor: Colors.surfaceLift, marginRight: 24 }
                      : { backgroundColor: accentColor + "20", marginLeft: 24 },
                  ]}
                >
                  <Text style={styles.messageSender}>{m.is_admin ? "Mpola Support" : "You"}</Text>
                  <Text style={styles.messageText}>{m.message}</Text>
                </View>
              ))}
            </ScrollView>
            {activeTicket.status !== "closed" && (
              <View style={styles.replyRow}>
                <TextInput
                  style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  placeholder="Type a reply..."
                  placeholderTextColor={Colors.textMuted}
                  value={reply}
                  onChangeText={setReply}
                />
                <TouchableOpacity
                  style={[styles.sendBtn, { backgroundColor: accentColor }]}
                  onPress={() => reply.trim() && replyMutation.mutate({ id: activeTicket.id, message: reply })}
                >
                  <Ionicons name="send" size={16} color={Colors.white} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </Card>
    </View>
  );
}

function makeStyles(typography: ReturnType<typeof useScaledTypography>) {
  return StyleSheet.create({
    sectionTitle: { ...typography.h4, color: Colors.textPrimary },
    rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.sm },
    faqItem: { marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border },
    faqQ: { ...typography.bodyMedium, color: Colors.textPrimary },
    faqA: { ...typography.small, color: Colors.textSecondary, marginTop: 4 },
    searchBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.xs,
      backgroundColor: Colors.surfaceLift,
      borderRadius: BorderRadius.md,
      paddingHorizontal: Spacing.md,
      marginTop: Spacing.sm,
      marginBottom: Spacing.sm,
    },
    searchInput: { flex: 1, paddingVertical: Spacing.sm, color: Colors.textPrimary, ...typography.body },
    fieldLabel: { ...typography.smallMedium, color: Colors.textSecondary, marginTop: Spacing.xs },
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.xs, marginBottom: Spacing.xs },
    chip: {
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: BorderRadius.full,
      paddingHorizontal: Spacing.md,
      paddingVertical: 6,
    },
    chipText: { ...typography.caption, color: Colors.textSecondary, fontWeight: "600" },
    chipTextActive: { color: Colors.white },
    formBox: { gap: Spacing.sm, marginBottom: Spacing.md, paddingTop: Spacing.sm },
    input: {
      backgroundColor: Colors.surfaceLift,
      borderRadius: BorderRadius.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      color: Colors.textPrimary,
      ...typography.body,
      marginBottom: Spacing.sm,
    },
    emptyText: { ...typography.body, color: Colors.textMuted, textAlign: "center", paddingVertical: Spacing.lg },
    ticketRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: Spacing.sm,
      borderTopWidth: 1,
      borderTopColor: Colors.border,
    },
    ticketSubject: { ...typography.bodyMedium, color: Colors.textPrimary },
    ticketMeta: { ...typography.caption, color: Colors.textMuted },
    threadBox: { marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border, gap: Spacing.sm },
    messageBubble: { borderRadius: BorderRadius.md, padding: Spacing.sm, marginBottom: Spacing.xs },
    messageSender: { ...typography.caption, color: Colors.textMuted, marginBottom: 2 },
    messageText: { ...typography.small, color: Colors.textPrimary },
    replyRow: { flexDirection: "row", gap: Spacing.sm, alignItems: "center" },
    sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  });
}
