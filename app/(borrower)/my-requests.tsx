import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius } from "../../src/theme";
import { Badge, Input, SkeletonList, InfoTip } from "../../src/components";
import { useMyApplicationsViewModel } from "../../src/viewmodels";
import type { LoanApplication, Guarantor } from "../../src/models";

const TABS = ["All", "Pending", "Funded", "Closed"] as const;
type Tab = (typeof TABS)[number];

const statusVariant: Record<string, "success" | "warning" | "danger" | "info" | "default"> = {
  awaiting_guarantors: "warning",
  pending: "warning",
  approved: "success",
  funded: "success",
  completed: "info",
  rejected: "danger",
  defaulted: "danger",
  expired: "default",
};

const statusLabel: Record<string, string> = {
  awaiting_guarantors: "Awaiting Guarantors",
  pending: "Pending",
  approved: "Approved",
  funded: "Funded",
  completed: "Completed",
  rejected: "Rejected",
  defaulted: "Defaulted",
  expired: "Expired",
};

function expiryNote(validUntil: string | null, status: string): string | null {
  if (!validUntil || status === "expired" || status === "funded" || status === "completed") return null;
  const diffMs = new Date(validUntil).getTime() - Date.now();
  if (diffMs <= 0) return null;
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return days <= 1 ? "Expires today" : `Expires in ${days} days`;
}

const guarantorVariant: Record<Guarantor["status"], "warning" | "success" | "danger"> = {
  pending: "warning",
  accepted: "success",
  declined: "danger",
};

function ReplaceForm({
  applicationId,
  guarantorId,
  onDone,
}: {
  applicationId: string;
  guarantorId: string;
  onDone: () => void;
}) {
  const { replaceGuarantorByContact, isReplacing } = useMyApplicationsViewModel();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const handleReplace = async () => {
    if (!email.trim() || !phone.trim()) return;
    try {
      await replaceGuarantorByContact(applicationId, guarantorId, email.trim(), phone.trim());
      Alert.alert("Replaced", "Waiting for the new guarantor to respond.");
      onDone();
    } catch (e) {
      Alert.alert("Failed", e instanceof Error ? e.message : "Please try again.");
    }
  };

  return (
    <View style={styles.replaceBox}>
      <Input label="New guarantor's email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <Input label="New guarantor's phone" value={phone} onChangeText={setPhone} prefix="+256" keyboardType="phone-pad" />
      <View style={styles.replaceActions}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onDone}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.replaceBtn}
          onPress={handleReplace}
          disabled={isReplacing || !email.trim() || !phone.trim()}
        >
          <Text style={styles.replaceText}>{isReplacing ? "Searching…" : "Replace"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function GuarantorRow({ applicationId, guarantor }: { applicationId: string; guarantor: Guarantor }) {
  const { remindGuarantor, isReminding } = useMyApplicationsViewModel();
  const [replacing, setReplacing] = useState(false);

  const handleRemind = async () => {
    try {
      await remindGuarantor(guarantor.id);
      Alert.alert("Reminder sent");
    } catch (e) {
      Alert.alert("Failed", e instanceof Error ? e.message : "Please try again.");
    }
  };

  return (
    <View style={{ marginBottom: Spacing.sm }}>
      <View style={styles.guarantorRow}>
        <Text style={styles.guarantorName}>{guarantor.fullName ?? guarantor.username}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.sm }}>
          <Badge label={guarantor.status} variant={guarantorVariant[guarantor.status]} />
          {guarantor.status === "pending" && (
            <TouchableOpacity onPress={handleRemind} disabled={isReminding}>
              <Text style={styles.actionLink}>Remind</Text>
            </TouchableOpacity>
          )}
          {guarantor.status === "declined" && !replacing && (
            <TouchableOpacity onPress={() => setReplacing(true)}>
              <Text style={styles.actionLink}>Replace</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      {replacing && (
        <ReplaceForm applicationId={applicationId} guarantorId={guarantor.id} onDone={() => setReplacing(false)} />
      )}
    </View>
  );
}

const EDIT_DURATIONS = [3, 6, 12, 18, 24];
const EDIT_LOAN_TYPES: { label: string; value: LoanApplication["loanType"] }[] = [
  { label: "Personal", value: "personal" },
  { label: "Business", value: "business" },
  { label: "Education", value: "education" },
  { label: "Agricultural", value: "agricultural" },
  { label: "Emergency", value: "emergency" },
];
const EDIT_EXPIRY_PRESETS: { label: string; days: number | null }[] = [
  { label: "3 days", days: 3 },
  { label: "1 week", days: 7 },
  { label: "2 weeks", days: 14 },
  { label: "1 month", days: 30 },
  { label: "No rush", days: null },
];

function EditApplicationForm({ app, onDone }: { app: LoanApplication; onDone: () => void }) {
  const { updateApplication, isUpdating } = useMyApplicationsViewModel();
  const [amount, setAmount] = useState(String(app.amount));
  const [duration, setDuration] = useState(app.duration);
  const [loanType, setLoanType] = useState(app.loanType);
  const [purpose, setPurpose] = useState(app.purpose ?? "");
  const [maxInterestRate, setMaxInterestRate] = useState(
    app.maxInterestRate != null ? String(app.maxInterestRate) : "",
  );
  const [validUntil, setValidUntil] = useState<string | null>(app.validUntil);

  const handleSave = async () => {
    try {
      await updateApplication({
        id: app.id,
        data: {
          amount: Number(amount),
          duration,
          loanType,
          // Explicit "" / null, not `undefined` — this is an edit, so a
          // cleared field must actually reach the backend as a clear.
          // `undefined` gets dropped before the request body is built,
          // which the backend's exclude_unset then reads as "unchanged".
          purpose,
          maxInterestRate: maxInterestRate ? Number(maxInterestRate) : null,
          validUntil,
        },
      });
      onDone();
    } catch (e) {
      Alert.alert("Failed to update", e instanceof Error ? e.message : "Please try again.");
    }
  };

  return (
    <View style={styles.editBox}>
      <Input label="Amount (UGX)" value={amount} onChangeText={setAmount} keyboardType="numeric" />

      <Text style={styles.editLabel}>Duration</Text>
      <View style={styles.pillRow}>
        {EDIT_DURATIONS.map((d) => (
          <TouchableOpacity
            key={d}
            style={[styles.pill, duration === d && styles.pillActive]}
            onPress={() => setDuration(d)}
          >
            <Text style={[styles.pillText, duration === d && styles.pillTextActive]}>{d} mo</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.editLabel}>Loan Type</Text>
      <View style={styles.pillRow}>
        {EDIT_LOAN_TYPES.map((t) => (
          <TouchableOpacity
            key={t.value}
            style={[styles.pill, loanType === t.value && styles.pillActive]}
            onPress={() => setLoanType(t.value)}
          >
            <Text style={[styles.pillText, loanType === t.value && styles.pillTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Input label="Purpose (optional)" value={purpose} onChangeText={setPurpose} />
      <Input
        label="Max Interest Rate (%/month, optional)"
        value={maxInterestRate}
        onChangeText={setMaxInterestRate}
        keyboardType="numeric"
      />

      <Text style={styles.editLabel}>Valid Until</Text>
      <View style={styles.pillRow}>
        {EDIT_EXPIRY_PRESETS.map((preset) => (
          <TouchableOpacity
            key={preset.label}
            style={styles.pill}
            onPress={() =>
              setValidUntil(
                preset.days === null ? null : new Date(Date.now() + preset.days * 24 * 60 * 60 * 1000).toISOString(),
              )
            }
          >
            <Text style={styles.pillText}>{preset.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.editHint}>
        {validUntil ? `Currently: ${new Date(validUntil).toLocaleDateString()}` : "Currently: no deadline"}
      </Text>

      <View style={styles.replaceActions}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onDone}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.replaceBtn} onPress={handleSave} disabled={isUpdating || !amount}>
          <Text style={styles.replaceText}>{isUpdating ? "Saving…" : "Save Changes"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ApplicationActions({ app }: { app: LoanApplication }) {
  const { deleteApplication, isDeleting, freezeApplication, isFreezing, unfreezeApplication, isUnfreezing } =
    useMyApplicationsViewModel();
  const [editing, setEditing] = useState(false);

  // A guarantor's acceptance covers the exact terms they saw — once one has
  // committed, editing is locked (matches the backend guard in
  // PUT /loans/applications/{id}), though freeze/withdraw stay available.
  const editLocked = (app.guarantors ?? []).some((g) => g.status === "accepted");

  const handleWithdraw = () => {
    Alert.alert("Withdraw this loan request?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Withdraw",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteApplication(app.id);
          } catch (e: any) {
            Alert.alert("Failed to withdraw", e?.message || "Please try again.");
          }
        },
      },
    ]);
  };

  const handleFreeze = async () => {
    try {
      await freezeApplication(app.id);
    } catch (e: any) {
      Alert.alert("Failed to freeze", e?.message || "Please try again.");
    }
  };

  const handleUnfreeze = async () => {
    try {
      await unfreezeApplication(app.id);
    } catch (e: any) {
      Alert.alert("Failed to unfreeze", e?.message || "Please try again.");
    }
  };

  if (editing) {
    return <EditApplicationForm app={app} onDone={() => setEditing(false)} />;
  }

  return (
    <View style={styles.actionsSection}>
      <View style={styles.actionsRow}>
        {!editLocked && (
          <TouchableOpacity style={styles.outlineBtn} onPress={() => setEditing(true)}>
            <Text style={styles.outlineBtnText}>Edit</Text>
          </TouchableOpacity>
        )}
        {app.isFrozen ? (
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleUnfreeze}
            disabled={isUnfreezing || app.frozenBy === "admin"}
          >
            <Text style={styles.primaryBtnText}>Unfreeze</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.outlineBtn} onPress={handleFreeze} disabled={isFreezing}>
            <Text style={styles.outlineBtnText}>Freeze</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.outlineBtnDanger} onPress={handleWithdraw} disabled={isDeleting}>
          <Text style={styles.outlineBtnDangerText}>Withdraw</Text>
        </TouchableOpacity>
      </View>
      {app.isFrozen && (
        <Text style={styles.frozenNote}>
          Frozen {app.frozenBy === "admin" ? "by an admin — only they can unfreeze it" : "by you"}
        </Text>
      )}
      {editLocked && (
        <Text style={styles.frozenNote}>
          A guarantor has already approved — editing is locked, but you can still freeze or withdraw.
        </Text>
      )}
    </View>
  );
}

function DiscardDraftLink({ applicationId }: { applicationId: string }) {
  const { deleteApplication, isDeleting } = useMyApplicationsViewModel();
  const handleDiscard = () => {
    Alert.alert("Discard this unfinished request?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Discard",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteApplication(applicationId);
          } catch (e: any) {
            Alert.alert("Failed to discard", e?.message || "Please try again.");
          }
        },
      },
    ]);
  };
  return (
    <TouchableOpacity onPress={handleDiscard} disabled={isDeleting} style={{ marginTop: Spacing.sm }}>
      <Text style={styles.discardDraftText}>Discard draft</Text>
    </TouchableOpacity>
  );
}

function ApplicationCard({ app }: { app: LoanApplication }) {
  const router = useRouter();

  // The apply wizard now creates the real application at step 1 and only
  // attaches guarantors at the very end — so a request that's
  // "awaiting_guarantors" with literally none attached yet isn't waiting
  // on anyone, it's just an unfinished wizard session. Shown distinctly so
  // it doesn't look like a broken submitted request with no guarantors.
  const isDraft = app.status === "awaiting_guarantors" && (!app.guarantors || app.guarantors.length === 0);

  if (isDraft) {
    return (
      <View style={[styles.card, styles.draftCard]}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.amount}>UGX {app.amount.toLocaleString()}</Text>
            <Text style={styles.subInfo}>{app.loanType} · {app.duration} months</Text>
            <Text style={styles.draftNote}>Not yet submitted.</Text>
          </View>
          <Badge label="Draft" variant="default" />
        </View>
        <TouchableOpacity
          style={styles.viewOffersBtn}
          onPress={() => router.push("/(borrower)/apply")}
        >
          <Text style={styles.viewOffersText}>Continue Application</Text>
        </TouchableOpacity>
        <DiscardDraftLink applicationId={app.id} />
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.amount}>UGX {app.amount.toLocaleString()}</Text>
          <Text style={styles.subInfo}>
            {app.loanType} · {app.duration} months
            {expiryNote(app.validUntil, app.status) ? ` · ${expiryNote(app.validUntil, app.status)}` : ""}
          </Text>
        </View>
        <Badge label={statusLabel[app.status] ?? app.status} variant={statusVariant[app.status] ?? "default"} />
      </View>

      {app.status === "awaiting_guarantors" && (
        <>
          <Text style={styles.awaitingNote}>
            Waiting on your guarantors to approve before lenders can see this request.
          </Text>
          {app.guarantors && app.guarantors.length > 0 && (
            <View style={styles.guarantorSection}>
              {app.guarantors.map((g) => (
                <GuarantorRow key={g.id} applicationId={app.id} guarantor={g} />
              ))}
            </View>
          )}
        </>
      )}

      {app.status === "pending" && (
        <TouchableOpacity
          style={styles.viewOffersBtn}
          onPress={() => router.push("/(borrower)/offers")}
        >
          <Text style={styles.viewOffersText}>View Offers</Text>
        </TouchableOpacity>
      )}

      {(app.status === "awaiting_guarantors" || app.status === "pending") && (
        <ApplicationActions app={app} />
      )}
    </View>
  );
}

export default function MyRequestsScreen() {
  const router = useRouter();
  const { applications, isLoading } = useMyApplicationsViewModel();
  const [activeTab, setActiveTab] = useState<Tab>("All");

  const filtered = useMemo(() => {
    if (activeTab === "All") return applications;
    if (activeTab === "Pending") return applications.filter((a) => a.status === "pending" || a.status === "awaiting_guarantors");
    if (activeTab === "Funded") return applications.filter((a) => a.status === "funded");
    return applications.filter((a) => ["completed", "rejected", "defaulted", "expired"].includes(a.status));
  }, [applications, activeTab]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Requests</Text>
        <TouchableOpacity onPress={() => router.push("/(borrower)/apply")}>
          <Ionicons name="add" size={26} color={Colors.teal} />
        </TouchableOpacity>
      </View>

      <View style={styles.flowNoteRow}>
        <Text style={styles.flowNoteText}>Awaiting Guarantors → Pending → Funded</Text>
        <InfoTip text="Awaiting Guarantors: waiting on your 2 chosen guarantors to approve. Pending: both approved, visible to lenders. Funded: you accepted an offer. You can freeze or withdraw a request any time before it's funded — editing is only possible until a guarantor actually approves, since their approval covers the exact terms they saw." />
      </View>

      <View style={styles.tabsRow}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, activeTab === t && styles.tabActive]}
            onPress={() => setActiveTab(t)}
          >
            <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {isLoading ? (
          <SkeletonList count={3} cardHeight={130} />
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No loan requests here yet.</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push("/(borrower)/apply")}>
              <Text style={styles.emptyBtnText}>New Loan Request</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filtered.map((app) => <ApplicationCard key={app.id} app={app} />)
        )}
      </ScrollView>
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
  headerTitle: { ...Typography.h3, color: Colors.white },
  flowNoteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  flowNoteText: { ...Typography.small, color: Colors.textMuted },
  tabsRow: { flexDirection: "row", gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  tab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabActive: { backgroundColor: Colors.teal + "25", borderColor: Colors.teal },
  tabText: { ...Typography.smallMedium, color: Colors.textSecondary },
  tabTextActive: { color: Colors.teal },
  scroll: { padding: Spacing.lg, paddingBottom: 40 },
  empty: { alignItems: "center", paddingVertical: Spacing.xxl, gap: Spacing.md },
  emptyText: { ...Typography.body, color: Colors.textMuted },
  emptyBtn: { backgroundColor: Colors.teal, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full },
  emptyBtnText: { ...Typography.smallMedium, color: Colors.white },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  amount: { ...Typography.h4, color: Colors.textPrimary },
  subInfo: { ...Typography.small, color: Colors.textMuted, marginTop: 2, textTransform: "capitalize" },
  awaitingNote: { ...Typography.caption, color: Colors.warning, marginTop: Spacing.sm },
  draftCard: { borderWidth: 1, borderColor: Colors.border, borderStyle: "dashed" },
  draftNote: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
  discardDraftText: { ...Typography.caption, color: Colors.textMuted, textAlign: "center" },
  guarantorSection: { marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border },
  guarantorRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  guarantorName: { ...Typography.small, color: Colors.textPrimary },
  actionLink: { ...Typography.caption, fontWeight: "600", color: Colors.teal },
  replaceBox: { marginTop: Spacing.sm, gap: Spacing.sm },
  replaceActions: { flexDirection: "row", gap: Spacing.sm },
  cancelBtn: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  cancelText: { ...Typography.caption, color: Colors.textSecondary },
  replaceBtn: {
    backgroundColor: Colors.teal,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  replaceText: { ...Typography.caption, fontWeight: "600", color: Colors.white },
  viewOffersBtn: {
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.teal,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.sm,
    alignItems: "center",
  },
  viewOffersText: { ...Typography.buttonSmall, color: Colors.teal },
  actionsSection: { marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border, gap: Spacing.sm },
  actionsRow: { flexDirection: "row", gap: Spacing.sm, flexWrap: "wrap" },
  outlineBtn: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  outlineBtnText: { ...Typography.smallMedium, color: Colors.textSecondary },
  outlineBtnDanger: {
    borderWidth: 1,
    borderColor: Colors.danger,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  outlineBtnDangerText: { ...Typography.smallMedium, color: Colors.danger },
  primaryBtn: {
    backgroundColor: Colors.teal,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  primaryBtnText: { ...Typography.smallMedium, color: Colors.white },
  frozenNote: { ...Typography.caption, color: Colors.textMuted },
  editBox: { marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border, gap: Spacing.sm },
  editLabel: { ...Typography.caption, color: Colors.textMuted, marginTop: Spacing.xs },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.xs },
  pill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pillActive: { backgroundColor: Colors.teal + "25", borderColor: Colors.teal },
  pillText: { ...Typography.caption, color: Colors.textSecondary },
  pillTextActive: { color: Colors.teal, fontWeight: "600" },
  editHint: { ...Typography.caption, color: Colors.textMuted },
});
