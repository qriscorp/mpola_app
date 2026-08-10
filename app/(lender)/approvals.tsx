import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Typography, Spacing } from "../../src/theme";
import { ApprovalsList } from "../../src/components";

export default function LenderApprovalsScreen() {
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingBottom: 40 },
  title: { ...Typography.h2, color: Colors.white, marginBottom: Spacing.xs },
  subtitle: { ...Typography.small, color: Colors.textMuted },
});
