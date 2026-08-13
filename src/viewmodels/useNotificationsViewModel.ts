import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchNotifications,
  fetchNotificationsPage,
  markNotificationRead,
  markAllNotificationsRead,
} from "../services";

const PAGE_SIZE = 20;

export function useNotificationsViewModel() {
  const queryClient = useQueryClient();

  const {
    data: notifications = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    refetch,
    markRead: (id: string) => markReadMutation.mutate(id),
    markAllRead: () => markAllReadMutation.mutate(),
  };
}

/** Paginated ("Load More") feed for the full Notifications screens
 * (borrower + lender) — the plain useNotificationsViewModel above stays
 * capped at 50 for lightweight consumers like the home screen's unread
 * badge, but a real account's full history can run into the hundreds or
 * thousands, so the actual notifications screen loads it a page at a time
 * instead of rendering everything at once. */
export function useNotificationsFeedViewModel() {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["notifications-feed"],
    queryFn: ({ pageParam }) => fetchNotificationsPage(pageParam, PAGE_SIZE),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, p) => sum + p.notifications.length, 0);
      return loaded < lastPage.total ? loaded : undefined;
    },
  });

  const notifications = data?.pages.flatMap((p) => p.notifications) ?? [];
  const unreadCount = data?.pages[0]?.unread ?? 0;
  const total = data?.pages[0]?.total ?? 0;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["notifications-feed"] });
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: invalidate,
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: invalidate,
  });

  return {
    notifications,
    unreadCount,
    total,
    isLoading,
    error,
    refetch,
    loadMore: fetchNextPage,
    hasMore: !!hasNextPage,
    isLoadingMore: isFetchingNextPage,
    markRead: (id: string) => markReadMutation.mutate(id),
    markAllRead: () => markAllReadMutation.mutate(),
  };
}
