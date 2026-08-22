import React, { useMemo } from "react";
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
import { Colors, Spacing, BorderRadius, useScaledTypography } from "../../src/theme";
import { SkeletonList, InfoTip } from "../../src/components";
import { useBrowseOffersViewModel } from "../../src/viewmodels";
import { formatDuration } from "../../src/services/duration";

function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/** Individual lenders' standing offers, browsable for confidence before
 * applying — distinct from (borrower)/offers.tsx, which lists offers
 * already received on your own applications. Tapping a card opens
 * browse-offer-detail.tsx; applying from there pre-fills the Apply tab but
 * still broadcasts to every qualifying lender, same as always. */
export default function BrowseOffersScreen() {
  const router = useRouter();
  const { search, setSearch, rate, setRate, rateBands, offers, total, isLoading } =
    useBrowseOffersViewModel();
  const typography = useScaledTypography();
  const styles = useMemo(() => makeStyles(typography), [typography]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityLabel="Go back"
          accessibilityRole="button"
          style={{ marginBottom: Spacing.sm }}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Browse Lender Offers</Text>
          <InfoTip text="Applying still goes out to every qualifying lender, not just the one you browse here — this is just for confidence before you post your request." />
        </View>
        <Text style={styles.subtitle}>{total} lender offers</Text>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by lender, loan type..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        contentContainerStyle={{ gap: Spacing.sm }}
      >
        {rateBands.map((b) => (
          <TouchableOpacity
            key={b.key}
            style={[styles.chip, rate === b.key && styles.chipActive]}
            onPress={() => setRate(b.key)}
          >
            <Text style={[styles.chipText, rate === b.key && styles.chipTextActive]}>
              {b.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isLoading ? (
        <View style={styles.scroll}>
          <SkeletonList count={4} cardHeight={130} />
        </View>
      ) : offers.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No lender offers match right now — check back soon.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {offers.map((offer) => (
            <TouchableOpacity
              key={offer.id}
              style={styles.offerCard}
              onPress={() =>
                router.push({
                  pathname: "/(borrower)/browse-offer-detail",
                  params: { templateId: offer.id },
                })
              }
            >
              <View style={styles.cardTop}>
                <View style={styles.avatarWrap}>
                  <Text style={styles.avatarText}>{initials(offer.lenderName)}</Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.lenderName}>{offer.lenderName}</Text>
                  <Text style={styles.lenderMeta}>
                    {offer.loanTypes.join(" · ") || "Multiple loan types"}
                    {offer.city ? ` · ${offer.city}` : ""}
                  </Text>
                </View>
                <Text style={styles.rate}>{offer.interestRate}%/mo</Text>
              </View>
              <Text style={styles.amountRange}>
                UGX {offer.minAmount.toLocaleString()}–{offer.maxAmount.toLocaleString()} ·{" "}
                {formatDuration(offer.maxDuration, offer.maxDurationDays)}
              </Text>
              <View style={styles.cardFooterRow}>
                <Text style={styles.appCount}>{offer.offerCount} applications so far</Text>
                <Text style={styles.tapHint}>View offer →</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function makeStyles(typography: ReturnType<typeof useScaledTypography>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
    titleRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
    title: { ...typography.h2, color: Colors.white },
    subtitle: { ...typography.body, color: Colors.textSecondary, marginTop: 2 },
    searchRow: { paddingHorizontal: Spacing.lg, marginTop: Spacing.lg },
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: Colors.surface,
      borderRadius: BorderRadius.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      gap: Spacing.sm,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    searchInput: { flex: 1, ...typography.body, color: Colors.textPrimary, padding: 0 },
    filterRow: {
      paddingHorizontal: Spacing.lg,
      marginTop: Spacing.md,
      marginBottom: Spacing.sm,
      flexGrow: 0,
    },
    chip: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    chipActive: { backgroundColor: Colors.teal, borderColor: Colors.teal },
    chipText: { ...typography.smallMedium, color: Colors.textSecondary },
    chipTextActive: { color: Colors.white },
    scroll: { padding: Spacing.lg, paddingBottom: 136 },
    emptyState: { flex: 1, alignItems: "center", justifyContent: "center", padding: Spacing.xl },
    emptyText: { ...typography.body, color: Colors.textMuted, textAlign: "center" },
    offerCard: {
      backgroundColor: Colors.surface,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
      borderLeftWidth: 3,
      borderLeftColor: Colors.teal,
    },
    cardTop: { flexDirection: "row", alignItems: "center", marginBottom: Spacing.md },
    avatarWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: Colors.teal + "25",
      alignItems: "center",
      justifyContent: "center",
      marginRight: Spacing.md,
    },
    avatarText: { ...typography.bodyMedium, color: Colors.teal },
    cardInfo: { flex: 1 },
    lenderName: { ...typography.h4, color: Colors.textPrimary },
    lenderMeta: { ...typography.small, color: Colors.textSecondary, marginTop: 2, textTransform: "capitalize" },
    rate: { ...typography.h4, color: Colors.teal },
    amountRange: { ...typography.small, color: Colors.textSecondary, marginBottom: Spacing.sm },
    cardFooterRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    appCount: { ...typography.caption, color: Colors.textMuted },
    tapHint: { ...typography.smallMedium, color: Colors.teal },
  });
}
