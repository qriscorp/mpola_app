import { useQuery } from "@tanstack/react-query";
import { fetchNotifications } from "../services";

export function useNotificationsViewModel() {
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

  return { notifications, unreadCount, isLoading, error, refetch };
}
