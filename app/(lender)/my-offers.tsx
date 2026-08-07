import React from "react";
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
import { Badge, SkeletonList } from "../../src/components";
import { useMyOfferTemplatesViewModel } from "../../src/viewmodels";
import type { OfferTemplate } from "../../src/models";

const statusVariant: Record<OfferTemplate["status"], "warning" | "default" | "success" | "danger"> = {
  pending_review: "warning",
  draft: "default",
  approved: "success",
  rejected: "danger",
};

const statusLabel: Record<OfferTemplate["status"], string> = {
  pending_review: "Pending Review",
  draft: "Draft",
  approved: "Approved",
  rejected: "Rejected",
};

export default function MyOffersScreen() {
  const router = useRouter();
  const {
    templates,
    isLoading,
    deleteTemplate,
    freezeTemplate,
    unfreezeTemplate,
    isMutating,
  } = useMyOfferTemplatesViewModel();

  const handleDelete = (t: OfferTemplate) => {
    Alert.alert(
      "Delete this offer?",
      "This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteTemplate(t.id);
            } catch (e: any) {
              Alert.alert("Failed to delete", e?.message || "Please try again.");
            }
          },
        },
      ],
    );
  };

  const handleFreeze = async (t: OfferTemplate) => {
    try {
      await freezeTemplate(t.id);
    } catch (e: any) {
      Alert.alert("Failed to freeze", e?.message || "Please try again.");
    }
  };

  const handleUnfreeze = async (t: OfferTemplate) => {
    try {
      await unfreezeTemplate(t.id);
    } catch (e: any) {
      Alert.alert("Failed to unfreeze", e?.message || "Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Standing Offers</Text>
        <TouchableOpacity onPress={() => router.push("/(lender)/post-offer")}>
          <Ionicons name="add" size={26} color={Colors.gold} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {isLoading ? (
          <SkeletonList count={3} cardHeight={130} />
        ) : templates.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              You haven&apos;t posted any standing offers yet.
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => router.push("/(lender)/post-offer")}
            >
              <Text style={styles.emptyBtnText}>Post an Offer</Text>
            </TouchableOpacity>
          </View>
        ) : (
          templates.map((t) => (
            <View key={t.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.amount}>
                    UGX {t.minAmount.toLocaleString()} – {t.maxAmount.toLocaleString()}
                  </Text>
                  <Text style={styles.rate}>
                    {t.interestRate}%/month · Max {t.maxDuration} months
                  </Text>
                  <Text style={styles.types}>
                    {t.acceptedLoanTypes.join(", ") || "Any loan type"}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end", gap: Spacing.xs }}>
                  <Badge label={statusLabel[t.status]} variant={statusVariant[t.status]} />
                  {t.isFrozen && (
                    <Badge
                      label={`Frozen (${t.frozenBy === "admin" ? "admin" : "you"})`}
                      variant="info"
                    />
                  )}
                </View>
              </View>

              {t.status === "pending_review" && (
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.outlineBtn}
                    onPress={() =>
                      router.push({
                        pathname: "/(lender)/post-offer",
                        params: { editId: t.id },
                      })
                    }
                  >
                    <Text style={styles.outlineBtnText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.outlineBtn}
                    disabled={isMutating}
                    onPress={() => handleDelete(t)}
                  >
                    <Text style={[styles.outlineBtnText, { color: Colors.danger }]}>
                      Delete
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {t.status === "approved" && (
                <View style={styles.actionRow}>
                  {t.isFrozen ? (
                    <TouchableOpacity
                      style={[styles.outlineBtn, styles.goldBtn]}
                      disabled={isMutating || t.frozenBy === "admin"}
                      onPress={() => handleUnfreeze(t)}
                    >
                      <Text style={styles.goldBtnText}>
                        {t.frozenBy === "admin" ? "Frozen by admin" : "Unfreeze"}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.outlineBtn}
                      disabled={isMutating}
                      onPress={() => handleFreeze(t)}
                    >
                      <Text style={styles.outlineBtnText}>Freeze</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          ))
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
  scroll: { padding: Spacing.lg, paddingBottom: 40 },
  empty: { alignItems: "center", paddingVertical: Spacing.xxl, gap: Spacing.md },
  emptyText: { ...Typography.body, color: Colors.textMuted, textAlign: "center" },
  emptyBtn: {
    backgroundColor: Colors.gold,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  emptyBtnText: { ...Typography.smallMedium, color: Colors.white },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.gold,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between" },
  amount: { ...Typography.h4, color: Colors.textPrimary },
  rate: { ...Typography.small, color: Colors.gold, marginTop: 2 },
  types: {
    ...Typography.small,
    color: Colors.textMuted,
    marginTop: 4,
    textTransform: "capitalize",
  },
  actionRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  outlineBtn: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  outlineBtnText: { ...Typography.smallMedium, color: Colors.textSecondary },
  goldBtn: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  goldBtnText: { ...Typography.smallMedium, color: Colors.white },
});
