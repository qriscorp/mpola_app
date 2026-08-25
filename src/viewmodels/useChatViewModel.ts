import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchChatConversations,
  fetchChatUnreadCount,
  fetchLoanChat,
  postLoanChatMessage,
  fetchAdminChat,
  postAdminChatMessage,
  ChatAttachment,
} from "../services";

export function useChatConversationsViewModel() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["chat", "conversations"],
    queryFn: fetchChatConversations,
  });
  return { conversations: data?.conversations ?? [], adminChat: data?.adminChat, isLoading, error, refetch };
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
  const [attachment, setAttachment] = useState<ChatAttachment | null>(null);

  const { data: chat, isLoading, error } = useQuery({
    queryKey: ["chat", "loan", loanId],
    queryFn: () => fetchLoanChat(loanId),
    enabled: !!loanId,
  });

  const sendMutation = useMutation({
    mutationFn: ({ message, file }: { message: string; file?: ChatAttachment }) =>
      postLoanChatMessage(loanId, message, file),
    onSuccess: () => {
      setText("");
      setAttachment(null);
      queryClient.invalidateQueries({ queryKey: ["chat", "loan", loanId] });
      queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] });
    },
  });

  const send = () => {
    const trimmed = text.trim();
    if (!trimmed && !attachment) return;
    sendMutation.mutate({ message: trimmed, file: attachment ?? undefined });
  };

  return {
    chat,
    isLoading,
    error,
    text,
    setText,
    attachment,
    setAttachment,
    send,
    sending: sendMutation.isPending,
  };
}

export function useAdminChatViewModel() {
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState<ChatAttachment | null>(null);

  const { data: chat, isLoading, error } = useQuery({
    queryKey: ["chat", "admin"],
    queryFn: fetchAdminChat,
  });

  const sendMutation = useMutation({
    mutationFn: ({ message, file }: { message: string; file?: ChatAttachment }) =>
      postAdminChatMessage(message, file),
    onSuccess: () => {
      setText("");
      setAttachment(null);
      queryClient.invalidateQueries({ queryKey: ["chat", "admin"] });
      queryClient.invalidateQueries({ queryKey: ["chat", "unread-count"] });
    },
  });

  const send = () => {
    const trimmed = text.trim();
    if (!trimmed && !attachment) return;
    sendMutation.mutate({ message: trimmed, file: attachment ?? undefined });
  };

  return {
    chat,
    isLoading,
    error,
    text,
    setText,
    attachment,
    setAttachment,
    send,
    sending: sendMutation.isPending,
  };
}
