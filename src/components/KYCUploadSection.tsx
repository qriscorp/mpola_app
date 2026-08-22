import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Colors, Spacing, BorderRadius, useScaledTypography } from "../theme";
import { getMyKycDocuments, uploadKycDocument, showAlert, type KYCDocumentType } from "../services";
import { SkeletonList } from "./Skeleton";

const SLOTS: { type: KYCDocumentType; label: string; hint: string }[] = [
  { type: "national_id", label: "National ID", hint: "National ID or Passport required" },
  { type: "passport", label: "Passport", hint: "National ID or Passport required" },
  { type: "profile_photo", label: "Profile Photo / Selfie", hint: "Required" },
  { type: "proof_of_address", label: "Proof of Address", hint: "Optional — e.g. utility bill" },
];

/** Account-level KYC document upload — shared by the borrower and lender
 * profile screens. Uploading doesn't change kyc_status by itself; an admin
 * still has to review and approve/reject it from the web dashboard. Each
 * document locks against re-upload individually, from the moment THAT
 * document is verified, for KYC_REVERIFICATION_LOCK_DAYS — independent of
 * the other slots or whether the account's overall kyc_status has reached
 * "verified" yet. The backend enforces this regardless of what this screen
 * shows (see locked_until on each document, computed server-side). */
export function KYCUploadSection({ accentColor = Colors.teal }: { accentColor?: string }) {
  const qc = useQueryClient();
  const typography = useScaledTypography();
  const styles = useMemo(() => makeStyles(typography), [typography]);
  const { data: documents, isLoading } = useQuery({
    queryKey: ["kyc-documents"],
    queryFn: getMyKycDocuments,
  });

  const [uploadingType, setUploadingType] = useState<KYCDocumentType | null>(null);

  const upload = useMutation({
    mutationFn: ({ documentType, file }: {
      documentType: KYCDocumentType;
      file: { uri: string; name: string; mimeType?: string };
    }) => uploadKycDocument(documentType, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kyc-documents"] }),
    onError: (e: any) => showAlert("Upload failed", e?.message || "Please try again."),
    onSettled: () => setUploadingType(null),
  });

  const handlePick = async (type: KYCDocumentType) => {
    const existing = documents?.find((d) => d.document_type === type);
    if (existing?.locked_until) {
      const until = new Date(existing.locked_until);
      showAlert(
        "Document locked",
        `This document is verified — locked until ${until.toLocaleDateString()}. Contact support if you need to update it sooner.`,
      );
      return;
    }
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/*"],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setUploadingType(type);
    upload.mutate({
      documentType: type,
      file: { uri: asset.uri, name: asset.name, mimeType: asset.mimeType },
    });
  };

  if (isLoading) {
    return <SkeletonList count={2} cardHeight={56} />;
  }

  return (
    <View>
      {SLOTS.map((slot, i) => {
        const existing = documents?.find((d) => d.document_type === slot.type);
        const rejected = !!existing && !existing.verified && !!existing.rejection_reason;
        const locked = !!existing?.locked_until;
        return (
          <View
            key={slot.type}
            style={[styles.row, i < SLOTS.length - 1 && styles.rowBorder]}
          >
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.label}>{slot.label}</Text>
              <Text style={styles.hint}>{slot.hint}</Text>
              {existing && (
                <Text style={styles.fileName} numberOfLines={1}>
                  {existing.file_name}
                </Text>
              )}
              {rejected && (
                <Text style={styles.rejectionReason} numberOfLines={2}>
                  Rejected: {existing!.rejection_reason}
                </Text>
              )}
            </View>
            <View style={{ alignItems: "flex-end", gap: Spacing.xs }}>
              {uploadingType === slot.type ? (
                <View style={[styles.badge, { backgroundColor: accentColor + "20" }]}>
                  <Text style={[styles.badgeText, { color: accentColor }]}>Uploading…</Text>
                </View>
              ) : (
                existing && (
                  <View
                    style={[
                      styles.badge,
                      existing.verified
                        ? styles.badgeVerified
                        : rejected
                          ? styles.badgeRejected
                          : styles.badgePending,
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        {
                          color: existing.verified
                            ? Colors.success
                            : rejected
                              ? Colors.danger
                              : Colors.warning,
                        },
                      ]}
                    >
                      {existing.verified ? "Verified" : rejected ? "Rejected" : "Pending review"}
                    </Text>
                  </View>
                )
              )}
              <TouchableOpacity
                style={[
                  styles.uploadBtn,
                  { borderColor: locked ? Colors.border : accentColor },
                ]}
                onPress={() => handlePick(slot.type)}
                disabled={upload.isPending}
              >
                {uploadingType === slot.type ? (
                  <ActivityIndicator size="small" color={accentColor} />
                ) : (
                  <Ionicons
                    name={locked ? "lock-closed-outline" : "cloud-upload-outline"}
                    size={14}
                    color={locked ? Colors.textMuted : accentColor}
                  />
                )}
                <Text
                  style={[
                    styles.uploadText,
                    { color: locked ? Colors.textMuted : accentColor },
                  ]}
                >
                  {uploadingType === slot.type ? "Uploading…" : locked ? "Locked" : existing ? "Replace" : "Upload"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function makeStyles(typography: ReturnType<typeof useScaledTypography>) {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: Spacing.md,
      paddingVertical: Spacing.md,
    },
    rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
    label: { ...typography.bodyMedium, color: Colors.textPrimary },
    hint: { ...typography.caption, color: Colors.textMuted, marginTop: 2 },
    fileName: { ...typography.caption, color: Colors.textSecondary, marginTop: 4 },
    rejectionReason: { ...typography.caption, color: Colors.danger, marginTop: 4 },
    lockBanner: {
      backgroundColor: Colors.successBg,
      borderRadius: BorderRadius.md,
      padding: Spacing.sm,
      marginBottom: Spacing.sm,
    },
    lockBannerText: { ...typography.caption, color: Colors.success },
    badge: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: 3,
      borderRadius: BorderRadius.full,
    },
    badgeVerified: { backgroundColor: Colors.successBg },
    badgePending: { backgroundColor: Colors.warningBg },
    badgeRejected: { backgroundColor: Colors.dangerBg },
    badgeText: { ...typography.caption, fontWeight: "600" },
    uploadBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      borderWidth: 1,
      borderRadius: BorderRadius.full,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 5,
    },
    uploadText: { ...typography.caption, fontWeight: "600" },
  });
}
