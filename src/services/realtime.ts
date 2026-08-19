/**
 * Live notification/wallet push over WebSocket — mirrors the website's
 * implementation. React Native's global WebSocket works the same as a
 * browser's, so no extra dependency is needed.
 */
import { useEffect, useRef } from "react";
import { Alert } from "react-native";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { getAccessToken, API_BASE_URL } from "./auth";
import { goToTabRoot } from "./navigation";

function wsUrl(token: string): string {
  const base = API_BASE_URL.replace(/^http/, "ws");
  return `${base}/ws?token=${encodeURIComponent(token)}`;
}

export function useRealtimeNotifications(portal: "borrower" | "lender") {
  const queryClient = useQueryClient();
  const retryRef = useRef(0);

  useEffect(() => {
    // InstanceType<typeof WebSocket>, not the bare `WebSocket` type name —
    // the SDK 54 upgrade pulled in @types/node transitively, which shadows
    // the global WebSocket type with Node's (undici) version and breaks
    // this annotation; deriving from the actual runtime constructor avoids
    // the collision.
    let socket: InstanceType<typeof WebSocket> | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let closedByUs = false;
    let cancelled = false;

    const connect = async () => {
      const token = await getAccessToken();
      if (!token || cancelled) return;

      const ws = new WebSocket(wsUrl(token));
      socket = ws;

      ws.onopen = () => {
        retryRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.event !== "notification") return;
          queryClient.invalidateQueries({ queryKey: ["borrower", "notifications"] });
          queryClient.invalidateQueries({ queryKey: ["lender", "notifications"] });
          queryClient.invalidateQueries({ queryKey: ["borrower", "wallet"] });
          queryClient.invalidateQueries({ queryKey: ["borrower", "dashboard"] });
          queryClient.invalidateQueries({ queryKey: ["lender", "wallet"] });
          queryClient.invalidateQueries({ queryKey: ["borrower", "activeLoan"] });
          queryClient.invalidateQueries({ queryKey: ["lender", "portfolio"] });
          queryClient.invalidateQueries({ queryKey: ["lender", "earnings"] });
          queryClient.invalidateQueries({ queryKey: ["lender", "offer-templates"] });
          queryClient.invalidateQueries({ queryKey: ["lender", "offers"] });
          queryClient.invalidateQueries({ queryKey: ["borrower", "offers-received"] });
          queryClient.invalidateQueries({ queryKey: ["application"] });
          queryClient.invalidateQueries({ queryKey: ["guarantor-requests"] });
          queryClient.invalidateQueries({ queryKey: ["support"] });

          if (msg.type === "loan_pending_disbursement" && msg.title) {
            Alert.alert(msg.title, msg.message, [
              { text: "Later", style: "cancel" },
              { text: "Review", onPress: () => goToTabRoot("/(lender)/(tabs)/portfolio") },
            ]);
          } else if (msg.type === "loan_disbursed" && msg.title) {
            Alert.alert(msg.title, msg.message);
          } else if (msg.type === "offer_template_expired" && msg.title) {
            Alert.alert(msg.title, msg.message);
          } else if (msg.type === "lender_offer_template" && msg.title) {
            Alert.alert(msg.title, msg.message, [
              { text: "Later", style: "cancel" },
              { text: "View", onPress: () => router.push("/(lender)/my-offers") },
            ]);
          } else if (msg.type === "offer_awaiting_response" && msg.title) {
            Alert.alert(msg.title, msg.message, [
              { text: "Later", style: "cancel" },
              { text: "View", onPress: () => router.push("/(borrower)/offers") },
            ]);
          } else if (msg.type === "auto_match_cooldown_lifted" && msg.title) {
            Alert.alert(msg.title, msg.message, [
              { text: "Later", style: "cancel" },
              { text: "View", onPress: () => router.push("/(lender)/my-offers") },
            ]);
          } else if (msg.type === "offer_expired" && msg.title) {
            Alert.alert(msg.title, msg.message);
          } else if (msg.type === "low_wallet_balance" && msg.title) {
            Alert.alert(msg.title, msg.message, [
              { text: "Later", style: "cancel" },
              { text: "Top up", onPress: () => goToTabRoot("/(lender)/(tabs)/wallet") },
            ]);
          } else if (msg.type === "guarantor_invite_received" && msg.title) {
            // Approvals is a pushed stack screen in each portal now (not a
            // tab), so target it with the full path for the active role — the
            // hook is registered separately per portal — see
            // (borrower)/(tabs)/_layout.tsx and (lender)/(tabs)/_layout.tsx.
            Alert.alert(msg.title, msg.message, [
              { text: "Later", style: "cancel" },
              {
                text: "Respond",
                onPress: () =>
                  router.push(
                    portal === "lender" ? "/(lender)/approvals" : "/(borrower)/approvals",
                  ),
              },
            ]);
          } else if (msg.type === "guarantor_response" && msg.title) {
            Alert.alert(msg.title, msg.message);
          } else if (msg.type === "guarantor_still_pending" && msg.title) {
            Alert.alert(msg.title, msg.message, [
              { text: "Later", style: "cancel" },
              { text: "View", onPress: () => router.push("/(borrower)/my-requests") },
            ]);
          } else if (msg.type === "application_expired" && msg.title) {
            Alert.alert(msg.title, msg.message, [
              { text: "OK", style: "cancel" },
              { text: "View", onPress: () => router.push("/(borrower)/my-requests") },
            ]);
          } else if (msg.type === "guarantor_request_expired" && msg.title) {
            Alert.alert(msg.title, msg.message);
          } else if (msg.type === "support_reply" && msg.title) {
            // Relative push, same reasoning as guarantor_invite_received above —
            // resolves to whichever role's "help" tab this hook is mounted under.
            Alert.alert(msg.title, msg.message, [
              { text: "Later", style: "cancel" },
              { text: "View", onPress: () => router.push("help" as never) },
            ]);
          }
        } catch {
          // ignore malformed frames
        }
      };

      ws.onclose = () => {
        if (closedByUs || cancelled) return;
        const delay = Math.min(30000, 1000 * 2 ** retryRef.current);
        retryRef.current += 1;
        retryTimer = setTimeout(connect, delay);
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    return () => {
      cancelled = true;
      closedByUs = true;
      if (retryTimer) clearTimeout(retryTimer);
      socket?.close();
    };
  }, [queryClient]);
}
