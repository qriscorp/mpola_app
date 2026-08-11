import React from "react";
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
import { Badge, SkeletonList, InfoTip } from "../../src/components";
import { useBrowseBorrowersViewModel } from "../../src/viewmodels";
import { formatDuration } from "../../src/services/duration";

function initials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function BrowseBorrowersScreen() {
  const router = useRouter();
  const {
    search,
    setSearch,
    filter,
    setFilter,
    borrowers,
    totalCount,
    filters,
    page,
    totalPages,
    setPage,
    isLoading,
  } = useBrowseBorrowersViewModel();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Browse Marketplace</Text>
          <InfoTip text="Only requests whose 2 guarantors have both already approved show up here. Making an offer doesn't commit any money — the borrower still has to accept it, and only one offer per request ever gets accepted." />
        </View>
        <Text style={styles.subtitle}>{totalCount} loan applications</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or purpose..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, filter === f && styles.chipActive]}
            onPress={() => setFilter(f)}
          >
            <Text
              style={[styles.chipText, filter === f && styles.chipTextActive]}
            >
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.scroll}>
          <SkeletonList count={4} cardHeight={150} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {borrowers.map((app) => {
            const verified = app.borrower?.kycStatus === "verified";
            return (
              <TouchableOpacity
                key={app.id}
                style={styles.borrowerCard}
                onPress={() =>
                  router.push({
                    pathname: "/(lender)/borrower-profile",
                    params: { applicationId: app.id },
                  })
                }
              >
                <View style={styles.cardTop}>
                  <View style={styles.avatarWrap}>
                    <Text style={styles.avatarText}>
                      {initials(app.borrower?.fullName)}
                    </Text>
                  </View>
                  <View style={styles.cardInfo}>
                    <View style={styles.nameRow}>
                      <Text style={styles.borrowerName}>
                        {app.borrower?.fullName ?? "Borrower"}
                      </Text>
                      {verified && (
                        <Ionicons
                          name="checkmark-circle"
                          size={14}
                          color={Colors.teal}
                        />
                      )}
                    </View>
                    <Text style={styles.borrowerMeta}>
                      Credit score: {app.borrower?.creditScore ?? "—"}
                    </Text>
                  </View>
                  <Badge
                    label={
                      app.loanType === "personal" ? "Personal" : "Business"
                    }
                    variant={app.loanType === "personal" ? "success" : "gold"}
                  />
                </View>

                <View style={styles.cardDetails}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Amount</Text>
                    <Text style={styles.detailValue}>
                      UGX {app.amount.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Duration</Text>
                    <Text style={styles.detailValue}>
                      {formatDuration(app.duration, app.durationDays)}
                    </Text>
                  </View>
                </View>

                {app.purpose && (
                  <Text style={styles.purpose} numberOfLines={2}>
                    {app.purpose}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}

          <View style={styles.paginationRow}>
            <TouchableOpacity
              style={[styles.pageBtn, page <= 1 && styles.pageBtnDisabled]}
              onPress={() => setPage(page - 1)}
              disabled={page <= 1}
            >
              <Ionicons name="chevron-back" size={16} color={Colors.white} />
              <Text style={styles.pageBtnText}>Previous</Text>
            </TouchableOpacity>
            <Text style={styles.pageIndicator}>
              Page {page} of {totalPages}
            </Text>
            <TouchableOpacity
              style={[
                styles.pageBtn,
                page >= totalPages && styles.pageBtnDisabled,
              ]}
              onPress={() => setPage(page + 1)}
              disabled={page >= totalPages}
            >
              <Text style={styles.pageBtnText}>Next</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  titleRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  title: { ...Typography.h2, color: Colors.white },
  subtitle: { ...Typography.body, color: Colors.textSecondary, marginTop: 2 },
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
  searchInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.textPrimary,
    padding: 0,
  },
  filterRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  chipText: { ...Typography.smallMedium, color: Colors.textSecondary },
  chipTextActive: { color: Colors.white },
  scroll: { padding: Spacing.lg, paddingBottom: 40 },
  borrowerCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.gold,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.gold + "25",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  avatarText: { ...Typography.bodyMedium, color: Colors.gold },
  cardInfo: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  borrowerName: { ...Typography.h4, color: Colors.textPrimary },
  borrowerMeta: {
    ...Typography.small,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  cardDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  detailItem: {},
  detailLabel: { ...Typography.caption, color: Colors.textMuted },
  detailValue: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  purpose: { ...Typography.small, color: Colors.textSecondary },
  paginationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.md,
  },
  pageBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  pageBtnDisabled: { opacity: 0.4 },
  pageBtnText: { ...Typography.smallMedium, color: Colors.white },
  pageIndicator: { ...Typography.small, color: Colors.textSecondary },
});
