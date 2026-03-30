'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/auth/client';
import { useSimulationNotificationStore } from '@/lib/simulationNotificationStore';
import { toast } from '@/hooks/useToast';

const POLL_INTERVAL = 5000;
const MAX_POLL_DURATION = 15 * 60 * 1000;
const NOTIFIED_CACHE_MAX = 50;

function showCompletedToast(data: {
  simulation_start_at?: string;
  simulation_end_at?: string;
}) {
  let durationText = '';
  if (data.simulation_start_at && data.simulation_end_at) {
    const duration =
      new Date(data.simulation_end_at).getTime() -
      new Date(data.simulation_start_at).getTime();
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    durationText = ` (Duration: ${minutes}m ${seconds}s)`;
  }
  toast({
    title: 'Simulation Completed',
    description: data.simulation_end_at
      ? `Completed at ${new Date(data.simulation_end_at).toLocaleString()}${durationText}`
      : 'Simulation has been completed successfully.',
  });
}

function showFailedToast(error?: string) {
  toast({
    title: 'Simulation Failed',
    description: error || 'Failed to complete simulation.',
    variant: 'destructive',
    duration: 10000,
  });
}

/**
 * 앱 레이아웃 레벨에서 시뮬레이션 완료/실패를 감시하는 컴포넌트.
 *
 * 이중 구조로 알림 확실성을 보장:
 * 1. Supabase Realtime (주): 모든 기기/브라우저에 즉시 알림 (RLS가 유저별 필터링)
 * 2. Polling (보조): Realtime 연결 실패 시 같은 브라우저 내 localStorage 기반 백업
 */
export default function SimulationWatcher() {
  const pending = useSimulationNotificationStore((s) => s.pending);
  const removePending = useSimulationNotificationStore((s) => s.removePending);
  const notifiedRef = useRef<Set<string>>(new Set());

  const markNotified = (scenarioId: string) => {
    notifiedRef.current.add(scenarioId);
    removePending(scenarioId);
    if (notifiedRef.current.size > NOTIFIED_CACHE_MAX) {
      const first = notifiedRef.current.values().next().value;
      if (first) notifiedRef.current.delete(first);
    }
  };

  // ── 1. Supabase Realtime: 모든 기기에 즉시 알림 ──
  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const timer = setTimeout(() => {
      channel = supabase
        .channel('simulation-status-watcher')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'scenario_information',
          },
          (payload) => {
            const newStatus = payload.new.simulation_status;
            const oldStatus = payload.old?.simulation_status;
            const scenarioId = payload.new.scenario_id;

            if (newStatus === oldStatus || notifiedRef.current.has(scenarioId)) return;

            if (newStatus === 'completed') {
              markNotified(scenarioId);
              showCompletedToast(payload.new);
            } else if (newStatus === 'failed') {
              markNotified(scenarioId);
              showFailedToast(payload.new.simulation_error);
            }
          }
        )
        .subscribe();
    }, 0);

    return () => {
      clearTimeout(timer);
      if (channel) supabase.removeChannel(channel);
    };
  }, [removePending]);

  // ── 2. Polling 백업: Realtime 실패 시 localStorage pending 목록 기반 ──
  useEffect(() => {
    if (pending.length === 0) return;

    const supabase = createClient();
    let cancelled = false;

    const pollAll = async () => {
      if (cancelled) return;

      const active = pending.filter((sim) => {
        if (notifiedRef.current.has(sim.scenarioId)) return false;
        const elapsed = Date.now() - new Date(sim.startedAt).getTime();
        if (elapsed > MAX_POLL_DURATION) {
          removePending(sim.scenarioId);
          return false;
        }
        return true;
      });

      if (active.length === 0) return;

      try {
        const ids = active.map((s) => s.scenarioId);
        const { data } = await supabase
          .from('scenario_information')
          .select('scenario_id, simulation_status, simulation_start_at, simulation_end_at, simulation_error')
          .in('scenario_id', ids);

        if (!data || cancelled) return;

        for (const row of data) {
          if (notifiedRef.current.has(row.scenario_id)) continue;

          if (row.simulation_status === 'completed') {
            markNotified(row.scenario_id);
            showCompletedToast(row);
          } else if (row.simulation_status === 'failed') {
            markNotified(row.scenario_id);
            showFailedToast(row.simulation_error);
          }
        }
      } catch (err) {
        console.error('[SimulationWatcher] Poll error:', err);
      }
    };

    pollAll();
    const intervalId = setInterval(pollAll, POLL_INTERVAL);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [pending, removePending]);

  return null;
}
