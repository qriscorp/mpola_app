import React from "react";
import { KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Colors } from "../../src/theme";
import { AdminChatThreadScreenContent } from "../../src/components";

export default function BorrowerAdminChatScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={80}
      >
        <AdminChatThreadScreenContent onBack={() => router.back()} accentColor={Colors.teal} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
