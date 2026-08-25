import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchChatConversations,
  fetchChatUnreadCount,
  fetchLoanChat,
  postLoanChatMessage,
} from "../services";

export function useChatConversationsViewModel() {
  const { data: conversations, isLoading, error, refetch } = useQuery({
    queryKey: ["chat", "conversations"],
    queryFn: fetchChatConversations,
  });
  return { conversations: conversations ?? [], isLoading, error, refetch };
}

export function useChatUnreadCountViewModel() {
  return useQuery({
    queryKey: ["chat", "unread-count"],
    queryFn: fetchChatUnreadCount,
    // Read receipts elsewhere (opening a thread) don't otherwise trigger a
    // refetch of this badge while the app is just sitting on Home — a
    // short poll keeps it honest without a dedicated invalidation path
    // for every place a message could arrive.
    refetchInterval: 30_000,
  });
}

export function useLoanChatViewModel(loanId: string) {
  const queryClient = useQueryClient();
  const [text, setText] = useState("");

  const { data: chat, isLoading, error } = useQuery({
    queryKey: ["chat", "loan", loanId],
    queryFn: () => fetchLoanChat(loanId),
    enabled: !!loanId,
  });

  const sendMutation = useMutation({
    mutationFn: (message: string) => postLoanChatMessage(loanId, message),
    onSuccess: () => {
      setText("");
      queryClient.invalidateQueries({ queryKey: ["chat", "loan", loanId] });
      queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] });
    },
  });

  const send = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    sendMutation.mutate(trimmed);
  };

  return {
    chat,
    isLoading,
    error,
    text,
    setText,
    send,
    sending: sendMutation.isPending,
  };
}
