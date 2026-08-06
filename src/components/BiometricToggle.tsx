import React, { useEffect, useState } from "react";
import { View, Text, Switch, StyleSheet, Alert } from "react-native";
import { Colors, Typography, Spacing } from "../theme";
import {
  isBiometricSupported,
  isBiometricLoginEnabled,
  setBiometricLoginEnabled,
} from "../services/biometrics";

export function BiometricToggle({ accentColor = Colors.teal }: { accentColor?: string }) {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    (async () => {
      const [isSupported, isEnabled] = await Promise.all([
        isBiometricSupported(),
        isBiometricLoginEnabled(),
      ]);
      setSupported(isSupported);
      setEnabled(isEnabled);
    })();
  }, []);

  if (!supported) return null;

  const handleToggle = async (value: boolean) => {
    setEnabled(value);
    await setBiometricLoginEnabled(value);
    if (value) {
      Alert.alert(
        "Biometric sign-in enabled",
        "You can now use Face ID or your fingerprint to sign back in quickly.",
      );
    }
  };

  return (
    <View style={styles.row}>
      <View>
        <Text style={styles.title}>Face ID / Fingerprint Sign-In</Text>
        <Text style={styles.sub}>Quick unlock for your existing session</Text>
      </View>
      <Switch value={enabled} onValueChange={handleToggle} trackColor={{ true: accentColor }} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { ...Typography.bodyMedium, color: Colors.textPrimary },
  sub: { ...Typography.small, color: Colors.textSecondary, marginTop: 2 },
});
