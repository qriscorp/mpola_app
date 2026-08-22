import type { AlertButton, AlertTone } from "../components/AlertModal";

export interface AlertState {
  title: string;
  message?: string;
  buttons: AlertButton[];
  tone: AlertTone;
}

// Singleton function + one mounted renderer (AlertHost, in app/_layout.tsx) —
// the same shape mpola_website uses for sonner's toast.*(), hand-built here
// since no RN toast/alert library is installed. A plain module-level
// listener (not React Context) so this also works from services/realtime.ts,
// which isn't a component and can't consume a hook.
let listener: ((state: AlertState | null) => void) | null = null;

export function registerAlertListener(fn: ((state: AlertState | null) => void) | null): void {
  listener = fn;
}

function inferTone(title: string): AlertTone {
  const t = title.toLowerCase();
  if (/fail|error|declin|reject|expired|invalid|unable|cannot|can.t|denied/.test(t)) return "danger";
  if (/success|sent|saved|posted|updated|approved|verified|confirmed|complete|ready/.test(t)) return "success";
  if (/warning|caution|heads up/.test(t)) return "warning";
  return "default";
}

/** Drop-in themed replacement for React Native's Alert.alert — same
 * (title, message?, buttons?) shape, so existing call sites migrate by
 * swapping the import and function name only. Tone (icon/accent color) is
 * inferred from the title text; pass your own via `buttons[].style` for
 * destructive actions same as Alert.alert's own API. */
export function showAlert(title: string, message?: string, buttons?: AlertButton[]): void {
  listener?.({
    title,
    message,
    buttons: buttons?.length ? buttons : [{ text: "OK" }],
    tone: inferTone(title),
  });
}
