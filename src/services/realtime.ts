/**
 * Live notification/wallet push over WebSocket — mirrors the website's
 * implementation. React Native's global WebSocket works the same as a
 * browser's, so no extra dependency is needed.
 */
import { useEffect, useRef } from "react";
import { Alert } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { getAccessToken, API_BASE_URL } from "./auth";

function wsUrl(token: string): string {
  const base = API_BASE_URL.replace(/^http/, "ws");
  return `${base}/ws?token=${encodeURIComponent(token)}`;
}

export function useRealtimeNotifications() {
  const queryClient = useQueryClient();
  const retryRef = useRef(0);

  useEffect(() => {
    let socket: WebSocket | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let closedByUs = false;
    let cancelled = false;

    const connect = async () => {
      const token = await getAccessToken();
      if (!token || cancelled) return;

      socket = new WebSocket(wsUrl(token));

      socket.onopen = () => {
        retryRef.current = 0;
      };

      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.event !== "notification") return;
          queryClient.invalidateQueries({ queryKey: ["borrower", "notifications"] });
          queryClient.invalidateQueries({ queryKey: ["lender", "notifications"] });
          queryClient.invalidateQueries({ queryKey: ["borrower", "wallet"] });
          queryClient.invalidateQueries({ queryKey: ["lender", "wallet"] });
          queryClient.invalidateQueries({ queryKey: ["borrower", "activeLoan"] });
          queryClient.invalidateQueries({ queryKey: ["lender", "portfolio"] });
          queryClient.invalidateQueries({ queryKey: ["lender", "earnings"] });

          if (msg.type === "loan_pending_disbursement" && msg.title) {
            Alert.alert(msg.title, msg.message);
          } else if (msg.type === "loan_disbursed" && msg.title) {
            Alert.alert(msg.title, msg.message);
          }
        } catch {
          // ignore malformed frames
        }
      };

      socket.onclose = () => {
        if (closedByUs || cancelled) return;
        const delay = Math.min(30000, 1000 * 2 ** retryRef.current);
        retryRef.current += 1;
        retryTimer = setTimeout(connect, delay);
      };

      socket.onerror = () => {
        socket?.close();
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
