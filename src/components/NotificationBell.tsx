'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Bell, CheckCircle, XCircle, Clock, Play, Timer } from 'lucide-react';
import { createClient } from '@/lib/auth/client';
import { useNotificationStore, SimulationNotification } from '@/lib/notificationStore';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-US', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function formatDuration(startStr: string | null, endStr: string | null): string {
  if (!startStr || !endStr) return '—';
  const ms = new Date(endStr).getTime() - new Date(startStr).getTime();
  if (ms < 0) return '—';
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function NotificationItem({ notification }: { notification: SimulationNotification }) {
  const isCompleted = notification.status === 'completed';

  return (
    <div
      className={cn(
        'flex flex-col gap-2.5 px-5 py-4 transition-colors hover:bg-accent',
        !notification.read_at && 'bg-primary-50'
      )}
    >
      {/* Row 1: icon + name + relative time */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {isCompleted ? (
            <CheckCircle className="h-3.5 w-3.5 shrink-0 text-primary" />
          ) : (
            <XCircle className="h-3.5 w-3.5 shrink-0 text-destructive" />
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {notification.scenario_name ?? notification.scenario_id}
            </p>
            {notification.scenario_name && (
              <p className="truncate text-[11px] text-muted-foreground">
                {notification.scenario_id}
              </p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{formatRelativeTime(notification.created_at)}</span>
        </div>
      </div>

      {/* Row 2: status badge */}
      <div className="flex flex-col gap-1">
        <span
          className={cn(
            'inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[11px] font-medium',
            isCompleted
              ? 'bg-primary-50 text-primary'
              : 'bg-destructive/10 text-destructive'
          )}
        >
          {isCompleted ? 'Simulation completed' : 'Simulation failed'}
        </span>
        {!isCompleted && notification.error_message && (
          <p className="text-[11px] text-muted-foreground line-clamp-2">
            {notification.error_message}
          </p>
        )}
      </div>

      {/* Row 3: time grid */}
      <div className="grid grid-cols-3 gap-1 rounded-md border bg-muted/40 px-3 py-2.5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
            <Play className="h-2.5 w-2.5" />
            Started
          </div>
          <span className="text-[11px] font-medium text-foreground">
            {formatDateTime(notification.simulation_start_at)}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
            <CheckCircle className="h-2.5 w-2.5" />
            Completed
          </div>
          <span className="text-[11px] font-medium text-foreground">
            {formatDateTime(notification.simulation_end_at)}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
            <Timer className="h-2.5 w-2.5" />
            Duration
          </div>
          <span className="text-[11px] font-semibold text-foreground">
            {formatDuration(notification.simulation_start_at, notification.simulation_end_at)}
          </span>
        </div>
      </div>
    </div>
  );
}

interface MiniPopup {
  id: string;
  notification: SimulationNotification;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [ringing, setRinging] = useState(false);
  const [popups, setPopups] = useState<MiniPopup[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);
  const prevUnreadRef = useRef<number | null>(null);

  const notifications = useNotificationStore((s) => s.notifications);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const isLoaded = useNotificationStore((s) => s.isLoaded);
  const markAllRead = useNotificationStore((s) => s.markAllRead);

  useEffect(() => {
    if (!isLoaded || prevUnreadRef.current === null) {
      prevUnreadRef.current = unreadCount;
      return;
    }

    if (unreadCount > prevUnreadRef.current) {
      setRinging(true);
      setTimeout(() => setRinging(false), 700);

      const latest = notifications.find((n) => !n.read_at);
      if (latest) {
        const popupId = latest.id;
        setPopups((prev) => {
          if (prev.some((p) => p.id === popupId)) return prev;
          return [...prev, { id: popupId, notification: latest }];
        });
        setTimeout(() => {
          setPopups((prev) => prev.filter((p) => p.id !== popupId));
        }, 4500);
      }
    }

    prevUnreadRef.current = unreadCount;
  }, [unreadCount, isLoaded, notifications]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleOpen = useCallback(async () => {
    const next = !open;
    setOpen(next);
    setPopups([]);

    if (next && unreadCount > 0) {
      markAllRead();
      const supabase = createClient();
      supabase
        .from('simulation_notifications')
        .update({ read_at: new Date().toISOString() })
        .is('read_at', null)
        .then(() => {});
    }
  }, [open, unreadCount, markAllRead]);

  return (
    <>
      {/* Mini popup */}
      <div className="fixed right-6 top-16 z-50 flex flex-col gap-2">
        {popups.map((popup) => {
          const isCompleted = popup.notification.status === 'completed';
          return (
            <button
              key={popup.id}
              onClick={() => {
                setPopups((prev) => prev.filter((p) => p.id !== popup.id));
                handleOpen();
              }}
              className={cn(
                'flex w-80 items-start gap-3 rounded-lg border bg-white px-4 py-3 text-left shadow-md',
                'animate-in slide-in-from-right-4 fade-in-0 duration-200',
                'transition-colors hover:bg-accent'
              )}
            >
              <div className="mt-0.5 shrink-0">
                {isCompleted ? (
                  <CheckCircle className="h-4 w-4 text-primary" />
                ) : (
                  <XCircle className="h-4 w-4 text-destructive" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {popup.notification.scenario_name ?? popup.notification.scenario_id}
                </p>
                <p className={cn('mt-0.5 text-xs', isCompleted ? 'text-primary' : 'text-destructive')}>
                  {isCompleted ? 'Simulation completed' : 'Simulation failed'}
                  {isCompleted &&
                    popup.notification.simulation_start_at &&
                    popup.notification.simulation_end_at && (
                      <span className="ml-1 text-muted-foreground">
                        · {formatDuration(popup.notification.simulation_start_at, popup.notification.simulation_end_at)}
                      </span>
                    )}
                </p>
              </div>
              <Bell className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </button>
          );
        })}
      </div>

      {/* Bell button + dropdown */}
      <div className="relative" ref={panelRef}>
        <button
          onClick={handleOpen}
          aria-label="Notifications"
          className={cn(
            'relative flex h-9 w-9 items-center justify-center rounded-md transition-colors',
            'text-primary hover:bg-primary/10',
            open && 'bg-primary/10',
            ringing && 'animate-ring'
          )}
        >
          <Bell className="h-5 w-5" strokeWidth={2} />
          {isLoaded && unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-0.5 text-[10px] font-semibold leading-none text-primary-foreground shadow-sm">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute right-0 top-10 z-50 w-[26rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between border-b px-5 py-3">
              <span className="text-sm font-semibold text-foreground">Notifications</span>
              {isLoaded && unreadCount === 0 && notifications.length > 0 && (
                <span className="text-xs text-muted-foreground">All caught up</span>
              )}
              {isLoaded && unreadCount > 0 && (
                <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-semibold text-primary">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="max-h-[36rem] divide-y overflow-y-auto">
              {!isLoaded ? (
                <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                  Loading...
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
                  <Bell className="h-7 w-7 opacity-25" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                notifications.map((n) => <NotificationItem key={n.id} notification={n} />)
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
