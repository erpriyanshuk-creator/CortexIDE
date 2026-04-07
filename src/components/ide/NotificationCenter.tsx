'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Bell,
  BellOff,
  X,
  Check,
  AlertCircle,
  Info,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  ChevronDown,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateId } from '@/lib/types';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  persistent?: boolean;
}

interface NotificationCenterState {
  notifications: AppNotification[];
  unreadCount: number;
}

let globalListeners: Array<(n: AppNotification) => void> = [];
let notificationHistory: AppNotification[] = [];
let unreadCount = 0;

export function pushNotification(type: NotificationType, title: string, message: string, persistent = false) {
  const notification: AppNotification = {
    id: generateId(),
    type,
    title,
    message,
    timestamp: Date.now(),
    read: false,
    persistent,
  };
  notificationHistory.unshift(notification);
  unreadCount++;
  globalListeners.forEach(fn => fn(notification));
  if (!persistent) {
    setTimeout(() => {
      markRead(notification.id);
    }, 5000);
  }
  if (notificationHistory.length > 100) {
    notificationHistory = notificationHistory.slice(0, 100);
  }
  return notification.id;
}

export function markRead(id: string) {
  const n = notificationHistory.find(n => n.id === id);
  if (n && !n.read) {
    n.read = true;
    unreadCount = Math.max(0, unreadCount - 1);
  }
}

export function clearAllNotifications() {
  notificationHistory = [];
  unreadCount = 0;
}

export function useNotificationCount() {
  const [count, setCount] = useState(unreadCount);
  useEffect(() => {
    const handler = () => setCount(unreadCount);
    globalListeners.push(handler);
    return () => {
      globalListeners = globalListeners.filter(fn => fn !== handler);
    };
  }, []);
  return count;
}

const TYPE_CONFIG: Record<NotificationType, { icon: React.ReactNode; color: string; bg: string; border: string }> = {
  info: { icon: <Info className="w-4 h-4" />, color: 'text-[#89b4fa]', bg: 'bg-[#89b4fa]/10', border: 'border-[#89b4fa]/30' },
  success: { icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-[#a6e3a1]', bg: 'bg-[#a6e3a1]/10', border: 'border-[#a6e3a1]/30' },
  warning: { icon: <AlertTriangle className="w-4 h-4" />, color: 'text-[#f9e2af]', bg: 'bg-[#f9e2af]/10', border: 'border-[#f9e2af]/30' },
  error: { icon: <AlertCircle className="w-4 h-4" />, color: 'text-[#f38ba8]', bg: 'bg-[#f38ba8]/10', border: 'border-[#f38ba8]/30' },
};

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>(notificationHistory);
  const [count, setCount] = useState(unreadCount);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = () => {
      setNotifications([...notificationHistory]);
      setCount(unreadCount);
    };
    globalListeners.push(handler);
    return () => {
      globalListeners = globalListeners.filter(fn => fn !== handler);
    };
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleDismiss = useCallback((id: string) => {
    notificationHistory = notificationHistory.filter(n => n.id !== id);
    setNotifications([...notificationHistory]);
    if (count > 0) setCount(count - 1);
  }, [count]);

  const handleClearAll = useCallback(() => {
    clearAllNotifications();
    setNotifications([]);
    setCount(0);
  }, []);

  const handleMarkAllRead = useCallback(() => {
    notificationHistory.forEach(n => { n.read = true; });
    unreadCount = 0;
    setNotifications([...notificationHistory]);
    setCount(0);
  }, []);

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-2 h-6 text-[#6c7086] hover:text-[#cdd6f4] hover:bg-[#313244] transition-colors relative"
      >
        {count > 0 ? (
          <>
            <Bell className="w-3 h-3" />
            <span className="absolute -top-0.5 -right-0.5 bg-[#89b4fa] text-[#1e1e2e] w-3.5 h-3.5 rounded-full text-[8px] flex items-center justify-center font-bold animate-[nexus-bounce_0.3s_ease-in-out]">
              {count > 9 ? '9+' : count}
            </span>
          </>
        ) : (
          <BellOff className="w-3 h-3" />
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute bottom-full right-0 mb-1 w-80 bg-[#1e1e2e] border border-[#313244] rounded-lg shadow-xl overflow-hidden z-50 animate-[nexus-slide-up_0.15s_ease-out]">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-[#313244]">
            <div className="flex items-center gap-2">
              <Bell className="w-3.5 h-3.5 text-[#89b4fa]" />
              <span className="text-xs font-semibold text-[#cdd6f4]">Notifications</span>
              {count > 0 && (
                <span className="text-[9px] bg-[#89b4fa]/20 text-[#89b4fa] px-1.5 py-0.5 rounded-full">{count}</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {count > 0 && (
                <button onClick={handleMarkAllRead} className="text-[9px] text-[#6c7086] hover:text-[#cdd6f4] transition-colors">
                  Mark all read
                </button>
              )}
              <button onClick={handleClearAll} className="text-[9px] text-[#6c7086] hover:text-[#f38ba8] transition-colors">
                Clear
              </button>
            </div>
          </div>

          {/* Notifications list */}
          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-3 py-8 text-center">
                <Bell className="w-6 h-6 text-[#45475a] mx-auto mb-2" />
                <p className="text-xs text-[#6c7086]">No notifications</p>
              </div>
            ) : (
              notifications.slice(0, 20).map(n => {
                const cfg = TYPE_CONFIG[n.type];
                return (
                  <div
                    key={n.id}
                    className={cn(
                      'flex items-start gap-2.5 px-3 py-2.5 border-b border-[#313244]/50 transition-colors',
                      !n.read && 'bg-[#313244]/30',
                      'hover:bg-[#313244]/50'
                    )}
                  >
                    <div className={cn('w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5', cfg.bg, cfg.color)}>
                      {cfg.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-[#cdd6f4] truncate">{n.title}</span>
                        <span className="text-[9px] text-[#45475a] flex-shrink-0 ml-2">{formatTime(n.timestamp)}</span>
                      </div>
                      <p className="text-[10px] text-[#a6adc8] mt-0.5 line-clamp-2">{n.message}</p>
                    </div>
                    <button
                      onClick={() => handleDismiss(n.id)}
                      className="p-0.5 rounded text-[#45475a] hover:text-[#f38ba8] hover:bg-[#f38ba8]/10 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                      style={{ opacity: 1 }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function NotificationToasts() {
  const [toasts, setToasts] = useState<AppNotification[]>([]);
  const toastContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (n: AppNotification) => {
      if (n.persistent) return; // Only show toasts for non-persistent
      setToasts(prev => [...prev.slice(-3), n]);
      setTimeout(() => {
        markRead(n.id);
        setToasts(prev => prev.filter(t => t.id !== n.id));
      }, 4000);
    };
    globalListeners.push(handler);
    return () => {
      globalListeners = globalListeners.filter(fn => fn !== handler);
    };
  }, []);

  const handleDismiss = (id: string) => {
    markRead(id);
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div ref={toastContainerRef} className="fixed bottom-8 right-4 z-[100] flex flex-col gap-2 w-80">
      {toasts.map(n => {
        const cfg = TYPE_CONFIG[n.type];
        return (
          <div
            key={n.id}
            className={cn(
              'flex items-start gap-2.5 px-3 py-2.5 rounded-lg border shadow-lg backdrop-blur-sm animate-[nexus-slide-in-right_0.2s_ease-out]',
              cfg.bg, cfg.border
            )}
          >
            <div className={cn('flex-shrink-0 mt-0.5', cfg.color)}>{cfg.icon}</div>
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-medium text-[#cdd6f4]">{n.title}</span>
              <p className="text-[10px] text-[#a6adc8] mt-0.5 line-clamp-2">{n.message}</p>
            </div>
            <button onClick={() => handleDismiss(n.id)} className="text-[#6c7086] hover:text-[#cdd6f4] transition-colors flex-shrink-0">
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
