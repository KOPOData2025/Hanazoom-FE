"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, X, Check, Trash2, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  type NotificationItem,
} from "@/lib/api/notification";
import { toast } from "sonner";

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onNotificationUpdate?: (newCount: number) => void;
}

export default function NotificationDropdown({
  isOpen,
  onClose,
  onNotificationUpdate,
}: NotificationDropdownProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);


  const loadNotifications = async (
    page: number = 0,
    append: boolean = false
  ) => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const response = await getUserNotifications(page, 10);
      const newNotifications = response.content;

      if (append) {
        setNotifications((prev) => [...prev, ...newNotifications]);
      } else {
        setNotifications(newNotifications);
      }

      setHasMore(response.number < response.totalPages - 1);
      setCurrentPage(response.number);
    } catch (error) {
      console.error("알림 로드 실패:", error);
      toast.error("알림을 불러오는데 실패했습니다");
    } finally {
      setIsLoading(false);
    }
  };


  const loadUnreadCount = async () => {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error("읽지 않은 알림 개수 로드 실패:", error);
    }
  };


  useEffect(() => {
    if (isOpen) {
      loadNotifications(0, false);
      loadUnreadCount();
    }
  }, [isOpen]);


  const loadMore = () => {
    if (hasMore && !isLoading) {
      loadNotifications(currentPage + 1, true);
    }
  };


  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
      const newCount = Math.max(0, unreadCount - 1);
      setUnreadCount(newCount);

      onNotificationUpdate?.(newCount);
      toast.success("알림을 읽음 처리했습니다", {
        action: {
          label: "✕",
          onClick: () => {},
        },
      });
    } catch (error) {
      toast.error("알림 읽음 처리에 실패했습니다");
    }
  };


  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, isRead: true }))
      );
      setUnreadCount(0);

      onNotificationUpdate?.(0);
      toast.success("모든 알림을 읽음 처리했습니다", {
        action: {
          label: "✕",
          onClick: () => {},
        },
      });
    } catch (error) {
      toast.error("모든 알림 읽음 처리에 실패했습니다");
    }
  };


  const handleDelete = async (notificationId: number) => {
    try {
      await deleteNotification(notificationId);
      setNotifications((prev) =>
        prev.filter((notif) => notif.id !== notificationId)
      );

      const deletedNotification = notifications.find(
        (n) => n.id === notificationId
      );
      if (deletedNotification && !deletedNotification.isRead) {
        const newCount = Math.max(0, unreadCount - 1);
        setUnreadCount(newCount);

        onNotificationUpdate?.(newCount);
      }
      toast.success("알림을 삭제했습니다", {
        action: {
          label: "✕",
          onClick: () => {},
        },
      });
    } catch (error) {
      toast.error("알림 삭제에 실패했습니다");
    }
  };


  const handleNotificationClick = async (notification: NotificationItem) => {

    if (!notification.isRead) {
      await handleMarkAsRead(notification.id);
    }


    if (notification.targetUrl) {
      router.push(notification.targetUrl);
      onClose();
    }
  };


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div
        ref={dropdownRef}
        className="fixed z-[100] top-16 right-4 w-96 max-h-[600px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        <div className="max-h-[500px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                알림이 없습니다
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer ${
                    !notification.isRead ? "bg-blue-50 dark:bg-blue-900/20" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4
                          className={`text-sm font-medium ${
                            !notification.isRead
                              ? "text-gray-900 dark:text-white"
                              : "text-gray-600 dark:text-gray-400"
                          }`}
                        >
                          {notification.title}
                        </h4>
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                          {notification.timeAgo}
                        </span>
                      </div>

                      <p
                        className={`text-sm mt-1 ${
                          !notification.isRead
                            ? "text-gray-700 dark:text-gray-300"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {notification.content}
                      </p>

                    <div className="flex flex-col gap-1">
                      {!notification.isRead && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification.id);
                          }}
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
                        >
                          <Check className="w-3 h-3" />
                        </Button>
                      )}
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(notification.id);
                        }}
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

