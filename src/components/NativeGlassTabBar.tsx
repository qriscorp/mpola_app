import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { GlassView, isGlassEffectAPIAvailable } from "expo-glass-effect";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "../theme";

const INACTIVE_NAV_COLOR = "#C2CFD8";

type NativeGlassTabBarProps = BottomTabBarProps & {
  accentColor: string;
  visibleRoutes: readonly string[];
};

export function NativeGlassTabBar({
  state,
  descriptors,
  navigation,
  accentColor,
  visibleRoutes,
}: NativeGlassTabBarProps) {
  const insets = useSafeAreaInsets();
  const supportsLiquidGlass =
    Platform.OS === "ios" && isGlassEffectAPIAvailable();

  return (
    <View
      pointerEvents="box-none"
      style={[styles.safeArea, { paddingBottom: Math.max(insets.bottom, 8) }]}
    >
      <GlassView
        glassEffectStyle="clear"
        tintColor="rgba(20, 38, 52, 0.18)"
        style={[
          styles.bar,
          !supportsLiquidGlass && styles.materialFallback,
        ]}
      >
        <View pointerEvents="none" style={styles.contrastScrim} />
        {state.routes.filter((route) => visibleRoutes.includes(route.name)).map((route) => {
          const { options } = descriptors[route.key];
          const focused = state.routes[state.index]?.key === route.key;
          const color = focused ? accentColor : INACTIVE_NAV_COLOR;
          const label =
            typeof options.tabBarLabel === "string"
              ? options.tabBarLabel
              : options.title ?? route.name;
          const badge = options.tabBarBadge;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({ type: "tabLongPress", target: route.key });
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onLongPress={onLongPress}
              onPress={onPress}
              style={({ pressed }) => [
                styles.item,
                focused && {
                  backgroundColor: `${accentColor}22`,
                  borderColor: `${accentColor}45`,
                },
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.iconWrap}>
                {options.tabBarIcon?.({ focused, color, size: 25 })}
                {badge != null ? (
                  <View style={[styles.badge, { backgroundColor: accentColor }]}>
                    <Text style={styles.badgeText}>{String(badge)}</Text>
                  </View>
                ) : null}
              </View>
              <Text
                numberOfLines={1}
                style={[styles.label, { color }, focused && styles.labelActive]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </GlassView>
    </View>
  );
}

const styles = StyleSheet.create<{
  safeArea: ViewStyle;
  bar: ViewStyle;
  materialFallback: ViewStyle;
  contrastScrim: ViewStyle;
  item: ViewStyle;
  pressed: ViewStyle;
  iconWrap: ViewStyle;
  label: TextStyle;
  labelActive: TextStyle;
  badge: ViewStyle;
  badgeText: TextStyle;
}>({
  safeArea: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    backgroundColor: "transparent",
    paddingHorizontal: 12,
    paddingTop: 7,
  },
  bar: {
    minHeight: 66,
    overflow: "hidden",
    borderRadius: 28,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 255, 255, 0.18)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 12,
  },
  materialFallback: {
    backgroundColor: "rgba(27, 43, 58, 0.88)",
  },
  contrastScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(6, 15, 24, 0.18)",
  },
  item: {
    flex: 1,
    minHeight: 52,
    borderRadius: 22,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  pressed: {
    transform: [{ scale: 0.96 }],
  },
  iconWrap: {
    position: "relative",
  },
  label: {
    maxWidth: "96%",
    fontSize: 11.5,
    fontWeight: "600",
    letterSpacing: 0,
    textShadowColor: "rgba(0, 0, 0, 0.22)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  labelActive: {
    fontWeight: "700",
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -10,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: Colors.background,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: "700",
    lineHeight: 11,
  },
});
