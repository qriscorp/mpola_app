import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Switch, StyleSheet } from "react-native";
import { Colors, Spacing, useScaledTypography } from "../theme";
import {
  isBiometricSupported,
  isBiometricLoginEnabled,
  setBiometricLoginEnabled,
} from "../services/biometrics";
import { showAlert } from "../services/alerts";

export function BiometricToggle({ accentColor = Colors.teal }: { accentColor?: string }) {
  const typography = useScaledTypography();
  const styles = useMemo(() => makeStyles(typography), [typography]);
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
      showAlert(
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

function makeStyles(typography: ReturnType<typeof useScaledTypography>) {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    title: { ...typography.bodyMedium, color: Colors.textPrimary },
    sub: { ...typography.small, color: Colors.textSecondary, marginTop: 2 },
  });
}
