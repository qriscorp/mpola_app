import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius } from "../../src/theme";
import { Button, Card, SkeletonCard, RequiredDocumentsChecklist } from "../../src/components";
import { useOffersViewModel } from "../../src/viewmodels";
import { fetchBorrowerWallet, fetchProfile } from "../../src/services";
import { formatDuration } from "../../src/services/duration";

// Matches mpola_api's REQUIRED_ACCEPTED_GUARANTORS (routers/loans.py).
const REQUIRED_ACCEPTED_GUARANTORS = 2;

const TERMS = [
  "I have read and understood the full loan agreement terms.",
  "I agree to make all scheduled repayments on time.",
  "I understand that late payments may incur penalty fees.",
  "I authorise the lender to disburse funds to my Mpola wallet.",
  "I confirm that all information provided is accurate and truthful.",
];

export default function SignAgreementScreen() {
  const router = useRouter();
  const { offerId, applicationId } = useLocalSearchParams<{
    offerId: string;
    applicationId: string;
  }>();

  const {
    application,
    offers,
    isLoading,
    respondToOffer,
    responding,
    uploadRequiredDocument,
    uploadingDocumentType,
    uploadCustomDocument,
    saveCustomDocumentText,
    uploadingCustomLabel,
  } = useOffersViewModel(applicationId);
  const { data: wallet } = useQuery({ queryKey: ["borrower", "wallet"], queryFn: fetchBorrowerWallet });
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: fetchProfile });

  const [accepted, setAccepted] = useState<boolean[]>(Array(TERMS.length).fill(false));
  const [signed, setSigned] = useState(false);
  const [note, setNote] = useState("");

  const offer = offers.find((o) => o.id === offerId);
  const allAccepted = accepted.every(Boolean);
  const acceptedGuarantors = (application?.guarantors ?? []).filter((g) => g.status === "accepted").length;
  const guarantorsReady = acceptedGuarantors >= REQUIRED_ACCEPTED_GUARANTORS;
  const walletReady = wallet?.isWalletSetup ?? false;
  const documentsReady = (offer?.requiredDocumentsStatus ?? []).every((d) => d.satisfied);

  const toggleTerm = (i: number) => {
    setAccepted((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
  };

  const handleSign = async () => {
    if (!offer) return;
    try {
      await respondToOffer(offer.id, "accepted", note.trim() || undefined);
      setSigned(true);
      router.replace({
        pathname: "/(borrower)/loan-approved",
        params: {
          lenderName: offer.lenderName ?? "Lender",
          amount: String(offer.amount),
          interestRate: String(offer.interestRate),
          totalRepayable: String(offer.totalRepayable ?? 0),
        },
      });
    } catch (e) {
      Alert.alert("Failed to sign agreement", e instanceof Error ? e.message : "Please try again.");
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.scroll}>
          <SkeletonCard height={400} />
        </View>
      </SafeAreaView>
    );
  }

  if (!offer) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Offer not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Loan Agreement</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Offer Summary */}
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Loan Offer Summary</Text>
          <Text style={styles.summarySub}>{offer.lenderName ?? "Lender"}</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCell}>
              <Text style={styles.summaryLabel}>Loan Amount</Text>
              <Text style={styles.summaryValue}>UGX {offer.amount.toLocaleString()}</Text>
            </View>
            <View style={styles.summaryCell}>
              <Text style={styles.summaryLabel}>Interest Rate</Text>
              <Text style={[styles.summaryValue, { color: Colors.teal }]}>{offer.interestRate}%/month</Text>
            </View>
            <View style={styles.summaryCell}>
              <Text style={styles.summaryLabel}>Duration</Text>
              <Text style={styles.summaryValue}>{formatDuration(offer.duration, offer.durationDays)}</Text>
            </View>
            <View style={styles.summaryCell}>
              <Text style={styles.summaryLabel}>
                {offer.durationDays != null ? "Repayment Due" : "Monthly Payment"}
              </Text>
              <Text style={styles.summaryValue}>UGX {(offer.monthlyPayment ?? 0).toLocaleString()}</Text>
            </View>
          </View>
        </Card>

        {/* Documents */}
        {offer.requiredDocumentsStatus.length > 0 && (
          <Card style={styles.docsCard}>
            <Text style={styles.cardTitle}>Documents This Lender Requires</Text>
            <Text style={styles.cardSubtitle}>
              Provide these before signing — already-uploaded ones (KYC or from a past offer) count automatically.
            </Text>
            <View style={{ marginTop: Spacing.md }}>
              <RequiredDocumentsChecklist
                items={offer.requiredDocumentsStatus}
                onUpload={uploadRequiredDocument}
                uploadingType={uploadingDocumentType}
                onUploadCustom={uploadCustomDocument}
                onSaveCustomText={saveCustomDocumentText}
                uploadingCustomLabel={uploadingCustomLabel}
                onGoToProfile={() => router.push("/(borrower)/profile")}
              />
            </View>
          </Card>
        )}

        {/* Agreement Terms */}
        <Card style={styles.termsCard}>
          <Text style={styles.cardTitle}>Agreement Terms</Text>
          <ScrollView style={styles.agreementBox} nestedScrollEnabled>
            <Text style={styles.agreementHeading}>LOAN AGREEMENT</Text>
            <Text style={styles.agreementText}>
              This Loan Agreement ("Agreement") is entered into between {offer.lenderName ?? "the Lender"}{" "}
              ("Lender") and {profile?.fullName ?? "the Borrower"} ("Borrower") through the Mpola
              platform.
            </Text>
            <Text style={styles.agreementSubheading}>1. Loan Terms</Text>
            <Text style={styles.agreementText}>
              The Lender agrees to provide a loan of UGX {offer.amount.toLocaleString()} at a rate of{" "}
              {offer.interestRate}%/month,{" "}
              {offer.durationDays != null
                ? `repayable in one payment of UGX ${(offer.monthlyPayment ?? 0).toLocaleString()} due ${offer.durationDays} day${offer.durationDays === 1 ? "" : "s"} after disbursement.`
                : `repayable over ${offer.duration} monthly instalments of UGX ${(offer.monthlyPayment ?? 0).toLocaleString()} each.`}
            </Text>
            <Text style={styles.agreementSubheading}>2. Repayment Schedule</Text>
            <Text style={styles.agreementText}>
              {offer.durationDays != null
                ? "Payment is due in full on the date above. Late payment may incur penalties per Mpola's platform terms."
                : "Payments are due monthly from the disbursement date. Late payments may incur penalties per Mpola's platform terms."}
            </Text>
            <Text style={styles.agreementSubheading}>3. Disbursement</Text>
            <Text style={styles.agreementText}>
              Funds are transferred wallet-to-wallet. Once you accept, the Lender is notified to approve and
              release the full UGX {offer.amount.toLocaleString()} — typically fast, but not instant.
            </Text>
            <Text style={styles.agreementSubheading}>4. Early Repayment</Text>
            <Text style={styles.agreementText}>
              The Borrower may repay the loan early without penalty. Interest is only charged on the period the
              loan was active.
            </Text>
          </ScrollView>

          <View style={{ marginTop: Spacing.md, gap: Spacing.sm }}>
            {TERMS.map((term, i) => (
              <TouchableOpacity
                key={i}
                style={styles.termRow}
                onPress={() => toggleTerm(i)}
                disabled={signed}
              >
                <View style={[styles.checkbox, accepted[i] && styles.checkboxActive]}>
                  {accepted[i] && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.termText}>{term}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Signature */}
        <Card style={styles.signatureCard}>
          <View style={styles.signatureHeader}>
            <Ionicons name="create-outline" size={18} color={Colors.teal} />
            <Text style={styles.cardTitle}>Digital Signature</Text>
          </View>

          {signed ? (
            <View style={styles.signedBox}>
              <Ionicons name="checkmark-circle" size={36} color={Colors.teal} />
              <Text style={styles.signedText}>Agreement Signed</Text>
              <Text style={styles.signedName}>{profile?.fullName ?? ""}</Text>
            </View>
          ) : (
            <View style={styles.unsignedBox}>
              <Ionicons name="create-outline" size={28} color={Colors.textMuted} />
              <Text style={styles.unsignedText}>Accept all terms above to sign</Text>
            </View>
          )}

          {!guarantorsReady && (
            <Text style={styles.warningText}>
              Needs {REQUIRED_ACCEPTED_GUARANTORS} confirmed guarantors before this can be signed —{" "}
              {acceptedGuarantors} of {application?.guarantors?.length ?? 0} confirmed so far.
            </Text>
          )}
          {!walletReady && (
            <Text style={styles.warningText}>
              Set up your Mpola wallet before signing — that's where the disbursed funds will land.
            </Text>
          )}
          {!documentsReady && (
            <Text style={styles.warningText}>
              Provide the documents this lender requires (above) before signing.
            </Text>
          )}

          {!signed && (
            <View style={{ marginTop: Spacing.md }}>
              <Text style={styles.noteLabel}>Note for the lender (optional)</Text>
              <TextInput
                multiline
                numberOfLines={3}
                value={note}
                onChangeText={setNote}
                placeholder="Anything worth flagging before they approve disbursement..."
                placeholderTextColor={Colors.textMuted}
                style={styles.noteInput}
              />
            </View>
          )}

          <Button
            title={responding ? "Signing…" : "Sign Agreement"}
            onPress={handleSign}
            color={Colors.teal}
            loading={responding}
            disabled={!allAccepted || !guarantorsReady || !walletReady || !documentsReady || responding}
            style={{ marginTop: Spacing.md }}
          />
        </Card>
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
  scroll: { padding: Spacing.lg, paddingBottom: 40, gap: Spacing.md },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { ...Typography.body, color: Colors.textMuted },
  summaryCard: { gap: 2 },
  summaryTitle: { ...Typography.h4, color: Colors.textPrimary },
  summarySub: { ...Typography.small, color: Colors.textMuted, marginBottom: Spacing.md },
  summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.lg },
  summaryCell: { width: "40%" },
  summaryLabel: { ...Typography.caption, color: Colors.textMuted },
  summaryValue: { ...Typography.bodyMedium, color: Colors.textPrimary, marginTop: 2 },
  docsCard: {},
  cardTitle: { ...Typography.h4, color: Colors.textPrimary },
  cardSubtitle: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
  termsCard: {},
  agreementBox: {
    maxHeight: 180,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  agreementHeading: { ...Typography.smallMedium, color: Colors.textPrimary, marginBottom: Spacing.xs },
  agreementSubheading: { ...Typography.smallMedium, color: Colors.textPrimary, marginTop: Spacing.sm },
  agreementText: { ...Typography.caption, color: Colors.textMuted, marginTop: 4, lineHeight: 18 },
  termRow: { flexDirection: "row", alignItems: "flex-start", gap: Spacing.sm },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  checkboxActive: { backgroundColor: Colors.teal, borderColor: Colors.teal },
  checkmark: { color: Colors.white, fontSize: 12, fontWeight: "700" },
  termText: { ...Typography.small, color: Colors.textSecondary, flex: 1 },
  signatureCard: {},
  signatureHeader: { flexDirection: "row", alignItems: "center", gap: Spacing.xs, marginBottom: Spacing.md },
  signedBox: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.teal + "15",
    borderWidth: 2,
    borderColor: Colors.teal,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.xl,
    gap: Spacing.xs,
  },
  signedText: { ...Typography.smallMedium, color: Colors.teal },
  signedName: { ...Typography.h4, color: Colors.textPrimary, fontStyle: "italic", marginTop: Spacing.xs },
  unsignedBox: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.xl,
    gap: Spacing.xs,
  },
  unsignedText: { ...Typography.small, color: Colors.textMuted },
  noteLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  noteInput: {
    ...Typography.small,
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 70,
    textAlignVertical: "top",
  },
  warningText: {
    ...Typography.caption,
    color: Colors.warning,
    backgroundColor: Colors.warningBg,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginTop: Spacing.sm,
  },
});
