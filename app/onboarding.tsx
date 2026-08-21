import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, BorderRadius, useScaledTypography } from "../src/theme";
import { markOnboardingSeen } from "../src/services/onboarding";

const SLIDES = [
  {
    icon: "cash-outline" as const,
    color: Colors.teal,
    title: "Borrow money fast, no collateral",
    body: "Apply in minutes and get funded straight to your MTN or Airtel mobile money — flexible terms built around what you can actually repay.",
  },
  {
    icon: "trending-up-outline" as const,
    color: Colors.gold,
    title: "Lend and earn interest",
    body: "Fund verified borrowers and earn monthly interest, repaid straight into your Mpola wallet — you choose who to lend to and on what terms.",
  },
  {
    icon: "shield-checkmark-outline" as const,
    color: Colors.success,
    title: "Safe, verified, regulated",
    body: "Every borrower is NIN-verified with guarantors on their loan, and Mpola operates under Bank of Uganda oversight.",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const typography = useScaledTypography();
  const styles = React.useMemo(() => makeStyles(typography), [typography]);
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);

  const finish = async () => {
    await markOnboardingSeen();
    router.replace("/");
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / width);
    if (next !== index) setIndex(next);
  };

  const goNext = () => {
    if (index === SLIDES.length - 1) {
      finish();
      return;
    }
    scrollRef.current?.scrollTo({ x: (index + 1) * width, animated: true });
    setIndex(index + 1);
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.skip} onPress={finish} hitSlop={12}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
      >
        {SLIDES.map((slide) => (
          <View key={slide.title} style={[styles.slide, { width }]}>
            <View style={[styles.iconBadge, { backgroundColor: slide.color + "20" }]}>
              <Ionicons name={slide.icon} size={56} color={slide.color} />
            </View>
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.body}>{slide.body}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((slide, i) => (
            <View
              key={slide.title}
              style={[
                styles.dot,
                i === index && { backgroundColor: Colors.white, width: 20 },
              ]}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.nextBtn} onPress={goNext} activeOpacity={0.85}>
          <Text style={styles.nextBtnText}>
            {index === SLIDES.length - 1 ? "Get Started" : "Next"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(typography: ReturnType<typeof useScaledTypography>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    skip: {
      position: "absolute",
      top: Spacing.lg,
      right: Spacing.xl,
      zIndex: 1,
      padding: Spacing.sm,
    },
    skipText: { ...typography.body, color: Colors.textSecondary },
    slide: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: Spacing.xxl,
    },
    iconBadge: {
      width: 140,
      height: 140,
      borderRadius: 70,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: Spacing.xxl,
    },
    title: {
      ...typography.h2,
      color: Colors.white,
      textAlign: "center",
      marginBottom: Spacing.md,
    },
    body: {
      ...typography.body,
      color: Colors.textSecondary,
      textAlign: "center",
      lineHeight: 22,
    },
    footer: {
      paddingHorizontal: Spacing.xxl,
      paddingBottom: Spacing.xl,
      alignItems: "center",
    },
    dots: {
      flexDirection: "row",
      gap: 6,
      marginBottom: Spacing.xl,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: Colors.textMuted,
    },
    nextBtn: {
      width: "100%",
      height: 54,
      borderRadius: BorderRadius.full,
      backgroundColor: Colors.teal,
      alignItems: "center",
      justifyContent: "center",
    },
    nextBtnText: { ...typography.button, color: Colors.white },
  });
}
