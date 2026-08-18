import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, useScaledTypography } from "../../src/theme";
import { ApprovalsList } from "../../src/components";

export default function LenderApprovalsScreen() {
  const router = useRouter();
  const typography = useScaledTypography();
  const styles = useMemo(() => makeStyles(typography), [typography]);
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Reached by pushing from Home's Approvals action, not a tab
            root, so it needs a real way back. */}
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityLabel="Go back"
          accessibilityRole="button"
          style={{ marginBottom: Spacing.md }}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.title}>Approvals</Text>
        <Text style={styles.subtitle}>
          Anything that needs your action shows up here — like a guarantor request from someone
          you know.
        </Text>
        <View style={{ marginTop: Spacing.lg }}>
          <ApprovalsList />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(typography: ReturnType<typeof useScaledTypography>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scroll: { padding: Spacing.lg, paddingBottom: 136 },
    title: { ...typography.h2, color: Colors.white, marginBottom: Spacing.xs },
    subtitle: { ...typography.small, color: Colors.textMuted },
  });
}
