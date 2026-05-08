'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/auth/client';
import { useNotificationStore, SimulationNotification } from '@/lib/notificationStore';

/**
 * 앱 레이아웃 레벨에서 simulation_notifications 테이블을 구독.
 * - 마운트 시: DB에서 최근 50건 로드
 * - Realtime: INSERT 이벤트 수신 시 store에 즉시 반영
 * UI는 NotificationBell이 담당.
 */
export default function SimulationWatcher() {
  const setNotifications = useNotificationStore((s) => s.setNotifications);
  const prependNotification = useNotificationStore((s) => s.prependNotification);

  useEffect(() => {
    const supabase = createClient();

    supabase
      .from('simulation_notifications')
      .select('id, scenario_id, scenario_name, status, error_message, simulation_start_at, simulation_end_at, created_at, read_at')
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setNotifications((data as SimulationNotification[]) ?? []);
      });

    const channel = supabase
      .channel(`simulation-notifications-watcher-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'simulation_notifications' },
        (payload) => {
          prependNotification(payload.new as SimulationNotification);
        }
      )
      .subscribe((status) => {
        console.log('[SimulationWatcher] Realtime status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [setNotifications, prependNotification]);

  return null;
}
