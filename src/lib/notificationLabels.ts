import type { SimulationNotification } from '@/lib/notificationStore';

export type NotificationPhase = 'simulation' | 'analysis';

export function resolveNotificationPhase(
  notification: SimulationNotification
): NotificationPhase {
  return notification.phase === 'simulation' ? 'simulation' : 'analysis';
}

/** Short row title in the notification timing block. */
export function getPhaseRowTitle(phase: NotificationPhase): string {
  return phase === 'simulation' ? 'Simulation' : 'Analysis';
}

/** Badge label for a single pipeline phase notification. */
export function getNotificationPhaseLabel(notification: SimulationNotification): string {
  const phase = resolveNotificationPhase(notification);
  const isCompleted = notification.status === 'completed';

  if (phase === 'simulation') {
    return isCompleted ? 'Simulation Completed' : 'Simulation Failed';
  }
  return isCompleted ? 'Analysis Completed' : 'Analysis Failed';
}
