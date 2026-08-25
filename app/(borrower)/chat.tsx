import React from "react";
import { View, Text, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Colors } from "../../src/theme";
import { ChatThreadScreenContent } from "../../src/components";

export default function BorrowerChatScreen() {
  const router = useRouter();
  const { loanId } = useLocalSearchParams<{ loanId: string }>();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={80}
      >
        {loanId ? (
          <ChatThreadScreenContent loanId={loanId} onBack={() => router.back()} accentColor={Colors.teal} />
        ) : (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: Colors.textMuted }}>No conversation selected.</Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
