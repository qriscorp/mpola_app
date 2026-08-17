import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Spacing, useScaledTypography } from "../../src/theme";
import { ApprovalsList } from "../../src/components";

export default function LenderApprovalsScreen() {
  const typography = useScaledTypography();
  const styles = useMemo(() => makeStyles(typography), [typography]);
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
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
    scroll: { padding: Spacing.lg, paddingBottom: 40 },
    title: { ...typography.h2, color: Colors.white, marginBottom: Spacing.xs },
    subtitle: { ...typography.small, color: Colors.textMuted },
  });
}
