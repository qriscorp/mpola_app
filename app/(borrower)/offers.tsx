import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadow,
} from "../../src/theme";
import { Button, Badge } from "../../src/components";
import { useOffersViewModel } from "../../src/viewmodels";

export default function OffersScreen() {
  const router = useRouter();
  const { offers, acceptOffer } = useOffersViewModel();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Offers Received</Text>
        <View style={{ width: 24 }} />
      </View>

      <Text style={styles.subtitle}>
        {offers.length} lenders have responded
      </Text>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {offers.map((offer) => (
          <View
            key={offer.id}
            style={[styles.offerCard, offer.bestRate && styles.offerCardBest]}
          >
            <View style={styles.offerHeader}>
              <Text style={styles.offerName}>{offer.lenderName}</Text>
              <View style={styles.badges}>
                {offer.bestRate && <Badge label="★ Best Rate" variant="gold" />}
                {offer.recommended && (
                  <Badge label="Recommended" variant="success" />
                )}
                {offer.expiresIn === "24h" && (
                  <Badge label="Expires Soon" variant="danger" />
                )}
              </View>
            </View>

            <View style={styles.offerDetails}>
              <View style={styles.offerDetail}>
                <Text style={styles.detailLabel}>Monthly</Text>
                <Text style={styles.detailValue}>
                  UGX {offer.monthlyPayment.toLocaleString()}
                </Text>
              </View>
              <View style={styles.offerDetail}>
                <Text style={styles.detailLabel}>Rate</Text>
                <Text style={styles.detailValue}>{offer.interestRate}%/mo</Text>
              </View>
              {offer.expiresIn && (
                <View style={styles.offerDetail}>
                  <Text style={styles.detailLabel}>Expires</Text>
                  <Text style={styles.detailValue}>{offer.expiresIn}</Text>
                </View>
              )}
            </View>

            {offer.bestRate ? (
              <Button
                title="Accept This Offer ✓"
                onPress={async () => {
                  await acceptOffer(offer.id);
                  router.push("/(borrower)/loan-approved");
                }}
                color={Colors.gold}
                style={{ marginTop: Spacing.md }}
              />
            ) : (
              <View style={styles.offerActions}>
                <TouchableOpacity style={styles.compareBtn}>
                  <Text style={styles.compareBtnText}>Compare</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.viewBtn}>
                  <Text style={styles.viewBtnText}>View Details</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
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
    backgroundColor: Colors.white,
  },
  headerTitle: { ...Typography.h3, color: Colors.textPrimary },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  scroll: { padding: Spacing.lg, paddingBottom: 40 },
  offerCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  offerCardBest: { borderColor: Colors.gold },
  offerHeader: { marginBottom: Spacing.md },
  offerName: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  badges: { flexDirection: "row", gap: Spacing.xs },
  offerDetails: { flexDirection: "row", gap: Spacing.lg },
  offerDetail: {},
  detailLabel: { ...Typography.caption, color: Colors.textMuted },
  detailValue: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  offerActions: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  compareBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  compareBtnText: { ...Typography.buttonSmall, color: Colors.textSecondary },
  viewBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.tealLight,
    alignItems: "center",
  },
  viewBtnText: { ...Typography.buttonSmall, color: Colors.tealDark },
});
