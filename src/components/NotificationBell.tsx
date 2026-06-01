'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Bell, CheckCircle, XCircle, Clock } from 'lucide-react';
import { createClient } from '@/lib/auth/client';
import { useNotificationStore, SimulationNotification } from '@/lib/notificationStore';
import { groupNotifications, type NotificationGroup } from '@/lib/notificationGroups';
import {
  getNotificationPhaseLabel,
  getPhaseRowTitle,
  resolveNotificationPhase,
  type NotificationPhase,
} from '@/lib/notificationLabels';
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

const PIPELINE_PHASES: NotificationPhase[] = ['simulation', 'analysis'];

function PhaseStatusPill({ notification }: { notification: SimulationNotification }) {
  const isCompleted = notification.status === 'completed';
  return (
    <span
      className={cn(
        'rounded-full px-1.5 py-0.5 text-[10px] font-medium',
        isCompleted ? 'bg-primary-50 text-primary' : 'bg-destructive/10 text-destructive'
      )}
    >
      {isCompleted ? 'Done' : 'Failed'}
    </span>
  );
}

function PhaseTimingRow({
  phaseKey,
  notification,
}: {
  phaseKey: NotificationPhase;
  notification: SimulationNotification | undefined;
}) {
  const title = getPhaseRowTitle(phaseKey);

  if (!notification) {
    return (
      <div className="px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold text-foreground">{title}</span>
          <span className="text-[10px] font-medium text-muted-foreground">In progress…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 py-2.5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold text-foreground">{title}</span>
        <PhaseStatusPill notification={notification} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Started
          </p>
          <p className="mt-0.5 text-[11px] font-medium tabular-nums text-foreground">
            {formatDateTime(notification.simulation_start_at)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Completed
          </p>
          <p className="mt-0.5 text-[11px] font-medium tabular-nums text-foreground">
            {formatDateTime(notification.simulation_end_at)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Duration
          </p>
          <p className="mt-0.5 text-[11px] font-semibold tabular-nums text-foreground">
            {formatDuration(notification.simulation_start_at, notification.simulation_end_at)}
          </p>
        </div>
      </div>
    </div>
  );
}

function PhaseTimingBlock({ group }: { group: NotificationGroup }) {
  const phaseByKey = (key: NotificationPhase) =>
    group.phases.find((p) => resolveNotificationPhase(p) === key);

  return (
    <div className="divide-y rounded-md border bg-muted/30">
      {PIPELINE_PHASES.map((key) => (
        <PhaseTimingRow key={key} phaseKey={key} notification={phaseByKey(key)} />
      ))}
    </div>
  );
}

function NotificationGroupItem({ group }: { group: NotificationGroup }) {
  const allCompleted = group.phases.every((p) => p.status === 'completed');
  const errorMessage = group.phases.find((p) => p.error_message)?.error_message;

  return (
    <div
      className={cn(
        'flex flex-col gap-2.5 px-5 py-4 transition-colors hover:bg-accent',
        group.isUnread && 'bg-primary-50'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {allCompleted && !group.hasFailure ? (
            <CheckCircle className="h-3.5 w-3.5 shrink-0 text-primary" />
          ) : (
            <XCircle className="h-3.5 w-3.5 shrink-0 text-destructive" />
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {group.scenario_name ?? group.scenario_id}
            </p>
            {group.scenario_name ? (
              <p className="truncate text-[11px] text-muted-foreground">
                {group.scenario_id}
                {group.startedAt && (
                  <span className="text-muted-foreground/80">
                    {' '}
                    · Run {formatDateTime(group.startedAt)}
                  </span>
                )}
              </p>
            ) : (
              group.startedAt && (
                <p className="truncate text-[11px] text-muted-foreground">
                  Run {formatDateTime(group.startedAt)}
                </p>
              )
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{formatRelativeTime(group.created_at)}</span>
        </div>
      </div>

      {errorMessage && (
        <p className="text-[11px] text-muted-foreground line-clamp-2">{errorMessage}</p>
      )}

      <PhaseTimingBlock group={group} />
    </div>
  );
}

interface MiniPopup {
  id: string;
  group: NotificationGroup;
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

  const groups = useMemo(() => groupNotifications(notifications), [notifications]);

  useEffect(() => {
    if (!isLoaded || prevUnreadRef.current === null) {
      prevUnreadRef.current = unreadCount;
      return;
    }

    if (unreadCount > prevUnreadRef.current) {
      queueMicrotask(() => {
        setRinging(true);
        setTimeout(() => setRinging(false), 700);

        const latestGroup = groups.find((g) => g.isUnread);
        if (latestGroup) {
          const popupId = latestGroup.key;
          setPopups((prev) => {
            const without = prev.filter((p) => p.id !== popupId);
            return [...without, { id: popupId, group: latestGroup }];
          });
          setTimeout(() => {
            setPopups((prev) => prev.filter((p) => p.id !== popupId));
          }, 4500);
        }
      });
    }

    prevUnreadRef.current = unreadCount;
  }, [unreadCount, isLoaded, groups]);

  // Same run: refresh mini popup when Analysis phase arrives (no extra bell ring).
  useEffect(() => {
    if (!isLoaded) return;
    const latestUnread = groups.find((g) => g.isUnread);
    if (!latestUnread) return;
    queueMicrotask(() => {
      setPopups((prev) => {
        const idx = prev.findIndex((p) => p.id === latestUnread.key);
        if (idx < 0) return prev;
        const next = [...prev];
        next[idx] = { id: latestUnread.key, group: latestUnread };
        return next;
      });
    });
  }, [groups, isLoaded]);

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
      <div className="fixed right-6 top-16 z-50 flex flex-col gap-2">
        {popups.map((popup) => {
          const allCompleted =
            popup.group.phases.every((p) => p.status === 'completed') &&
            !popup.group.hasFailure;
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
                {allCompleted ? (
                  <CheckCircle className="h-4 w-4 text-primary" />
                ) : (
                  <XCircle className="h-4 w-4 text-destructive" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {popup.group.scenario_name ?? popup.group.scenario_id}
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {popup.group.phases.map((phase) => (
                    <span
                      key={phase.id}
                      className={cn(
                        'rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                        phase.status === 'completed'
                          ? 'bg-primary-50 text-primary'
                          : 'bg-destructive/10 text-destructive'
                      )}
                    >
                      {getNotificationPhaseLabel(phase)}
                    </span>
                  ))}
                </div>
                {popup.group.startedAt && popup.group.completedAt && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDuration(popup.group.startedAt, popup.group.completedAt)}
                  </p>
                )}
              </div>
              <Bell className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </button>
          );
        })}
      </div>

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
              {isLoaded && unreadCount === 0 && groups.length > 0 && (
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
              ) : groups.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
                  <Bell className="h-7 w-7 opacity-25" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                groups.map((g) => <NotificationGroupItem key={g.key} group={g} />)
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
