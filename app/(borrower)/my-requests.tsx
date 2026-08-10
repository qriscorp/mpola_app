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
import { Badge, Input, SkeletonList } from "../../src/components";
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
};

const statusLabel: Record<string, string> = {
  awaiting_guarantors: "Awaiting Guarantors",
  pending: "Pending",
  approved: "Approved",
  funded: "Funded",
  completed: "Completed",
  rejected: "Rejected",
  defaulted: "Defaulted",
};

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

function ApplicationCard({ app }: { app: LoanApplication }) {
  const router = useRouter();
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.amount}>UGX {app.amount.toLocaleString()}</Text>
          <Text style={styles.subInfo}>
            {app.loanType} · {app.duration} months
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
    return applications.filter((a) => ["completed", "rejected", "defaulted"].includes(a.status));
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
});
