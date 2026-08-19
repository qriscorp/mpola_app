import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as SecureStore from "expo-secure-store";

/** In-app text-size control (Profile > Settings > Text Size) — same idea as
 * kumpi_app's font-scale slider, adapted for React Native. Flutter's
 * MediaQuery.textScaler applies to every Text widget app-wide with zero
 * per-screen changes; RN has no equivalent, so screens read the current
 * scale via useScaledTypography() and rebuild their styles when it
 * changes — see that hook for the other half of this. */

const STORAGE_KEY = "font_scale_factor";
export const MIN_SCALE = 0.8;
export const MAX_SCALE = 1.6;
export const SCALE_STEP = 0.1;
export const DEFAULT_SCALE = 1.0;

interface FontScaleContextValue {
  scale: number;
  percentage: number;
  canIncrease: boolean;
  canDecrease: boolean;
  isDefault: boolean;
  increase: () => void;
  decrease: () => void;
  setScale: (value: number) => void;
  reset: () => void;
}

const FontScaleContext = createContext<FontScaleContextValue | null>(null);

function clamp(value: number): number {
  const bounded = Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));
  return Math.round(bounded * 100) / 100;
}

export function FontScaleProvider({
  children,
  onReady,
}: {
  children: React.ReactNode;
  /** Called once the saved preference has been read (or the read failed) —
   * lets the root layout hold the native splash until this resolves so the
   * blank frame this provider renders meanwhile never shows through. */
  onReady?: () => void;
}) {
  const [scale, setScaleState] = useState(DEFAULT_SCALE);
  const [loaded, setLoaded] = useState(false);
  const onReadyRef = useRef(onReady);

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    SecureStore.getItemAsync(STORAGE_KEY)
      .then((saved) => {
        if (saved) {
          const parsed = parseFloat(saved);
          if (!Number.isNaN(parsed)) setScaleState(clamp(parsed));
        }
      })
      .catch(() => {
        // A failed read just means the saved preference is unknown — fall
        // back to the default scale instead of blocking the app forever.
      })
      .finally(() => {
        setLoaded(true);
        onReadyRef.current?.();
      });
  }, []);

  const persist = useCallback((value: number) => {
    const clamped = clamp(value);
    setScaleState(clamped);
    SecureStore.setItemAsync(STORAGE_KEY, String(clamped));
  }, []);

  const value = useMemo<FontScaleContextValue>(
    () => ({
      scale,
      percentage: Math.round(scale * 100),
      canIncrease: scale < MAX_SCALE,
      canDecrease: scale > MIN_SCALE,
      isDefault: Math.abs(scale - DEFAULT_SCALE) < 0.001,
      increase: () => persist(scale + SCALE_STEP),
      decrease: () => persist(scale - SCALE_STEP),
      setScale: (v: number) => persist(v),
      reset: () => persist(DEFAULT_SCALE),
    }),
    [scale, persist],
  );

  // Wait for the saved preference to load before rendering anything, so
  // the app never flashes at 100% then jumps to the user's real setting.
  if (!loaded) return null;

  return <FontScaleContext.Provider value={value}>{children}</FontScaleContext.Provider>;
}

export function useFontScale(): FontScaleContextValue {
  const ctx = useContext(FontScaleContext);
  if (!ctx) throw new Error("useFontScale must be used within FontScaleProvider");
  return ctx;
}
