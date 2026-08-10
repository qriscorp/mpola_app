import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius } from "../theme";
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
 * Profile, everything else uploads directly here as a reusable
 * BorrowerDocument that'll also satisfy any future offer asking for the
 * same thing. Pass `readOnly` for the lender's disbursement-review view —
 * verification only, no upload controls. */
export function RequiredDocumentsChecklist({
  items,
  onUpload,
  uploadingType,
  readOnly = false,
  onGoToProfile,
}: {
  items: RequiredDocumentStatus[];
  onUpload?: (documentType: BorrowerDocumentType) => void;
  uploadingType?: string | null;
  readOnly?: boolean;
  onGoToProfile?: () => void;
}) {
  if (items.length === 0) return null;

  return (
    <View style={{ gap: Spacing.xs }}>
      {items.map((item) => {
        const docType = BORROWER_DOC_LABEL_MAP[item.label];
        return (
          <View
            key={item.label}
            style={[styles.row, item.satisfied ? styles.rowSatisfied : styles.rowMissing]}
          >
            <View style={styles.rowLeft}>
              {item.satisfied ? (
                <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
              ) : (
                <Ionicons name="ellipse-outline" size={16} color={Colors.warning} />
              )}
              <Text style={item.satisfied ? styles.labelSatisfied : styles.labelMissing}>
                {item.label}
              </Text>
            </View>
            {item.satisfied && item.fileUrl && (
              <TouchableOpacity onPress={() => Linking.openURL(item.fileUrl!)}>
                <Text style={styles.viewLink}>View</Text>
              </TouchableOpacity>
            )}
            {!item.satisfied && readOnly && <Text style={styles.notProvided}>Not provided</Text>}
            {!readOnly && !item.satisfied && item.source === "kyc" && (
              <TouchableOpacity onPress={onGoToProfile}>
                <Text style={styles.actionLink}>Upload from Profile</Text>
              </TouchableOpacity>
            )}
            {!readOnly && !item.satisfied && item.source === "borrower_doc" && docType && (
              <TouchableOpacity
                onPress={() => onUpload?.(docType)}
                disabled={uploadingType === docType}
              >
                <Text style={styles.actionLink}>
                  {uploadingType === docType ? "Uploading…" : "Upload"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  rowSatisfied: { borderColor: Colors.success + "40", backgroundColor: Colors.successBg },
  rowMissing: { borderColor: Colors.warning + "40", backgroundColor: Colors.warningBg },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: Spacing.xs, flex: 1 },
  labelSatisfied: { ...Typography.small, color: Colors.success },
  labelMissing: { ...Typography.small, color: Colors.warning },
  viewLink: { ...Typography.caption, fontWeight: "700", color: Colors.success, textDecorationLine: "underline" },
  actionLink: { ...Typography.caption, fontWeight: "700", color: Colors.teal, textDecorationLine: "underline" },
  notProvided: { ...Typography.caption, color: Colors.warning },
});
