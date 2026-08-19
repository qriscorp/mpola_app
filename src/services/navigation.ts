import { router } from "expo-router";

/** Jump to a tab root (e.g. "/(borrower)/(tabs)/home") from anywhere.
 *
 * First pops the whole in-app stack back to the tabs (dismissAll), then
 * switches the active tab. Without the dismissAll, navigating to a tab root
 * from a pushed screen would stack a second copy of the tabs on top of the
 * stale screens below it — so the back button would land on a screen the
 * user already finished, instead of on home.
 */
export function goToTabRoot(href: Parameters<typeof router.push>[0]) {
  // Only pop when there's actually a stack to collapse — dismissing an
  // already-rooted stack dispatches a POP_TO_TOP no navigator can handle.
  if (router.canDismiss()) {
    router.dismissAll();
  }
  router.push(href);
}