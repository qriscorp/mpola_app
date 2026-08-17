import { useMemo } from "react";
import { useFontScale } from "./FontScaleContext";
import { Typography as BaseTypography } from "./tokens";

type TypographyScale = typeof BaseTypography;

/** Scaled copy of the base Typography tokens, recomputed only when the
 * user's font-scale preference changes. Screens build their StyleSheet
 * inside the component (in a useMemo keyed on this), spreading
 * `...typography.h1` instead of the static `...Typography.h1`, so their
 * text actually responds to Profile > Settings > Text Size. */
export function useScaledTypography(): TypographyScale {
  const { scale } = useFontScale();
  return useMemo(() => {
    const entries = (Object.keys(BaseTypography) as (keyof TypographyScale)[]).map((key) => {
      const t = BaseTypography[key];
      return [
        key,
        { ...t, fontSize: Math.round(t.fontSize * scale), lineHeight: Math.round(t.lineHeight * scale) },
      ] as const;
    });
    return Object.fromEntries(entries) as TypographyScale;
  }, [scale]);
}
