import { StateCreator, create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { ConditionData } from '@/types/conditions';
import {
  Capacities,
  FacilityConnection,
  FacilityInformation,
  FlightSchedule,
  PassengerSchedule,
  ProcessingProcedures,
  ScenarioHistory,
  ScenarioInfo,
  ScenarioMetadata,
  ScenarioOverview,
  SimulationResponse,
} from '@/types/simulations';

interface ScenarioSlice {
  tabIndex: number;
  setTabIndex: (index: number) => void;

  availableTabIndex: number;
  setAvailableTabIndex: (index: number) => void;

  checkpoint?: { time: string; diff: number };
  setCheckpoint: (time: string, diff: number) => void;

  scenarioInfo?: ScenarioInfo;
  setScenarioInfo: (scenarioInfo: ScenarioInfo) => void;

  conditions?: ConditionData;
  setConditions: (conditions: ConditionData) => void;

  priorities?: ConditionData;
  setPriorities: (priorities: ConditionData) => void;

  facilityConnCapacities?: Capacities;
  setFacilityConnCapacities: (capacities?: Capacities) => void;

  flightScheduleTime: number;
  setFlightScheduleTime: (time: number) => void;

  processingProcedureTime: number;
  setProcessingProcedureTime: (time: number) => void;
}

interface MetadataSlice extends Partial<ScenarioMetadata> {
  resetMetadata: () => void;
  setMetadata: (data: ScenarioMetadata) => void;

  setOverview: (overview: Partial<ScenarioOverview>, replace?: boolean) => void;

  setFlightSchedule: (flightSchedule: Partial<FlightSchedule>, replace?: boolean) => void;

  setPassengerSchedule: (passengerSchedule: Partial<PassengerSchedule>, replace?: boolean) => void;

  setPassengerAttr: (passenger_attr: Partial<ProcessingProcedures>, replace?: boolean) => void;

  setFacilityConnection: (facility_conn: Partial<FacilityConnection>, replace?: boolean) => void;

  setFacilityInformation: (facility_info: Partial<FacilityInformation>, replace?: boolean) => void;

  setSimulation: (simulation: Partial<SimulationResponse>, replace?: boolean) => void;

  addHistoryItem: (item: ScenarioHistory) => void;
  setHistoryItem: (item: ScenarioHistory, index: number) => void;

  setColorCriteria: (value: string) => void;
  setTargetDate: (value: string) => void;
}

type ScenarioStore = ScenarioSlice & MetadataSlice;

const createScenarioSlice: StateCreator<ScenarioStore, [['zustand/devtools', never]], [], ScenarioSlice> = (
  set,
  get
) => ({
  tabIndex: 0,
  setTabIndex: (index) =>
    set(
      { tabIndex: index, availableTabIndex: Math.max(index, get().availableTabIndex) },
      false,
      'scenario/setTabIndex'
    ),

  availableTabIndex: 1,
  setAvailableTabIndex: (index) => set({ availableTabIndex: index }, false, 'scenario/setAvailableTabIndex'),

  checkpoint: undefined,
  setCheckpoint: (time, diff) => set({ checkpoint: { time, diff } }, false, 'scenario/setCheckpoint'),

  scenarioInfo: undefined,
  setScenarioInfo: (scenarioInfo) => set({ scenarioInfo }, false, 'scenario/setScenarioInfo'),

  conditions: undefined,
  setConditions: (conditions) => set({ conditions }, false, 'scenario/setConditions'),

  priorities: undefined,
  setPriorities: (priorities) => set({ priorities }, false, 'scenario/setPriorities'),

  facilityConnCapacities: undefined,
  setFacilityConnCapacities: (capacities) =>
    set({ facilityConnCapacities: capacities }, false, 'scenario/setFacilityConnCapacities'),

  flightScheduleTime: 0,
  setFlightScheduleTime: (time) => set({ flightScheduleTime: time }, false, 'scenario/setFlightScheduleTime'),

  processingProcedureTime: 0,
  setProcessingProcedureTime: (time) =>
    set({ processingProcedureTime: time }, false, 'scenario/setProcessingProcedureTime'),
});

const createMetadataSlice: StateCreator<ScenarioStore, [['zustand/devtools', never]], [], MetadataSlice> = (
  set,
  get
) => ({
  scenario_id: '',

  setMetadata: (data) => set({ ...data }, false, 'metadata/setMetadata'),

  resetMetadata: () => set({ history: get()?.history }, false, 'metadata/resetMetadata'),

  setOverview: (overview, replace) =>
    set(
      replace
        ? { overview }
        : {
            overview: { ...(get().overview || ({} as ScenarioOverview)), ...overview },
          },
      false,
      'metadata/setOverview'
    ),

  setFlightSchedule: (flight_sch, replace) =>
    set(
      replace
        ? { flight_sch }
        : {
            flight_sch: { ...(get().flight_sch || ({} as FlightSchedule)), ...flight_sch },
          },
      false,
      'metadata/setFlightSchedule'
    ),

  setPassengerSchedule: (passenger_sch, replace) =>
    set(
      replace
        ? { passenger_sch }
        : { passenger_sch: { ...(get().passenger_sch || ({} as PassengerSchedule)), ...passenger_sch } },
      false,
      'metadata/setPassengerSchedule'
    ),

  setPassengerAttr: (passenger_attr, replace) =>
    set(
      replace
        ? { passenger_attr }
        : { passenger_attr: { ...(get().passenger_attr || ({} as ProcessingProcedures)), ...passenger_attr } },
      false,
      'metadata/setPassengerAttr'
    ),

  setFacilityConnection: (facility_conn, replace) =>
    set(
      replace
        ? { facility_conn }
        : { facility_conn: { ...(get().facility_conn || ({} as FacilityConnection)), ...facility_conn } },
      false,
      'metadata/setFacilityConnection'
    ),

  setFacilityInformation: (facility_info, replace) =>
    set(
      replace
        ? { facility_info }
        : { facility_info: { ...(get().facility_info || ({} as FacilityConnection)), ...facility_info } },
      false,
      'metadata/setFacilityInformation'
    ),

  setSimulation: (simulation, replace) =>
    set(
      replace
        ? { simulation }
        : {
            simulation: { ...(get().simulation || ({} as SimulationResponse)), ...simulation },
          },
      false,
      'metadata/setSimulation'
    ),

  addHistoryItem: (item: ScenarioHistory) =>
    set(
      {
        history: [...(get()?.history || []), item],
      },
      false,
      'metadata/addHistoryItem'
    ),

  setHistoryItem: (item: ScenarioHistory, index: number) =>
    set(
      {
        history: get()?.history?.map((val, idx) => (idx == index ? item : val)),
      },
      false,
      'metadata/setHistoryItem'
    ),

  setColorCriteria: (value: string) => {
    const prev = get().flight_sch;
    set(
      {
        flight_sch: {
          ...prev,
          snapshot: { ...prev?.snapshot, selColorCriteria: value },
        },
      },
      false,
      'metadata/setColorCriteria'
    );
  },

  setTargetDate: (value: string) => {
    const prev = get().flight_sch;
    set(
      {
        flight_sch: {
          ...prev,
          params: { ...prev?.params, date: value },
        },
      },
      false,
      'metadata/setTargetDate'
    );
  },
});

export const useScenarioStore = create<ScenarioStore>()(
  devtools((...a) => ({
    ...createScenarioSlice(...a),
    ...createMetadataSlice(...a),
  }))
);
