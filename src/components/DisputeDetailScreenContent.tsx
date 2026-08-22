import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Colors, Spacing, BorderRadius, useScaledTypography } from "../theme";
import { Card } from "./Card";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { SkeletonList } from "./Skeleton";
import { ConfirmModal } from "./ConfirmModal";
import { showAlert } from "../services/alerts";
import {
  fetchDispute,
  postDisputeMessage,
  proposeDisputeResolution,
  respondToDisputeProposal,
  escalateDispute,
} from "../services";
import { fetchProfile } from "../services";

const statusVariant: Record<string, "info" | "warning" | "success" | "danger"> = {
  open: "info",
  investigating: "warning",
  resolved: "success",
  rejected: "danger",
};

const categoryLabel: Record<string, string> = {
  payment: "Payment",
  loan_terms: "Loan Terms",
  fraud: "Fraud",
  disbursement: "Disbursement",
  other: "Other",
};

const formatCurrency = (amount: number) => `UGX ${amount.toLocaleString()}`;

export function DisputeDetailScreenContent({
  disputeId,
  accentColor = Colors.teal,
}: {
  disputeId: string;
  accentColor?: string;
}) {
  const qc = useQueryClient();
  const typography = useScaledTypography();
  const styles = useMemo(() => makeStyles(typography), [typography]);
  const { data: user } = useQuery({ queryKey: ["profile"], queryFn: fetchProfile });
  const { data: dispute, isLoading } = useQuery({
    queryKey: ["disputes", disputeId],
    queryFn: () => fetchDispute(disputeId),
    enabled: !!disputeId,
  });

  const [messageText, setMessageText] = useState("");
  const [showProposeForm, setShowProposeForm] = useState(false);
  const [proposalNote, setProposalNote] = useState("");
  const [settlementAmount, setSettlementAmount] = useState("");
  const [payer, setPayer] = useState<"self" | "other">("self");
  const [confirmAction, setConfirmAction] = useState<"accept" | "decline" | "escalate" | null>(null);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["disputes", disputeId] });
    qc.invalidateQueries({ queryKey: ["disputes", "mine"] });
  };

  const postMessage = useMutation({
    mutationFn: (msg: string) => postDisputeMessage(disputeId, msg),
    onSuccess: () => {
      setMessageText("");
      invalidate();
    },
    onError: (e: any) => showAlert("Failed to send", e?.message || "Please try again."),
  });

  const propose = useMutation({
    mutationFn: () =>
      proposeDisputeResolution(disputeId, {
        note: proposalNote.trim(),
        settlementAmount: settlementAmount ? Number(settlementAmount) : undefined,
        payer,
      }),
    onSuccess: () => {
      setProposalNote("");
      setSettlementAmount("");
      setShowProposeForm(false);
      invalidate();
    },
    onError: (e: any) => showAlert("Failed to propose", e?.message || "Please try again."),
  });

  const respond = useMutation({
    mutationFn: (accept: boolean) => respondToDisputeProposal(disputeId, accept),
    onSuccess: (d) => {
      setConfirmAction(null);
      showAlert(d.status === "resolved" ? "Resolved" : "Declined", d.status === "resolved" ? "The dispute has been resolved." : "Proposal declined.");
      invalidate();
    },
    onError: (e: any) => {
      setConfirmAction(null);
      showAlert("Failed", e?.message || "Please try again.");
    },
  });

  const escalate = useMutation({
    mutationFn: () => escalateDispute(disputeId),
    onSuccess: () => {
      setConfirmAction(null);
      showAlert("Escalated", "Mpola support has been notified.");
      invalidate();
    },
    onError: (e: any) => {
      setConfirmAction(null);
      showAlert("Failed to escalate", e?.message || "Please try again.");
    },
  });

  if (isLoading || !dispute) {
    return <SkeletonList count={3} cardHeight={80} />;
  }

  const isFiler = user?.id === dispute.user_id;
  const isClosed = dispute.status === "resolved" || dispute.status === "rejected";
  const hasCounterparty = !!dispute.respondent_id;
  const proposalIsMine = dispute.proposal?.proposed_by_id === user?.id;

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <Card>
        <View style={styles.rowGap}>
          <Badge label={categoryLabel[dispute.category] ?? dispute.category} variant="default" />
          <Badge label={dispute.status} variant={statusVariant[dispute.status] ?? "default"} />
        </View>
        <Text style={styles.desc}>{dispute.description}</Text>
        <Text style={styles.meta}>
          Filed by {isFiler ? "you" : dispute.filer_name ?? "—"}
          {hasCounterparty ? ` · With ${dispute.respondent_id === user?.id ? "you" : dispute.respondent_name ?? "—"}` : ""}
        </Text>

        {dispute.status === "investigating" && (
          <View style={styles.noticeBox}>
            <Ionicons name="shield-checkmark-outline" size={14} color={Colors.warning} />
            <Text style={styles.noticeText}>
              Escalated to Mpola support — an admin will review this.
            </Text>
          </View>
        )}

        {isClosed && (
          <View style={styles.resolutionBox}>
            <Text style={styles.resolutionTitle}>
              {dispute.status === "resolved" ? "Resolved" : "Rejected"}
              {dispute.resolved_by ? ` by ${dispute.resolved_by}` : ""}
            </Text>
            {!!dispute.resolution_note && <Text style={styles.resolutionNote}>{dispute.resolution_note}</Text>}
          </View>
        )}
      </Card>

      {!isClosed && hasCounterparty && dispute.proposal?.status === "pending" && (
        <Card style={{ marginTop: Spacing.md }}>
          <Text style={styles.sectionTitle}>
            {proposalIsMine ? "Your proposal" : `${dispute.proposal.proposed_by_name ?? "The other party"} proposed`}
          </Text>
          <Text style={styles.desc}>{dispute.proposal.note}</Text>
          {!!dispute.proposal.settlement_amount && (
            <Text style={styles.settlementText}>
              Settlement: {formatCurrency(dispute.proposal.settlement_amount)} — paid by{" "}
              {dispute.proposal.settlement_payer_id === user?.id ? "you" : dispute.proposal.settlement_payer_name ?? "—"}
            </Text>
          )}
          {proposalIsMine ? (
            <Text style={styles.meta}>Waiting for the other party to respond.</Text>
          ) : (
            <View style={{ flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.sm }}>
              <Button title="Accept" onPress={() => setConfirmAction("accept")} color={accentColor} disabled={respond.isPending} />
              <TouchableOpacity
                style={styles.declineBtn}
                onPress={() => setConfirmAction("decline")}
                disabled={respond.isPending}
              >
                <Text style={styles.declineText}>Decline</Text>
              </TouchableOpacity>
            </View>
          )}
        </Card>
      )}

      {!isClosed && hasCounterparty && dispute.proposal?.status !== "pending" && (
        <Card style={{ marginTop: Spacing.md }}>
          {!showProposeForm ? (
            <TouchableOpacity style={styles.proposeToggle} onPress={() => setShowProposeForm(true)}>
              <Ionicons name="cash-outline" size={16} color={accentColor} />
              <Text style={[styles.proposeToggleText, { color: accentColor }]}>Propose a Resolution</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ gap: Spacing.sm }}>
              <Text style={styles.sectionTitle}>Propose a resolution</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: "top" }]}
                placeholder="What do you propose?"
                placeholderTextColor={Colors.textMuted}
                value={proposalNote}
                onChangeText={setProposalNote}
                multiline
              />
              <TextInput
                style={styles.input}
                placeholder="UGX settlement amount (optional)"
                placeholderTextColor={Colors.textMuted}
                value={settlementAmount}
                onChangeText={setSettlementAmount}
                keyboardType="numeric"
              />
              {!!settlementAmount && Number(settlementAmount) > 0 && (
                <View style={{ flexDirection: "row", gap: Spacing.sm }}>
                  <TouchableOpacity
                    style={[styles.payerChip, payer === "self" && { backgroundColor: accentColor, borderColor: accentColor }]}
                    onPress={() => setPayer("self")}
                  >
                    <Text style={[styles.payerChipText, payer === "self" && { color: Colors.white }]}>I&apos;ll pay</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.payerChip, payer === "other" && { backgroundColor: accentColor, borderColor: accentColor }]}
                    onPress={() => setPayer("other")}
                  >
                    <Text style={[styles.payerChipText, payer === "other" && { color: Colors.white }]}>They pay</Text>
                  </TouchableOpacity>
                </View>
              )}
              <View style={{ flexDirection: "row", gap: Spacing.sm }}>
                <Button
                  title={propose.isPending ? "Sending…" : "Send Proposal"}
                  onPress={() => propose.mutate()}
                  color={accentColor}
                  disabled={propose.isPending || proposalNote.trim().length < 1}
                />
                <TouchableOpacity style={styles.declineBtn} onPress={() => setShowProposeForm(false)}>
                  <Text style={styles.declineText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Card>
      )}

      <Card style={{ marginTop: Spacing.md }}>
        <Text style={styles.sectionTitle}>Messages</Text>
        {!dispute.messages?.length ? (
          <Text style={styles.meta}>No messages yet — say what happened.</Text>
        ) : (
          <View style={{ gap: Spacing.sm, marginTop: Spacing.xs }}>
            {dispute.messages.map((m) => {
              const mine = m.sender_id === user?.id;
              return (
                <View
                  key={m.id}
                  style={[
                    styles.bubble,
                    mine
                      ? { backgroundColor: accentColor, alignSelf: "flex-end" }
                      : m.is_admin
                        ? { backgroundColor: Colors.teal + "20", alignSelf: "flex-start" }
                        : { backgroundColor: Colors.surfaceLift, alignSelf: "flex-start" },
                  ]}
                >
                  <Text style={[styles.bubbleSender, mine && { color: Colors.white, opacity: 0.85 }]}>
                    {mine ? "You" : m.is_admin ? "Mpola Support" : m.sender_name ?? "—"}
                  </Text>
                  <Text style={[styles.bubbleText, mine && { color: Colors.white }]}>{m.message}</Text>
                </View>
              );
            })}
          </View>
        )}

        {!isClosed && (
          <View style={styles.messageInputRow}>
            <TextInput
              style={styles.messageInput}
              placeholder="Write a message..."
              placeholderTextColor={Colors.textMuted}
              value={messageText}
              onChangeText={setMessageText}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendBtn, { backgroundColor: accentColor }]}
              onPress={() => messageText.trim() && postMessage.mutate(messageText.trim())}
              disabled={postMessage.isPending || !messageText.trim()}
            >
              {postMessage.isPending ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Ionicons name="send" size={16} color={Colors.white} />
              )}
            </TouchableOpacity>
          </View>
        )}
      </Card>

      {!isClosed && dispute.status === "open" && (
        <TouchableOpacity
          style={styles.escalateBtn}
          onPress={() => setConfirmAction("escalate")}
          disabled={escalate.isPending}
        >
          <Ionicons name="shield-checkmark-outline" size={16} color={Colors.warning} />
          <Text style={styles.escalateText}>Not resolving together? Escalate to Mpola Support</Text>
        </TouchableOpacity>
      )}

      <ConfirmModal
        visible={confirmAction === "accept"}
        icon="checkmark-circle-outline"
        title="Accept this proposal?"
        message={
          dispute.proposal?.settlement_amount
            ? `This resolves the dispute with a settlement of ${formatCurrency(dispute.proposal.settlement_amount)}, paid by ${dispute.proposal.settlement_payer_id === user?.id ? "you" : dispute.proposal.settlement_payer_name ?? "the other party"}. This can't be undone.`
            : "This resolves the dispute as proposed. This can't be undone."
        }
        confirmLabel="Accept"
        accentColor={accentColor}
        loading={respond.isPending}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => respond.mutate(true)}
      />
      <ConfirmModal
        visible={confirmAction === "decline"}
        icon="close-circle-outline"
        title="Decline this proposal?"
        message="The dispute stays open — you can propose your own resolution or escalate to Mpola support."
        confirmLabel="Decline"
        destructive
        loading={respond.isPending}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => respond.mutate(false)}
      />
      <ConfirmModal
        visible={confirmAction === "escalate"}
        icon="shield-checkmark-outline"
        title="Escalate to Mpola Support?"
        message="An admin will step in to review and help resolve this dispute."
        confirmLabel="Escalate"
        accentColor={Colors.warning}
        loading={escalate.isPending}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => escalate.mutate()}
      />
    </ScrollView>
  );
}

function makeStyles(typography: ReturnType<typeof useScaledTypography>) {
  return StyleSheet.create({
    scroll: { padding: Spacing.lg, paddingBottom: 60 },
    rowGap: { flexDirection: "row", gap: Spacing.xs, marginBottom: Spacing.sm },
    desc: { ...typography.body, color: Colors.textPrimary, marginBottom: Spacing.xs },
    meta: { ...typography.small, color: Colors.textMuted },
    sectionTitle: { ...typography.bodyMedium, color: Colors.textPrimary, marginBottom: Spacing.xs },
    noticeBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.xs,
      backgroundColor: Colors.warningBg,
      borderRadius: BorderRadius.md,
      padding: Spacing.sm,
      marginTop: Spacing.sm,
    },
    noticeText: { ...typography.caption, color: Colors.warning, flex: 1 },
    resolutionBox: {
      backgroundColor: Colors.surfaceLift,
      borderRadius: BorderRadius.md,
      padding: Spacing.sm,
      marginTop: Spacing.sm,
    },
    resolutionTitle: { ...typography.smallMedium, color: Colors.textPrimary },
    resolutionNote: { ...typography.small, color: Colors.textSecondary, marginTop: 2 },
    settlementText: { ...typography.smallMedium, color: Colors.textPrimary, marginBottom: Spacing.xs },
    proposeToggle: { flexDirection: "row", alignItems: "center", gap: Spacing.xs },
    proposeToggleText: { ...typography.smallMedium, fontWeight: "600" },
    input: {
      backgroundColor: Colors.surfaceLift,
      borderRadius: BorderRadius.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      color: Colors.textPrimary,
      ...typography.body,
    },
    payerChip: {
      flex: 1,
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: BorderRadius.full,
      paddingVertical: Spacing.xs,
      alignItems: "center",
    },
    payerChipText: { ...typography.caption, color: Colors.textSecondary, fontWeight: "600" },
    declineBtn: {
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: BorderRadius.md,
      paddingHorizontal: Spacing.lg,
      justifyContent: "center",
    },
    declineText: { ...typography.smallMedium, color: Colors.textSecondary },
    bubble: { maxWidth: "82%", borderRadius: BorderRadius.lg, padding: Spacing.sm },
    bubbleSender: { ...typography.caption, color: Colors.textMuted, fontWeight: "700", marginBottom: 2 },
    bubbleText: { ...typography.small, color: Colors.textPrimary },
    messageInputRow: {
      flexDirection: "row",
      gap: Spacing.xs,
      marginTop: Spacing.md,
      paddingTop: Spacing.sm,
      borderTopWidth: 1,
      borderTopColor: Colors.border,
      alignItems: "flex-end",
    },
    messageInput: {
      flex: 1,
      backgroundColor: Colors.surfaceLift,
      borderRadius: BorderRadius.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      color: Colors.textPrimary,
      ...typography.small,
      maxHeight: 100,
    },
    sendBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    escalateBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: Spacing.xs,
      marginTop: Spacing.lg,
      paddingVertical: Spacing.sm,
    },
    escalateText: { ...typography.small, color: Colors.warning, fontWeight: "600" },
  });
}
