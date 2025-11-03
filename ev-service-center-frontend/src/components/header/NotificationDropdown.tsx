"use client";
import React, { useState, useCallback, useRef } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import Image from "next/image";
import { getNotifications, markAsRead, Notification } from "@/services/notificationService";
import { useAuth } from "@/hooks/useAuth";

export default function NotificationDropdown() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUnread, setTotalUnread] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedInitial = useRef(false);

  const loadNotifications = useCallback(async (page: number = 1, append: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      
      // Chỉ load notifications nếu có user
      if (!user?.id) {
        setNotifications([]);
        setTotalUnread(0);
        setNotifying(false);
        return;
      }
      
      const response = await getNotifications({ 
        page, 
        limit: 10,
        userId: user.id, // Chỉ lấy notifications của user hiện tại
      });
      
      if (append) {
        setNotifications(prev => [...prev, ...response.data]);
      } else {
        // Luôn lấy dữ liệu mới từ server, không cache
        setNotifications(response.data);
        hasLoadedInitial.current = true;
      }
      
      setHasMore(page < response.totalPages);
      setCurrentPage(page);
      
      // Count unread notifications từ server data
      const allUnreadCount = append 
        ? [...notifications, ...response.data].filter((n: Notification) => n.status !== "read").length
        : response.data.filter((n: Notification) => n.status !== "read").length;
      
      setTotalUnread(allUnreadCount);
      setNotifying(allUnreadCount > 0);
      
      console.log('Loaded notifications from server:', response.data.length);
      console.log('Unread count from server:', allUnreadCount);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setError('Không thể tải thông báo. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [user, notifications]);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadNotifications(currentPage + 1, true);
    }
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      console.log('Marking notification as read:', notificationId);
      await markAsRead(notificationId);
      
      // Không cập nhật local state, luôn fetch dữ liệu mới từ server
      console.log('Marked as read, refreshing data from server...');
      
      // Refresh notifications từ server
      await loadNotifications(1, false);
      
    } catch (error) {
      console.error('Error marking notification as read:', error);
      setError('Không thể đánh dấu đã đọc. Vui lòng thử lại.');
    }
  };

  const handleClick = () => {
    toggleDropdown();
    // Luôn fetch dữ liệu mới khi mở dropdown
    if (!isOpen) {
      console.log('Opening dropdown, fetching fresh data...');
      loadNotifications(1, false);
    }
  };

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }


  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMs = now.getTime() - date.getTime();
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

      if (diffInMinutes < 1) return 'Vừa xong';
      if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
      if (diffInHours < 24) return `${diffInHours} giờ trước`;
      if (diffInDays < 7) return `${diffInDays} ngày trước`;
      
      return date.toLocaleDateString('vi-VN');
    } catch {
      return 'Vừa xong';
    }
  };

  return (
    <div className="relative">
      <button
        className="relative dropdown-toggle flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={handleClick}
      >
        <span
          className={`absolute right-0 top-0.5 z-10 h-2 w-2 rounded-full bg-orange-400 ${!notifying ? "hidden" : "flex"
            }`}
        >
          <span className="absolute inline-flex w-full h-full bg-orange-400 rounded-full opacity-75 animate-ping"></span>
        </span>
        <svg
          className="fill-current"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>
      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute -right-[240px] mt-[17px] flex h-[400px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[361px] lg:right-0"
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
          <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Thông báo {totalUnread > 0 && `(${totalUnread})`}
          </h5>
          <button
            onClick={closeDropdown}
            className="text-gray-500 transition dropdown-toggle dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <svg
              className="fill-current"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {error ? (
            <div className="text-center py-8">
              <div className="text-red-500 dark:text-red-400 mb-2">{error}</div>
              <button
                onClick={() => loadNotifications(1, false)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                Thử lại
              </button>
            </div>
          ) : loading && notifications.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-gray-100"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Không có thông báo nào
            </div>
          ) : (
            <ul className="space-y-2">
              {notifications.map((notification) => {
                console.log('Rendering notification:', notification.id, 'status:', notification.status);
                return (
                <li key={notification.id}>
                  <DropdownItem
                    onItemClick={() => {
                      console.log('Clicked notification:', notification.id, 'status:', notification.status);
                      if (notification.status !== "read") {
                        handleMarkAsRead(notification.id);
                      }
                      if (notification.link) {
                        window.open(notification.link, '_blank');
                      }
                      // Không đóng dropdown khi click vào notification
                    }}
                    className={`flex gap-3 rounded-lg border-b border-gray-100 p-3 px-4.5 py-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5 ${
                      notification.status !== "read" ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <span className="relative block w-full h-10 rounded-full z-1 max-w-10">
                      <Image
                        width={40}
                        height={40}
                        src="/images/icons/notification.png"
                        alt="User"
                        className="w-full overflow-hidden rounded-full"
                      />
                      {notification.status !== "read" && (
                        <span className="absolute bottom-0 right-0 z-10 h-2.5 w-full max-w-2.5 rounded-full border-[1.5px] border-white bg-success-500 dark:border-gray-900"></span>
                      )}
                    </span>

                    <span className="block flex-1">
                      <span className="mb-1.5 space-x-1 block text-theme-sm text-gray-500 dark:text-gray-400">
                        <span className="font-medium text-gray-800 dark:text-white/90">
                          {notification.message}
                        </span>
                      </span>

                      <span className="flex items-center gap-2 text-gray-500 text-theme-xs dark:text-gray-400">
                        <span>{notification.user?.name || 'Hệ thống'}</span>
                        <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                        <span>{formatTime(notification.createdAt)}</span>
                      </span>
                    </span>
                  </DropdownItem>
                </li>
                );
              })}
            </ul>
          )}
          
          {hasMore && !error && (
            <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="w-full px-4 py-2 text-sm font-medium text-center text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                {loading ? 'Đang tải...' : 'Tải thêm'}
              </button>
            </div>
          )}
        </div>
      </Dropdown>
    </div>
  );
}
