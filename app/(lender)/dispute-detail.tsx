import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Colors, Spacing, useScaledTypography } from "../../src/theme";
import { DisputeDetailScreenContent } from "../../src/components";

export default function LenderDisputeDetailScreen() {
  const router = useRouter();
  const { disputeId } = useLocalSearchParams<{ disputeId: string }>();
  const typography = useScaledTypography();
  const styles = useMemo(() => makeStyles(typography), [typography]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dispute</Text>
        <View style={{ width: 24 }} />
      </View>
      {disputeId ? (
        <DisputeDetailScreenContent disputeId={disputeId} accentColor={Colors.gold} />
      ) : (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: Colors.textMuted }}>No dispute selected.</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

function makeStyles(typography: ReturnType<typeof useScaledTypography>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
    },
    headerTitle: { ...typography.h3, color: Colors.white },
  });
}
