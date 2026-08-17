import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, Spacing, BorderRadius, useScaledTypography } from "../theme";

interface Props {
  progress: number; // 0..1
  color?: string;
  height?: number;
  showLabel?: boolean;
}

export function ProgressBar({
  progress,
  color = Colors.teal,
  height = 6,
  showLabel,
}: Props) {
  const typography = useScaledTypography();
  const styles = useMemo(() => makeStyles(typography), [typography]);
  const pct = Math.min(Math.max(progress, 0), 1);
  return (
    <View>
      <View style={[styles.track, { height }]}>
        <View
          style={[
            styles.fill,
            { width: `${pct * 100}%`, backgroundColor: color, height },
          ]}
        />
      </View>
      {showLabel && <Text style={styles.label}>{Math.round(pct * 100)}%</Text>}
    </View>
  );
}

function makeStyles(typography: ReturnType<typeof useScaledTypography>) {
  return StyleSheet.create({
    track: {
      backgroundColor: Colors.border,
      borderRadius: BorderRadius.full,
      overflow: "hidden",
    },
    fill: {
      borderRadius: BorderRadius.full,
    },
    label: {
      ...typography.small,
      color: Colors.textSecondary,
      marginTop: 4,
      textAlign: "right",
    },
  });
}
