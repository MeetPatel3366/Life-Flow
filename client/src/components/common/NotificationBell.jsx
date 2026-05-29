import { useState, useRef, useEffect, useCallback } from "react";
import { HiBell } from "react-icons/hi";
import { useDispatch, useSelector } from "react-redux";
import { getNotifications } from "../../store/notificationSlice";
import notificationApi from "../../api/notificationApi";
import { formatRelativeTime } from "../../utils/formatters";
import { useAuth } from "../../hooks/useAuth";

const POLL_INTERVAL = 30000; 

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();
  const { notifications, unreadCount, loading } = useSelector(state => state.notification);

  const fetchNotifications = useCallback(() => {
    if (isAuthenticated) {
      dispatch(getNotifications({ page: 1, limit: 15 }));
    }
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleRead = async (id) => {
    try {
      await notificationApi.markAsRead(id);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const getTypeStyle = (type) => {
    switch (type) {
      case "request": return "border-l-blue-500";
      case "transfer": return "border-l-cyan-500";
      case "donation": return "border-l-red-500";
      case "approval": return "border-l-green-500";
      case "complaint": return "border-l-orange-500";
      default: return "border-l-surface-300";
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-surface-100 transition-colors cursor-pointer"
        aria-label="Notifications"
      >
        <HiBell className="w-5 h-5 text-surface-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 px-1 bg-primary-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-[22rem] sm:w-96 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-xl border border-surface-100 z-50 animate-fade-in overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-surface-100 bg-surface-50">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-surface-900">Notifications</h4>
              {unreadCount > 0 && (
                <span className="text-[10px] bg-primary-100 text-primary-700 font-bold px-1.5 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium cursor-pointer"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => fetchNotifications()}
                className="text-xs text-surface-400 hover:text-surface-600 cursor-pointer"
                title="Refresh"
              >
                ↻
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12 px-4">
                <HiBell className="w-10 h-10 text-surface-200 mx-auto mb-2" />
                <p className="text-sm text-surface-400">No notifications yet</p>
                <p className="text-xs text-surface-300 mt-1">You'll be notified about important updates here</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => !n.isRead && handleRead(n._id)}
                  className={`px-4 py-3 border-b border-surface-50 hover:bg-surface-50 cursor-pointer transition-colors border-l-3 ${getTypeStyle(n.type)} ${
                    !n.isRead ? "bg-primary-50/40" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm text-surface-800 truncate ${!n.isRead ? "font-semibold" : "font-medium"}`}>
                          {n.title}
                        </p>
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0"></span>
                        )}
                      </div>
                      <p className="text-xs text-surface-500 mt-0.5 line-clamp-2">{n.message}</p>
                    </div>
                    <p className="text-[10px] text-surface-400 flex-shrink-0 mt-0.5">
                      {formatRelativeTime(n.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
