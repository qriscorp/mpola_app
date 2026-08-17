import { useMemo, useState } from "react";
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Linking, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, BorderRadius, useScaledTypography } from "../theme";
import type { RequiredDocumentStatus } from "../models";
import type { BorrowerDocumentType } from "../services";

const BORROWER_DOC_LABEL_MAP: Record<string, BorrowerDocumentType> = {
  "Bank Statement (3mo)": "bank_statement",
  "Payslip / Business Proof": "business_proof",
  "Land Title": "land_title",
  "URA TIN": "ura_tin",
};

/** Shows what a specific offer requires and lets the borrower satisfy it
 * inline — "National ID" routes to the account-wide KYC section on
 * Profile, known types upload directly here as a reusable BorrowerDocument,
 * and a lender's custom "Other: ..." requirement accepts either a file or a
 * typed explanation (at least one). Already-satisfied items can still be
 * replaced — documents expire, or the wrong file gets picked. Pass
 * `readOnly` for the lender's disbursement-review view — verification
 * only, no upload controls. */
export function RequiredDocumentsChecklist({
  items,
  onUpload,
  uploadingType,
  onUploadCustom,
  onSaveCustomText,
  uploadingCustomLabel,
  readOnly = false,
  onGoToProfile,
}: {
  items: RequiredDocumentStatus[];
  onUpload?: (documentType: BorrowerDocumentType) => void;
  uploadingType?: string | null;
  onUploadCustom?: (label: string) => void;
  onSaveCustomText?: (label: string, text: string) => void;
  uploadingCustomLabel?: string | null;
  readOnly?: boolean;
  onGoToProfile?: () => void;
}) {
  const typography = useScaledTypography();
  const styles = useMemo(() => makeStyles(typography), [typography]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  if (items.length === 0) return null;

  return (
    <View style={{ gap: Spacing.xs }}>
      {items.map((item) => {
        const docType = BORROWER_DOC_LABEL_MAP[item.label];
        const isCustom = item.source === "custom";
        const isUploading =
          (!!docType && uploadingType === docType) || (isCustom && uploadingCustomLabel === item.label);
        return (
          <View
            key={item.label}
            style={[
              styles.row,
              isUploading ? styles.rowUploading : item.satisfied ? styles.rowSatisfied : styles.rowMissing,
            ]}
          >
            <View style={styles.rowTop}>
              <View style={styles.rowLeft}>
                {isUploading ? (
                  <ActivityIndicator size="small" color={Colors.teal} />
                ) : item.satisfied ? (
                  <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                ) : (
                  <Ionicons name="ellipse-outline" size={16} color={Colors.warning} />
                )}
                <Text
                  style={isUploading ? styles.labelUploading : item.satisfied ? styles.labelSatisfied : styles.labelMissing}
                >
                  {item.label}
                  {isUploading ? " — uploading…" : ""}
                </Text>
              </View>
              {item.satisfied && item.fileUrl && (
                <TouchableOpacity onPress={() => Linking.openURL(item.fileUrl!)}>
                  <Text style={styles.viewLink}>View</Text>
                </TouchableOpacity>
              )}
              {!item.satisfied && readOnly && <Text style={styles.notProvided}>Not provided</Text>}
              {!readOnly && item.source === "kyc" && (
                <TouchableOpacity onPress={onGoToProfile}>
                  <Text style={styles.actionLink}>
                    {item.satisfied ? "Replace from Profile" : "Upload from Profile"}
                  </Text>
                </TouchableOpacity>
              )}
              {!readOnly && item.source === "borrower_doc" && docType && !isUploading && (
                <TouchableOpacity onPress={() => onUpload?.(docType)}>
                  <Text style={styles.actionLink}>{item.satisfied ? "Replace" : "Upload"}</Text>
                </TouchableOpacity>
              )}
              {!readOnly && isCustom && !isUploading && (
                <TouchableOpacity onPress={() => onUploadCustom?.(item.label)}>
                  <Text style={styles.actionLink}>{item.fileUrl ? "Replace file" : "Upload file"}</Text>
                </TouchableOpacity>
              )}
            </View>

            {!readOnly && isCustom && (
              <View style={styles.customTextWrap}>
                <TextInput
                  multiline
                  numberOfLines={2}
                  defaultValue={item.textResponse ?? ""}
                  onChangeText={(t) => setDrafts((prev) => ({ ...prev, [item.label]: t }))}
                  onBlur={() => {
                    const text = drafts[item.label]?.trim();
                    if (text) onSaveCustomText?.(item.label, text);
                  }}
                  placeholder="Or describe it here instead of uploading a file..."
                  placeholderTextColor={Colors.textMuted}
                  style={styles.customTextInput}
                />
                <Text style={styles.customHint}>
                  A file or a written explanation satisfies this — at least one is needed.
                </Text>
              </View>
            )}
            {readOnly && isCustom && item.textResponse && (
              <Text style={styles.customReadOnlyText}>&ldquo;{item.textResponse}&rdquo;</Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

function makeStyles(typography: ReturnType<typeof useScaledTypography>) {
  return StyleSheet.create({
    row: {
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.sm,
      gap: Spacing.xs,
    },
    rowTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: Spacing.sm,
    },
    rowSatisfied: { borderColor: Colors.success + "40", backgroundColor: Colors.successBg },
    rowMissing: { borderColor: Colors.warning + "40", backgroundColor: Colors.warningBg },
    rowUploading: { borderColor: Colors.teal + "40", backgroundColor: Colors.teal + "15" },
    rowLeft: { flexDirection: "row", alignItems: "center", gap: Spacing.xs, flex: 1 },
    labelSatisfied: { ...typography.small, color: Colors.success },
    labelMissing: { ...typography.small, color: Colors.warning },
    labelUploading: { ...typography.small, color: Colors.teal },
    viewLink: { ...typography.caption, fontWeight: "700", color: Colors.success, textDecorationLine: "underline" },
    actionLink: { ...typography.caption, fontWeight: "700", color: Colors.teal, textDecorationLine: "underline" },
    notProvided: { ...typography.caption, color: Colors.warning },
    customTextWrap: { gap: 2 },
    customTextInput: {
      ...typography.small,
      color: Colors.textPrimary,
      backgroundColor: Colors.surface,
      borderRadius: BorderRadius.sm,
      borderWidth: 1,
      borderColor: Colors.border,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      minHeight: 44,
      textAlignVertical: "top",
    },
    customHint: { ...typography.caption, color: Colors.textMuted },
    customReadOnlyText: { ...typography.caption, color: Colors.textSecondary, fontStyle: "italic" },
  });
}
