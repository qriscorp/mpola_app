import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Switch, Modal, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import * as WebBrowser from "expo-web-browser";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Colors, Typography, Spacing, BorderRadius } from "../theme";
import { Card } from "./Card";
import { Button } from "./Button";
import { Input } from "./Input";
import { useProfileViewModel } from "../viewmodels";
import { changePassword, exportMyData, deactivateMyAccount } from "../services";

const MPOLA_WEB_URL = "https://mpola.co";

export function SettingsScreenContent({ accentColor = Colors.teal }: { accentColor?: string }) {
  const { profile, updateProfile, signOut } = useProfileViewModel();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const changePasswordMutation = useMutation({
    mutationFn: () => changePassword(oldPassword, newPassword),
    onSuccess: () => {
      Alert.alert("Password changed", "Use your new password next time you sign in.");
      setOldPassword("");
      setNewPassword("");
    },
    onError: (e: Error) => Alert.alert("Couldn't change password", e.message),
  });

  const exportMutation = useMutation({
    mutationFn: exportMyData,
    onSuccess: async (data) => {
      const fileUri = `${FileSystem.cacheDirectory}mpola-my-data-${new Date().toISOString().slice(0, 10)}.json`;
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(data, null, 2));
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, { mimeType: "application/json", dialogTitle: "My Mpola Data" });
      } else {
        Alert.alert("Sharing not available", "Sharing isn't supported on this device.");
      }
    },
    onError: (e: Error) => Alert.alert("Couldn't export data", e.message),
  });

  const [showDeactivate, setShowDeactivate] = useState(false);
  const [deactivatePassword, setDeactivatePassword] = useState("");
  const [deactivateReason, setDeactivateReason] = useState("");
  const deactivateMutation = useMutation({
    mutationFn: () => deactivateMyAccount(deactivatePassword, deactivateReason.trim() || undefined),
    onSuccess: () => {
      setShowDeactivate(false);
      signOut();
    },
    onError: (e: Error) => Alert.alert("Couldn't deactivate account", e.message),
  });

  if (!profile) return null;

  return (
    <View style={{ gap: Spacing.lg }}>
      <Card>
        <Text style={styles.sectionTitle}>Security</Text>
        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleLabel}>Two-Factor Authentication</Text>
            <Text style={styles.toggleSub}>SMS code on login</Text>
          </View>
          <Switch
            value={!!profile.twoFactorEnabled}
            onValueChange={(v) => updateProfile({ twoFactorEnabled: v })}
            trackColor={{ true: accentColor }}
          />
        </View>
        <View style={styles.divider} />
        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleLabel}>Login Notifications</Text>
            <Text style={styles.toggleSub}>Alert on new device login</Text>
          </View>
          <Switch
            value={profile.notifLoginAlerts ?? true}
            onValueChange={(v) => updateProfile({ notifLoginAlerts: v })}
            trackColor={{ true: accentColor }}
          />
        </View>

        <View style={styles.divider} />
        <Text style={styles.fieldLabel}>Change Password</Text>
        <Input
          placeholder="Current password"
          value={oldPassword}
          onChangeText={setOldPassword}
          secureTextEntry
        />
        <Input
          placeholder="New password"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
        />
        <Button
          title={changePasswordMutation.isPending ? "Changing…" : "Change Password"}
          onPress={() => changePasswordMutation.mutate()}
          variant="outline"
          color={accentColor}
          disabled={changePasswordMutation.isPending || oldPassword.length === 0 || newPassword.length < 8}
        />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>About</Text>
        <TouchableOpacity style={styles.menuRow} onPress={() => WebBrowser.openBrowserAsync(`${MPOLA_WEB_URL}/platform-terms`)}>
          <Text style={styles.infoLabel}>Terms of Service</Text>
          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.menuRow} onPress={() => WebBrowser.openBrowserAsync(`${MPOLA_WEB_URL}/privacy-policy`)}>
          <Text style={styles.infoLabel}>Privacy Policy</Text>
          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </TouchableOpacity>
      </Card>

      <Card style={{ borderWidth: 1, borderColor: Colors.danger + "50" }}>
        <Text style={[styles.sectionTitle, { color: Colors.danger }]}>Danger Zone</Text>
        <Button
          title="Deactivate Account"
          onPress={() => setShowDeactivate(true)}
          variant="outline"
          color={Colors.danger}
          style={{ marginBottom: Spacing.sm }}
        />
        <Button
          title={exportMutation.isPending ? "Preparing…" : "Export My Data"}
          onPress={() => exportMutation.mutate()}
          variant="outline"
          color={Colors.textSecondary}
          disabled={exportMutation.isPending}
        />
      </Card>

      <Modal visible={showDeactivate} transparent animationType="fade" onRequestClose={() => setShowDeactivate(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Ionicons name="warning" size={32} color={Colors.danger} style={{ alignSelf: "center", marginBottom: Spacing.sm }} />
            <Text style={styles.modalTitle}>Deactivate your account?</Text>
            <Text style={styles.modalDesc}>
              This permanently deletes your account and wallet — your data is fully purged after
              30 days. Withdraw your wallet balance and settle any active loan first; this can't
              be undone.
            </Text>
            <Input
              placeholder="Confirm your password"
              value={deactivatePassword}
              onChangeText={setDeactivatePassword}
              secureTextEntry
            />
            <Input
              placeholder="Reason (optional)"
              value={deactivateReason}
              onChangeText={setDeactivateReason}
            />
            <Button
              title={deactivateMutation.isPending ? "Deactivating…" : "Permanently Deactivate"}
              onPress={() => deactivateMutation.mutate()}
              variant="danger"
              disabled={deactivateMutation.isPending || !deactivatePassword}
              style={{ marginBottom: Spacing.sm }}
            />
            <Button
              title="Cancel"
              onPress={() => setShowDeactivate(false)}
              variant="outline"
              color={Colors.textSecondary}
              disabled={deactivateMutation.isPending}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { ...Typography.h4, color: Colors.textPrimary, marginBottom: Spacing.sm },
  toggleRow: { flexDirection: "row", alignItems: "center", paddingVertical: Spacing.sm },
  toggleLabel: { ...Typography.bodyMedium, color: Colors.textPrimary },
  toggleSub: { ...Typography.small, color: Colors.textSecondary, marginTop: 2 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm },
  fieldLabel: { ...Typography.smallMedium, color: Colors.textSecondary, marginBottom: Spacing.sm },
  menuRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: Spacing.sm },
  infoLabel: { ...Typography.body, color: Colors.textSecondary },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: Spacing.lg },
  modalCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg },
  modalTitle: { ...Typography.h4, color: Colors.textPrimary, textAlign: "center", marginBottom: Spacing.xs },
  modalDesc: { ...Typography.small, color: Colors.textSecondary, textAlign: "center", marginBottom: Spacing.md },
});
