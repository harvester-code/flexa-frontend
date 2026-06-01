import type { SimulationNotification } from '@/lib/notificationStore';

export interface NotificationGroup {
  key: string;
  scenario_id: string;
  scenario_name: string | null;
  simulation_start_at: string | null;
  startedAt: string | null;
  completedAt: string | null;
  created_at: string;
  phases: SimulationNotification[];
  isUnread: boolean;
  hasFailure: boolean;
}

function runKeyForSimulation(n: SimulationNotification): string {
  return `${n.scenario_id}|${n.simulation_start_at ?? n.id}`;
}

/** Pair analysis row with the simulation run it belongs to. */
function findSimulationRunForAnalysis(
  analysis: SimulationNotification,
  simulationRows: SimulationNotification[]
): SimulationNotification | undefined {
  const candidates = simulationRows.filter((s) => s.scenario_id === analysis.scenario_id);
  if (candidates.length === 0) return undefined;

  if (analysis.simulation_start_at) {
    const sameStart = candidates.find(
      (s) => s.simulation_start_at === analysis.simulation_start_at
    );
    if (sameStart) return sameStart;

    const afterSimEnd = candidates.find(
      (s) => s.simulation_end_at === analysis.simulation_start_at
    );
    if (afterSimEnd) return afterSimEnd;
  }

  const analysisCreated = new Date(analysis.created_at).getTime();
  let best: SimulationNotification | undefined;
  let bestDelta = Number.POSITIVE_INFINITY;

  for (const sim of candidates) {
    if (!sim.simulation_end_at) continue;
    const simEnd = new Date(sim.simulation_end_at).getTime();
    if (simEnd > analysisCreated) continue;
    const delta = analysisCreated - simEnd;
    if (delta < bestDelta) {
      bestDelta = delta;
      best = sim;
    }
  }

  return best;
}

function dedupePhases(phases: SimulationNotification[]): SimulationNotification[] {
  const byPhase = new Map<'simulation' | 'analysis', SimulationNotification>();
  for (const n of phases) {
    const phase = n.phase === 'simulation' ? 'simulation' : 'analysis';
    const existing = byPhase.get(phase);
    if (!existing || String(n.id) > String(existing.id)) {
      byPhase.set(phase, n);
    }
  }
  const ordered: SimulationNotification[] = [];
  if (byPhase.has('simulation')) ordered.push(byPhase.get('simulation')!);
  if (byPhase.has('analysis')) ordered.push(byPhase.get('analysis')!);
  return ordered;
}

/** One UI card per simulation run; multiple runs per scenario stay separate. */
export function groupNotifications(
  notifications: SimulationNotification[]
): NotificationGroup[] {
  const simulationRows = notifications.filter((n) => n.phase === 'simulation');
  const map = new Map<string, SimulationNotification[]>();

  for (const n of simulationRows) {
    const key = runKeyForSimulation(n);
    const list = map.get(key) ?? [];
    list.push(n);
    map.set(key, list);
  }

  for (const n of notifications) {
    if (n.phase === 'simulation') continue;
    const matched = findSimulationRunForAnalysis(n, simulationRows);
    const key = matched
      ? runKeyForSimulation(matched)
      : `${n.scenario_id}|analysis-${n.id}`;
    const list = map.get(key) ?? [];
    list.push(n);
    map.set(key, list);
  }

  const groups: NotificationGroup[] = [];

  for (const [key, rawPhases] of map) {
    const phases = dedupePhases(rawPhases);
    const simPhase = phases.find((p) => p.phase === 'simulation');
    const first = simPhase ?? phases[0];
    const endTimes = phases
      .map((p) => p.simulation_end_at)
      .filter((t): t is string => Boolean(t));
    const completedAt =
      endTimes.length > 0
        ? endTimes.reduce((latest, t) =>
            new Date(t) > new Date(latest) ? t : latest
          )
        : null;

    groups.push({
      key,
      scenario_id: first.scenario_id,
      scenario_name: first.scenario_name,
      simulation_start_at: simPhase?.simulation_start_at ?? first.simulation_start_at,
      startedAt: simPhase?.simulation_start_at ?? first.simulation_start_at,
      completedAt,
      created_at: phases.reduce(
        (latest, p) => (new Date(p.created_at) > new Date(latest) ? p.created_at : latest),
        first.created_at
      ),
      phases,
      isUnread: phases.some((p) => !p.read_at),
      hasFailure: phases.some((p) => p.status === 'failed'),
    });
  }

  return groups.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function countUnreadNotificationGroups(
  notifications: SimulationNotification[]
): number {
  return groupNotifications(notifications).filter((g) => g.isUnread).length;
}
