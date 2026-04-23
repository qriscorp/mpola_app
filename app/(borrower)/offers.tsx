import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius } from "../../src/theme";
import { useOffersViewModel } from "../../src/viewmodels";

const FILTERS = ["All", "Under 5%", "Business", "Emergency"];

export default function OffersScreen() {
  const router = useRouter();
  const { offers, acceptOffer } = useOffersViewModel();
  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoBox}>
          <Text style={styles.logoLetter}>L</Text>
        </View>
        <Text style={styles.headerTitle}>Browse Offers</Text>
        <Text style={styles.liveCount}>{offers.length} live</Text>
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Ionicons
          name="search-outline"
          size={16}
          color={Colors.textMuted}
          style={{ marginRight: Spacing.xs }}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by amount, type..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll}
        contentContainerStyle={styles.filtersRow}
      >
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterChip,
              activeFilter === f && styles.filterChipActive,
            ]}
            onPress={() => setActiveFilter(f)}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === f && styles.filterTextActive,
              ]}
            >
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {offers.map((offer, i) => (
          <View
            key={offer.id}
            style={[styles.offerCard, i === 0 && styles.offerCardFeatured]}
          >
            {i === 0 && (
              <View style={styles.bestRateBadge}>
                <Text style={styles.bestRateText}>Best Rate</Text>
              </View>
            )}
            <View style={styles.offerTop}>
              <View style={styles.offerAvatar}>
                <Text style={styles.offerAvatarText}>
                  {(offer.lenderName ?? "?")[0].toUpperCase()}
                </Text>
              </View>
              <View style={styles.offerInfo}>
                <Text style={styles.offerName}>{offer.lenderName}</Text>
                <Text style={styles.offerSub}>
                  Verified · {offer.loansIssued ?? "0"} loans
                </Text>
              </View>
              <Text style={styles.offerRate}>{offer.interestRate}%/mo</Text>
            </View>
            <Text style={styles.offerDetails}>
              UGX {(offer.minAmount ?? 0).toLocaleString()}–
              {(offer.maxAmount ?? 0).toLocaleString()} · Max{" "}
              {offer.maxDuration ?? "—"} · {offer.loanTypes ?? ""}
            </Text>
            <TouchableOpacity
              style={[
                styles.applyBtn,
                i === 0 ? styles.applyBtnFilled : styles.applyBtnOutline,
              ]}
              onPress={() => {
                acceptOffer(offer.id).then(() => {
                  router.push("/(borrower)/loan-approved");
                });
              }}
            >
              <Text
                style={[
                  styles.applyBtnText,
                  i !== 0 && styles.applyBtnTextOutline,
                ]}
              >
                Apply Now
              </Text>
            </TouchableOpacity>
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  logoBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: Colors.teal,
    alignItems: "center",
    justifyContent: "center",
  },
  logoLetter: { fontSize: 16, fontWeight: "700", color: Colors.white },
  headerTitle: { ...Typography.h3, color: Colors.white, flex: 1 },
  liveCount: { ...Typography.bodyMedium, color: Colors.teal },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: { flex: 1, color: Colors.textPrimary, ...Typography.body },
  filtersScroll: { marginBottom: Spacing.md },
  filtersRow: { paddingHorizontal: Spacing.lg, gap: Spacing.sm },
  filterChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.teal + "30",
    borderColor: Colors.teal,
  },
  filterText: { ...Typography.bodyMedium, color: Colors.textSecondary },
  filterTextActive: { color: Colors.teal },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: 40 },
  offerCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.teal,
  },
  offerCardFeatured: { borderLeftWidth: 0 },
  bestRateBadge: {
    backgroundColor: Colors.teal + "30",
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.sm,
  },
  bestRateText: {
    ...Typography.caption,
    color: Colors.teal,
    fontWeight: "600",
  },
  offerTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  offerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.navy,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  offerAvatarText: { ...Typography.h4, color: Colors.white },
  offerInfo: { flex: 1 },
  offerName: { ...Typography.bodyMedium, color: Colors.textPrimary },
  offerSub: { ...Typography.small, color: Colors.textMuted },
  offerRate: { fontSize: 18, fontWeight: "700", color: Colors.textSecondary },
  offerDetails: {
    ...Typography.small,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },
  applyBtn: {
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.sm,
    alignItems: "center",
  },
  applyBtnFilled: { backgroundColor: Colors.teal },
  applyBtnOutline: { borderWidth: 1, borderColor: Colors.teal },
  applyBtnText: { ...Typography.buttonSmall, color: Colors.white },
  applyBtnTextOutline: { color: Colors.teal },
});
