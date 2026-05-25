import React from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { timeAgo } from '../../utils/helpers';
import { useNavigate } from 'react-router-dom';

export default function NotificationPanel({ onClose }) {
  const { notifications, markAllRead, markRead } = useNotifications();
  const navigate = useNavigate();

  const handleClick = (notif) => {
    markRead(notif._id);
    if (notif.link) navigate(notif.link);
    onClose();
  };

  const typeIcon = { order: '📦', message: '💬', review: '⭐', system: '🔔', listing: '📋' };

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-hover border border-gray-100 z-50 animate-fadeIn overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 className="font-syne font-semibold text-sm">Notifications</h3>
        <button onClick={markAllRead} className="text-xs text-[#2D6A4F] hover:underline">Mark all read</button>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="py-10 text-center text-gray-400 text-sm">No notifications yet</div>
        ) : (
          notifications.slice(0, 20).map(n => (
            <button
              key={n._id}
              onClick={() => handleClick(n)}
              className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 ${!n.read ? 'bg-[#f0fdf4]' : ''}`}
            >
              <div className="flex gap-3">
                <span className="text-lg flex-shrink-0">{typeIcon[n.type] || '🔔'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{n.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.read && <div className="w-2 h-2 bg-[#2D6A4F] rounded-full mt-1.5 flex-shrink-0" />}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
