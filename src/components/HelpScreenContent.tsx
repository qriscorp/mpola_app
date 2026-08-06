import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Colors, Typography, Spacing, BorderRadius } from "../theme";
import { Card } from "./Card";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { SkeletonList } from "./Skeleton";
import {
  fetchMySupportTickets,
  fetchSupportTicket,
  createSupportTicket,
  replySupportTicket,
  type SupportTicket,
} from "../services";

const FAQ = [
  {
    q: "How is my platform fee calculated?",
    a: "Mpola charges a 0.5% platform fee on withdrawals, loan disbursements, and repayments, plus the mobile money/bank provider's own surcharge. Deposits are always free.",
  },
  {
    q: "How long does a loan disbursement take?",
    a: "Once a lender accepts and funds your loan, it's transferred directly to your Mpola wallet — usually within seconds.",
  },
  {
    q: "What happens if I miss a repayment?",
    a: "There's a short grace period before a missed instalment is marked overdue, at which point a late fee applies. Continued non-payment can lead to the loan being marked defaulted.",
  },
];

const statusVariant: Record<string, "info" | "warning" | "success" | "default"> = {
  open: "info",
  in_progress: "warning",
  resolved: "success",
  closed: "default",
};

export function HelpScreenContent({ accentColor = Colors.teal }: { accentColor?: string }) {
  const qc = useQueryClient();
  const { data: tickets, isLoading } = useQuery({
    queryKey: ["support", "mine"],
    queryFn: fetchMySupportTickets,
  });

  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState("");
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
        {FAQ.map((item) => (
          <View key={item.q} style={styles.faqItem}>
            <Text style={styles.faqQ}>{item.q}</Text>
            <Text style={styles.faqA}>{item.a}</Text>
          </View>
        ))}
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
              onPress={() => create.mutate({ subject, category: "general", message })}
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

const styles = StyleSheet.create({
  sectionTitle: { ...Typography.h4, color: Colors.textPrimary },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.sm },
  faqItem: { marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border },
  faqQ: { ...Typography.bodyMedium, color: Colors.textPrimary },
  faqA: { ...Typography.small, color: Colors.textSecondary, marginTop: 4 },
  formBox: { gap: Spacing.sm, marginBottom: Spacing.md, paddingTop: Spacing.sm },
  input: {
    backgroundColor: Colors.surfaceLift,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Colors.textPrimary,
    ...Typography.body,
    marginBottom: Spacing.sm,
  },
  emptyText: { ...Typography.body, color: Colors.textMuted, textAlign: "center", paddingVertical: Spacing.lg },
  ticketRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  ticketSubject: { ...Typography.bodyMedium, color: Colors.textPrimary },
  ticketMeta: { ...Typography.caption, color: Colors.textMuted },
  threadBox: { marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border, gap: Spacing.sm },
  messageBubble: { borderRadius: BorderRadius.md, padding: Spacing.sm, marginBottom: Spacing.xs },
  messageSender: { ...Typography.caption, color: Colors.textMuted, marginBottom: 2 },
  messageText: { ...Typography.small, color: Colors.textPrimary },
  replyRow: { flexDirection: "row", gap: Spacing.sm, alignItems: "center" },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
});
