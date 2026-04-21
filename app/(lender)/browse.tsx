import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
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
import { Badge } from "../../src/components";
import { useBrowseBorrowersViewModel } from "../../src/viewmodels";

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
    isLoading,
  } = useBrowseBorrowersViewModel();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Browse Borrowers</Text>
        <Text style={styles.subtitle}>{totalCount} verified borrowers</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search borrowers..."
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
            onPress={() => setFilter(f as any)}
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
        <ActivityIndicator
          size="large"
          color={Colors.gold}
          style={{ marginTop: Spacing.xxxl }}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {borrowers.map((b) => (
            <TouchableOpacity
              key={b.id}
              style={styles.borrowerCard}
              onPress={() =>
                router.push({
                  pathname: "/(lender)/borrower-profile",
                  params: { borrowerId: b.id },
                })
              }
            >
              <View style={styles.cardTop}>
                <View style={styles.avatarWrap}>
                  <Text style={styles.avatarText}>{b.initials}</Text>
                </View>
                <View style={styles.cardInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.borrowerName}>{b.name}</Text>
                    {b.kycVerified && (
                      <Ionicons
                        name="checkmark-circle"
                        size={14}
                        color={Colors.teal}
                      />
                    )}
                  </View>
                  <Text style={styles.borrowerMeta}>
                    {b.location} • Member since {b.memberSince}
                  </Text>
                </View>
                <Badge
                  label={b.loanType === "personal" ? "Personal" : "Business"}
                  variant={b.loanType === "personal" ? "success" : "gold"}
                />
              </View>

              <View style={styles.cardDetails}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Amount</Text>
                  <Text style={styles.detailValue}>
                    UGX {b.amount.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Duration</Text>
                  <Text style={styles.detailValue}>{b.duration} months</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Prev. Loans</Text>
                  <Text style={styles.detailValue}>{b.previousLoans}</Text>
                </View>
              </View>

              <Text style={styles.purpose} numberOfLines={2}>
                {b.purpose}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  title: { ...Typography.h2, color: Colors.textPrimary },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  searchRow: { paddingHorizontal: Spacing.lg, marginTop: Spacing.lg },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    ...Shadow.sm,
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
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  chipText: { ...Typography.smallMedium, color: Colors.textSecondary },
  chipTextActive: { color: Colors.white },
  scroll: { padding: Spacing.lg, paddingBottom: 40 },
  borrowerCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.sm,
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
    backgroundColor: Colors.goldLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  avatarText: { ...Typography.bodyMedium, color: Colors.goldDark },
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
});
