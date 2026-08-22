import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Switch } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import * as WebBrowser from "expo-web-browser";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Colors, Spacing, BorderRadius, useFontScale, useScaledTypography } from "../theme";
import { Card } from "./Card";
import { Button } from "./Button";
import { Input } from "./Input";
import { ConfirmModal } from "./ConfirmModal";
import { useProfileViewModel } from "../viewmodels";
import { changePassword, exportMyData, deactivateMyAccount, showAlert } from "../services";
import { passwordRequirementErrors, PASSWORD_REQUIREMENTS_HINT } from "../validation";

const MPOLA_WEB_URL = "https://mpola.co";

export function SettingsScreenContent({ accentColor = Colors.teal }: { accentColor?: string }) {
  const { profile, updateProfile, signOut } = useProfileViewModel();
  const typography = useScaledTypography();
  const fontScale = useFontScale();
  const styles = useMemo(() => makeStyles(typography), [typography]);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const changePasswordMutation = useMutation({
    mutationFn: () => changePassword(oldPassword, newPassword),
    onSuccess: () => {
      showAlert("Password changed", "Use your new password next time you sign in.");
      setOldPassword("");
      setNewPassword("");
    },
    onError: (e: Error) => showAlert("Couldn't change password", e.message),
  });

  function handleChangePassword() {
    const errors = passwordRequirementErrors(newPassword);
    if (errors.length) {
      showAlert("Password too weak", `New password needs: ${errors.join(", ").toLowerCase()}`);
      return;
    }
    changePasswordMutation.mutate();
  }

  const exportMutation = useMutation({
    mutationFn: exportMyData,
    onSuccess: async (data) => {
      setShowExportConfirm(false);
      const fileUri = `${FileSystem.cacheDirectory}mpola-my-data-${new Date().toISOString().slice(0, 10)}.json`;
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(data, null, 2));
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, { mimeType: "application/json", dialogTitle: "My Mpola Data" });
      } else {
        showAlert("Sharing not available", "Sharing isn't supported on this device.");
      }
    },
    onError: (e: Error) => {
      setShowExportConfirm(false);
      showAlert("Couldn't export data", e.message);
    },
  });

  const [showDeactivate, setShowDeactivate] = useState(false);
  const [showExportConfirm, setShowExportConfirm] = useState(false);
  const [deactivatePassword, setDeactivatePassword] = useState("");
  const [deactivateReason, setDeactivateReason] = useState("");
  const deactivateMutation = useMutation({
    mutationFn: () => deactivateMyAccount(deactivatePassword, deactivateReason.trim() || undefined),
    onSuccess: () => {
      setShowDeactivate(false);
      signOut();
    },
    onError: (e: Error) => showAlert("Couldn't deactivate account", e.message),
  });

  if (!profile) return null;

  return (
    <View style={{ gap: Spacing.lg }}>
      <Card>
        <View style={styles.textSizeHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Text Size</Text>
            <Text style={styles.toggleSub}>Adjust text size for the entire app</Text>
          </View>
          <Text style={[styles.textSizePercent, { color: accentColor }]}>
            {fontScale.percentage}%
          </Text>
        </View>
        <View style={styles.textSizeControls}>
          <TouchableOpacity
            onPress={fontScale.decrease}
            disabled={!fontScale.canDecrease}
            style={[styles.textSizeBtn, !fontScale.canDecrease && styles.textSizeBtnDisabled]}
            accessibilityLabel="Decrease text size"
          >
            <Ionicons name="remove" size={20} color={fontScale.canDecrease ? accentColor : Colors.textMuted} />
          </TouchableOpacity>
          <View style={styles.textSizeTrack}>
            <View
              style={[
                styles.textSizeFill,
                {
                  width: `${((fontScale.scale - 0.8) / (1.6 - 0.8)) * 100}%`,
                  backgroundColor: accentColor,
                },
              ]}
            />
          </View>
          <TouchableOpacity
            onPress={fontScale.increase}
            disabled={!fontScale.canIncrease}
            style={[styles.textSizeBtn, !fontScale.canIncrease && styles.textSizeBtnDisabled]}
            accessibilityLabel="Increase text size"
          >
            <Ionicons name="add" size={20} color={fontScale.canIncrease ? accentColor : Colors.textMuted} />
          </TouchableOpacity>
          {!fontScale.isDefault && (
            <TouchableOpacity onPress={fontScale.reset} style={styles.textSizeReset}>
              <Text style={[styles.textSizeResetText, { color: accentColor }]}>Reset</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.textSizePreview}>
          The quick brown fox jumps over the lazy dog
        </Text>
      </Card>

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
        <Text style={styles.passwordHint}>{PASSWORD_REQUIREMENTS_HINT}</Text>
        <Button
          title={changePasswordMutation.isPending ? "Changing…" : "Change Password"}
          onPress={handleChangePassword}
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
          onPress={() => setShowExportConfirm(true)}
          variant="outline"
          color={Colors.textSecondary}
          disabled={exportMutation.isPending}
        />
      </Card>

      <ConfirmModal
        visible={showDeactivate}
        icon="warning"
        title="Deactivate your account?"
        message="This permanently deletes your account and wallet — your data is fully purged after 30 days. Withdraw your wallet balance and settle any active loan first; this can't be undone."
        confirmLabel="Deactivate"
        destructive
        loading={deactivateMutation.isPending}
        confirmDisabled={!deactivatePassword}
        onCancel={() => setShowDeactivate(false)}
        onConfirm={() => deactivateMutation.mutate()}
      >
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
      </ConfirmModal>

      <ConfirmModal
        visible={showExportConfirm}
        icon="download-outline"
        title="Export your data?"
        message="This packages your account, loan, and transaction data into a file and opens your device's share sheet so you can save or send it."
        confirmLabel="Export"
        accentColor={accentColor}
        loading={exportMutation.isPending}
        onCancel={() => setShowExportConfirm(false)}
        onConfirm={() => exportMutation.mutate()}
      />
    </View>
  );
}

function makeStyles(typography: ReturnType<typeof useScaledTypography>) {
  return StyleSheet.create({
    sectionTitle: { ...typography.h4, color: Colors.textPrimary, marginBottom: Spacing.sm },
    toggleRow: { flexDirection: "row", alignItems: "center", paddingVertical: Spacing.sm },
    toggleLabel: { ...typography.bodyMedium, color: Colors.textPrimary },
    toggleSub: { ...typography.small, color: Colors.textSecondary, marginTop: 2 },
    passwordHint: { ...typography.small, color: Colors.textMuted, marginTop: -Spacing.sm, marginBottom: Spacing.sm },
    divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm },
    fieldLabel: { ...typography.smallMedium, color: Colors.textSecondary, marginBottom: Spacing.sm },
    menuRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: Spacing.sm },
    infoLabel: { ...typography.body, color: Colors.textSecondary },
    textSizeHeader: { flexDirection: "row", alignItems: "center", marginBottom: Spacing.md },
    textSizePercent: { ...typography.h4 },
    textSizeControls: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
    textSizeBtn: {
      width: 36,
      height: 36,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: Colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    textSizeBtnDisabled: { opacity: 0.4 },
    textSizeTrack: {
      flex: 1,
      height: 4,
      borderRadius: 2,
      backgroundColor: Colors.border,
      overflow: "hidden",
    },
    textSizeFill: { height: "100%", borderRadius: 2 },
    textSizeReset: { paddingHorizontal: Spacing.sm },
    textSizeResetText: { ...typography.smallMedium, fontWeight: "700" },
    textSizePreview: {
      ...typography.small,
      color: Colors.textMuted,
      marginTop: Spacing.md,
    },
  });
}
