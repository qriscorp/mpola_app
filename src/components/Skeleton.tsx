import React, { useEffect } from "react";
import { View, ViewStyle, DimensionValue } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Colors, Spacing, BorderRadius } from "../theme";

/** A single pulsing placeholder box — the building block for every skeleton screen. */
export function SkeletonBox({
  width = "100%",
  height = 16,
  radius = BorderRadius.sm,
  style,
}: {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}) {
  const opacity = useSharedValue(0.35);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.85, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: Colors.surfaceLift,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

/** A card-shaped skeleton — icon/avatar + a couple of lines, matching most list rows. */
export function SkeletonCard({
  height = 96,
  style,
}: {
  height?: number;
  style?: ViewStyle;
}) {
  return (
    <View
      style={[
        {
          backgroundColor: Colors.surface,
          borderRadius: BorderRadius.lg,
          padding: Spacing.lg,
          height,
          justifyContent: "center",
          gap: Spacing.sm,
        },
        style,
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.md }}>
        <SkeletonBox width={40} height={40} radius={20} />
        <View style={{ flex: 1, gap: Spacing.xs }}>
          <SkeletonBox width="60%" height={14} />
          <SkeletonBox width="40%" height={11} />
        </View>
      </View>
    </View>
  );
}

/** N stacked SkeletonCards — for lists of offers/loans/notifications/transactions. */
export function SkeletonList({
  count = 3,
  cardHeight = 96,
  gap = Spacing.md,
}: {
  count?: number;
  cardHeight?: number;
  gap?: number;
}) {
  return (
    <View style={{ gap }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} height={cardHeight} />
      ))}
    </View>
  );
}

/** A row of small stat cards — e.g. 3 or 4 across the top of a dashboard. */
export function SkeletonStatRow({ count = 3 }: { count?: number }) {
  return (
    <View style={{ flexDirection: "row", gap: Spacing.md }}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            backgroundColor: Colors.surface,
            borderRadius: BorderRadius.lg,
            padding: Spacing.md,
            gap: Spacing.sm,
          }}
        >
          <SkeletonBox width="70%" height={11} />
          <SkeletonBox width="50%" height={18} />
        </View>
      ))}
    </View>
  );
}

/** A big hero card — wallet balance, dashboard summary, profile header. */
export function SkeletonHero({ height = 160 }: { height?: number }) {
  return (
    <View
      style={{
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xl,
        padding: Spacing.xl,
        height,
        alignItems: "center",
        justifyContent: "center",
        gap: Spacing.md,
      }}
    >
      <SkeletonBox width={140} height={12} />
      <SkeletonBox width={180} height={30} />
      <View style={{ flexDirection: "row", gap: Spacing.md, marginTop: Spacing.sm }}>
        <SkeletonBox width={100} height={36} radius={BorderRadius.full} />
        <SkeletonBox width={100} height={36} radius={BorderRadius.full} />
      </View>
    </View>
  );
}

/** Full-screen composite: hero card + stat row + list — the common dashboard/wallet shape. */
export function SkeletonScreen({
  showHero = true,
  showStats = true,
  listCount = 3,
}: {
  showHero?: boolean;
  showStats?: boolean;
  listCount?: number;
}) {
  return (
    <View style={{ padding: Spacing.lg, gap: Spacing.xl }}>
      {showHero && <SkeletonHero />}
      {showStats && <SkeletonStatRow />}
      <SkeletonList count={listCount} />
    </View>
  );
}
