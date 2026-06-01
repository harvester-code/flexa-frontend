import type { ScenarioMetadataPayload } from '@/types/api/simulations';
import type { SimulationStoreState } from '@/app/(protected)/simulation/[id]/_stores/store';

type MetadataSource = Pick<
  SimulationStoreState,
  | 'context'
  | 'flight'
  | 'passenger'
  | 'process_flow'
  | 'terminalLayout'
  | 'workflow'
  | 'schedule_interval_minutes'
>;

/** Store snapshot → POST /simulations/{id}/metadata request body */
export function buildScenarioMetadataPayload(
  state: MetadataSource,
): ScenarioMetadataPayload {
  const date =
    state.context.date || new Date().toISOString().split('T')[0];

  return {
    context: {
      scenarioId: state.context.scenarioId,
      airport: state.context.airport,
      terminal: state.context.terminal || undefined,
      date,
      lastSavedAt: state.context.lastSavedAt,
    },
    flight: {
      total_flights: state.flight.total_flights,
      airlines: state.flight.airlines,
      filters: state.flight.filters,
      selectedConditions: state.flight.selectedConditions,
      appliedFilterResult: state.flight.appliedFilterResult,
    },
    passenger: state.passenger,
    process_flow: state.process_flow,
    terminalLayout: state.terminalLayout || { zoneAreas: {} },
    workflow: state.workflow,
    savedAt: new Date().toISOString(),
    schedule_interval_minutes: state.schedule_interval_minutes,
  };
}

export function emptyScenarioMetadataPayload(
  scenarioId: string,
): ScenarioMetadataPayload {
  const date = new Date().toISOString().split('T')[0];

  return {
    context: {
      scenarioId,
      airport: '',
      date,
      lastSavedAt: null,
    },
    flight: {
      total_flights: null,
      airlines: null,
      filters: null,
      selectedConditions: null,
      appliedFilterResult: null,
    },
    passenger: {
      settings: { min_arrival_minutes: null },
      pax_generation: {
        rules: [],
        default: { load_factor: null },
      },
      pax_demographics: {
        nationality: { available_values: [], rules: [], default: {} },
        profile: { available_values: [], rules: [], default: {} },
      },
      pax_arrival_patterns: {
        rules: [],
        default: { mean: null, std: null },
      },
    },
    process_flow: [],
    terminalLayout: { imageUrl: null, zoneAreas: {} },
    workflow: {
      currentStep: 1,
      step1Completed: false,
      step2Completed: false,
      availableSteps: [1],
    },
    savedAt: new Date().toISOString(),
  };
}
