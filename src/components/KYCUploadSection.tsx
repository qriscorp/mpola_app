import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Colors, Typography, Spacing, BorderRadius } from "../theme";
import { getMyKycDocuments, uploadKycDocument, type KYCDocumentType } from "../services";
import { SkeletonList } from "./Skeleton";

const SLOTS: { type: KYCDocumentType; label: string; hint: string }[] = [
  { type: "national_id", label: "National ID", hint: "National ID or Passport required" },
  { type: "passport", label: "Passport", hint: "National ID or Passport required" },
  { type: "profile_photo", label: "Profile Photo / Selfie", hint: "Required" },
  { type: "proof_of_address", label: "Proof of Address", hint: "Optional — e.g. utility bill" },
];

/** Account-level KYC document upload — shared by the borrower and lender
 * profile screens. Uploading doesn't change kyc_status by itself; an admin
 * still has to review and approve/reject it from the web dashboard. */
export function KYCUploadSection({ accentColor = Colors.teal }: { accentColor?: string }) {
  const qc = useQueryClient();
  const { data: documents, isLoading } = useQuery({
    queryKey: ["kyc-documents"],
    queryFn: getMyKycDocuments,
  });

  const upload = useMutation({
    mutationFn: ({ documentType, file }: {
      documentType: KYCDocumentType;
      file: { uri: string; name: string; mimeType?: string };
    }) => uploadKycDocument(documentType, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kyc-documents"] }),
    onError: (e: any) => Alert.alert("Upload failed", e?.message || "Please try again."),
  });

  const handlePick = async (type: KYCDocumentType) => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/*"],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
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
            </View>
            <View style={{ alignItems: "flex-end", gap: Spacing.xs }}>
              {existing && (
                <View
                  style={[
                    styles.badge,
                    existing.verified ? styles.badgeVerified : styles.badgePending,
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      { color: existing.verified ? Colors.success : Colors.warning },
                    ]}
                  >
                    {existing.verified ? "Verified" : "Pending review"}
                  </Text>
                </View>
              )}
              <TouchableOpacity
                style={[styles.uploadBtn, { borderColor: accentColor }]}
                onPress={() => handlePick(slot.type)}
                disabled={upload.isPending}
              >
                <Ionicons name="cloud-upload-outline" size={14} color={accentColor} />
                <Text style={[styles.uploadText, { color: accentColor }]}>
                  {existing ? "Replace" : "Upload"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  label: { ...Typography.bodyMedium, color: Colors.textPrimary },
  hint: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
  fileName: { ...Typography.caption, color: Colors.textSecondary, marginTop: 4 },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  badgeVerified: { backgroundColor: Colors.successBg },
  badgePending: { backgroundColor: Colors.warningBg },
  badgeText: { ...Typography.caption, fontWeight: "600" },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
  },
  uploadText: { ...Typography.caption, fontWeight: "600" },
});
