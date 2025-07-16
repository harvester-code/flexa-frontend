'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { faAngleLeft, faAngleRight, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import {
  AllocationCondition,
  AllocationTable,
  AllocationTableRow,
  Filter,
  FilterOptions,
  Option,
} from '@/types/scenarios';
import { getFacilityConns } from '@/services/simulations';
import { useScenarioStore } from '@/stores/useScenarioStore';
import Button from '@/components/Button';
import Checkbox from '@/components/Checkbox';
import ConditionsBase from '@/components/Conditions';
import SelectBox from '@/components/SelectBox';
import TabDefault from '@/components/TabDefault';
import TheInput from '@/components/TheInput';
import SimulationGridTable, { checkNotEmptyRows } from './SimulationGridTable';
import SimulationTabNavigation from './SimulationTabNavigation';

const TABLE_TYPES = ['Check-box', 'Probability (%)'];
// ['Check-box', 'Distance (m)', 'Ratio (n:n)', 'Probability (%)', 'File Upload'];
const TABLE_CELL_HEIGHT = 36;

const FACILITY_SETTINGS_DEFAULTS = [
  { name: 'Processing time (sec)', value: 60 },
  // { name: 'Maximum Allowed Queue (persons)', value: 200 },
];

const DEFAULT_DEVICE_COUNT = 5;
const DEFAULT_PROCESSING_TIME = 60;
const DEFAULT_TIME_UNIT = 10;

interface ConditionsProps {
  className?: string;
  deletable?: boolean;
  ifConditions: FilterOptions;
  sourceConditions: FilterOptions;
  destConditions: FilterOptions;
  selectedValues: AllocationCondition | null;
  onAddCondition?: (newCondition: Filter) => void;
  onDeleteCondition?: (index: number) => void;
  onChange?: (payload: {
    key: 'sourceConditions' | 'destConditions' | 'ifConditions';
    what: keyof Filter;
    state: Option[];
    index?: number;
  }) => void;
  onDataChange?: (data: AllocationTableRow[]) => void;
  onDelete?: () => void;
}

function Conditions({
  className,
  deletable = false,
  ifConditions,
  sourceConditions,
  destConditions,
  selectedValues,
  onAddCondition,
  onDeleteCondition,
  onChange,
  onDataChange,
  onDelete,
}: ConditionsProps) {
  const [tableType, setTableType] = useState(TABLE_TYPES[0]);

  const sourceName = sourceConditions?.criteriaItems?.[0]?.id;

  return (
    <div className={`mt-[20px] flex flex-col rounded-lg border border-gray-300 ${className}`}>
      <ConditionsBase
        className="gap-y-[0px] border-b-0 pb-[10px]"
        labels={['Source']}
        addCondition={false}
        logicItems={sourceConditions.logicItems}
        criteriaItems={sourceConditions.criteriaItems}
        operatorItems={sourceConditions.operatorItems}
        valueItems={sourceConditions.valueItems}
        conditions={selectedValues?.sourceConditions || []}
        onChange={({ states, what, index }) => {
          if (onChange) onChange({ key: 'sourceConditions', what, state: states, index });
        }}
      />

      <ConditionsBase
        className="border-b-0 pt-[0px]"
        labels={[
          'IF',
          'AND',
          ...(selectedValues?.ifConditions && selectedValues?.ifConditions?.length > 2
            ? Array(selectedValues?.ifConditions?.length - 2).fill('AND')
            : []),
        ]}
        logicVisible={false}
        logicItems={ifConditions.logicItems}
        // Data Connection Criteria로 선택된 경우, 이를 선택지에서 제외합니다.
        criteriaItems={ifConditions.criteriaItems.filter((val) => val.id != sourceName)}
        operatorItems={ifConditions.operatorItems}
        valueItems={ifConditions.valueItems}
        conditions={selectedValues?.ifConditions || []}
        onChange={({ states, what, index }) => {
          if (onChange) onChange({ key: 'ifConditions', what, state: states, index });
        }}
        onAddCondition={(newCondition) => {
          if (onAddCondition) onAddCondition(newCondition);
        }}
        onDelete={(index) => {
          if (onDeleteCondition) onDeleteCondition(index);
        }}
      />

      <ConditionsBase
        className="bg-white"
        labels={['Destination']}
        addCondition={false}
        logicItems={destConditions.logicItems}
        criteriaItems={destConditions.criteriaItems}
        operatorItems={destConditions.operatorItems}
        valueItems={destConditions.valueItems}
        conditions={selectedValues?.destConditions || []}
        onChange={({ states, what, index }) => {
          if (onChange) onChange({ key: 'destConditions', what, state: states, index });
        }}
      />

      {/* =============== 테이블 데이터 입력 =============== */}
      {selectedValues?.tableData ? (
        <div className="table-import">
          {/* <div className="flex items-center justify-center">
            <button
              className="flex h-[50px] w-full items-center justify-center gap-[10px] text-base font-normal text-default-300 hover:text-default-700"
              onClick={() => {setTableData({ ...lastStates[0].tableData!, hidden: !states.tableData!.hidden });}}
            >
              <FontAwesomeIcon className="nav-icon" size="sm" icon={selectedValues.tableData.hidden ? faAngleDown : faAngleUp} />
              {selectedValues.tableData.hidden ? 'Show' : 'Hide'} Table
            </button>
          </div> */}

          <div className="table-wrap mt-[10px] overflow-hidden rounded-md px-[20px]">
            <div className="mt-[20px] flex items-center justify-end">
              <div className="w-[340px]">
                <SelectBox
                  options={TABLE_TYPES}
                  selectedOption={tableType}
                  onSelectedOption={(val) => setTableType(val)}
                />
              </div>
            </div>

            <div className="table-wrap mt-[10px] overflow-hidden rounded-md pb-[10px]">
              {selectedValues.tableData ? (
                <SimulationGridTable
                  // className="border-none"
                  type={tableType == TABLE_TYPES[0] ? 'checkbox' : tableType == TABLE_TYPES[1] ? 'number' : 'text'}
                  title={selectedValues.tableData.title}
                  header={selectedValues.tableData.header}
                  data={selectedValues.tableData.data || []}
                  errorMessage={
                    checkNotEmptyRows(selectedValues.tableData.data)
                      ? ''
                      : '● Please make sure to fill in all fields without leaving any blank rows!'
                  }
                  onDataChange={(data) => {
                    if (onDataChange) onDataChange(data);
                  }}
                />
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {deletable ? (
        <div className="flex items-center justify-center rounded-md border border-default-200 bg-rose-100">
          <button
            className="h-[60px] w-full text-lg font-medium text-rose-900 hover:text-rose-700"
            onClick={() => {
              if (onDelete) onDelete();
            }}
          >
            Delete Logic
          </button>
        </div>
      ) : null}
    </div>
  );
}

// -------------------------------------------------------------
interface FacilityConnectionProps {
  simulationId: string;
  visible: boolean;
}

export default function TabFacilityConnection({ simulationId, visible }: FacilityConnectionProps) {
  const {
    tabIndex,
    setTabIndex,
    //
    filterOptions,
    //
    procedures,
    dataConnectionCriteria,
    //
    snapshot,
    setSnapshot,
    allocationTables,
    setAllocationTables,
    allocationConditions,
    setAllocationConditions,
    allocationConditionsEnabled,
    setAllocationConditionsEnabled,
    //
    activedSecondTab,
    selectedSecondTab,
    setSelectedSecondTab,

    availableScenarioTab,
    setAvailableScenarioTab,

    setSettings,
    setSelectedNodes,
    normalDistributionParams,
    targetAirport,
    targetDate,
    flightScheduleFilters,
    setBarChartData,
  } = useScenarioStore(
    useShallow((s) => ({
      tabIndex: s.scenarioProfile.currentScenarioTab,
      setTabIndex: s.scenarioProfile.actions.setCurrentScenarioTab,
      //
      filterOptions: s.passengerSchedule.filterOptions,
      //
      procedures: s.airportProcessing.procedures,
      dataConnectionCriteria: s.airportProcessing.dataConnectionCriteria,
      //
      snapshot: s.facilityConnection.snapshot,
      setSnapshot: s.facilityConnection.actions.setSnapshot,
      allocationTables: s.facilityConnection.allocationTables,
      setAllocationTables: s.facilityConnection.actions.setAllocationTables,
      allocationConditions: s.facilityConnection.allocationConditions,
      setAllocationConditions: s.facilityConnection.actions.setAllocationConditions,
      allocationConditionsEnabled: s.facilityConnection.allocationConditionsEnabled,
      setAllocationConditionsEnabled: s.facilityConnection.actions.setAllocationConditionsEnabled,
      //
      activedSecondTab: s.facilityConnection.activedSecondTab,
      selectedSecondTab: s.facilityConnection.selectedSecondTab,
      setSelectedSecondTab: s.facilityConnection.actions.setSelectedSecondTab,

      availableScenarioTab: s.scenarioProfile.availableScenarioTab,
      setAvailableScenarioTab: s.scenarioProfile.actions.setAvailableScenarioTab,

      setSettings: s.facilityCapacity.actions.setSettings,
      setSelectedNodes: s.facilityCapacity.actions.setSelectedNodes,
      normalDistributionParams: s.passengerSchedule.normalDistributionParams,
      targetAirport: s.flightSchedule.targetAirport,
      targetDate: s.flightSchedule.targetDate,
      flightScheduleFilters: s.flightSchedule.selectedFilters,
      setBarChartData: s.facilityCapacity.actions.setBarChartData,
    }))
  );

  const [tableType, setTableType] = useState(TABLE_TYPES[0]);
  const [loadError, setLoadError] = useState(false);

  const [validatedTableStates, setValidatedTableStates] = useState<boolean[]>([]);

  useEffect(() => {
    if (procedures.length > 0) {
      setValidatedTableStates(Array(procedures.length).fill(false));
    }
  }, [procedures.length]);

  const filterOptionsWithTime = useMemo(() => {
    if (!filterOptions) return null;

    const timeValues = Array.from({ length: 24 * 6 }, (_, i) => {
      const hour = String(Math.floor(i / 6)).padStart(2, '0');
      const minute = String((i % 6) * 10).padStart(2, '0');
      return { id: `${hour}:${minute}`, text: `${hour}:${minute}` };
    });

    return {
      ...structuredClone(filterOptions),
      criteriaItems: [...filterOptions.criteriaItems, { id: 'Time', text: 'Time' }],
      operatorItems: {
        ...filterOptions.operatorItems,
        Time: [
          { id: 'start', text: 'start', multiSelect: false },
          { id: 'end', text: 'end', multiSelect: false },
        ],
      },
      valueItems: {
        ...filterOptions.valueItems,
        Time: timeValues,
      },
    };
  }, [filterOptions]);

  // 조건을 생성하는 함수입니다. (조건 생성 시 기본값을 자동으로 선택하도록 설계)
  // logicItems, criteriaItems, operatorItems, valueItems를 받아서
  // 기본값(첫 번째 값)으로 초기화된 condition 객체를 반환합니다.
  // 각 파라미터는 조건의 논리, 기준, 연산자, 값 목록을 의미합니다.
  // value는 값이 존재할 경우 첫 번째 값만 배열로 반환합니다.
  const createCondition = (
    logicItems: Option[],
    criteriaItems: Option[],
    operatorItems: FilterOptions['operatorItems'],
    valueItems: FilterOptions['valueItems'],
    index: number
  ) => {
    let criteria = criteriaItems[0]?.id;
    // 첫번째 구간은 dataConnectionCriteria를 제외한 값을 기준으로 설정합니다.
    if (index === 0) {
      const filtered = criteriaItems.filter((item) => item.id !== criteria);
      if (filtered.length > 0) criteria = filtered[0].id;
    }

    const logic = logicItems[0]?.id;
    const operator = operatorItems[criteria]?.[0]?.id;
    const values = valueItems[criteria]?.map((v) => v.id) || [];

    return { logic, criteria, operator, value: values.length > 0 ? [values[0]] : [] };
  };

  const generateInitialCondition = (
    sourceCondition: FilterOptions,
    destCondition: FilterOptions,
    filterOptionsWithTime: any
  ) => {
    const initSourceCondition = createCondition(
      sourceCondition.logicItems,
      sourceCondition.criteriaItems,
      sourceCondition.operatorItems,
      sourceCondition.valueItems,
      selectedSecondTab
    );
    // HACK: filterOptionsWithTime도 파라미터로 전달하도록 개선하자.
    const initIfCondition = createCondition(
      filterOptionsWithTime.logicItems,
      filterOptionsWithTime.criteriaItems,
      filterOptionsWithTime.operatorItems,
      filterOptionsWithTime.valueItems,
      selectedSecondTab
    );
    const initDestCondition = createCondition(
      destCondition.logicItems,
      destCondition.criteriaItems,
      destCondition.operatorItems,
      destCondition.valueItems,
      selectedSecondTab
    );

    // ------------------------------------------------------------

    const initTitle = initSourceCondition.criteria;

    const initHeader = initDestCondition.value.map((val) => ({
      name: val,
    }));

    const initData = initSourceCondition.value.map((val) => ({
      name: val,
      values: Array(initHeader.length).fill(0),
    }));

    return {
      sourceConditions: [initSourceCondition],
      ifConditions: [initIfCondition],
      destConditions: [initDestCondition],
      tableData: { title: initTitle, header: initHeader, data: initData, hidden: false },
    };
  };

  // ‼️ 해당 컴포넌트에서 사용되는 데이터들을 전처리한다.
  useEffect(() => {
    if (!visible) return;

    if (!filterOptionsWithTime) return;

    // TODO: 추후에는 해당 로직을 더욱 발전시켜서 변경된 부분만 감지하여
    //       allocationTables를 업데이트하도록 개선해야 한다.
    const currentSnapshot = [
      dataConnectionCriteria,
      ...procedures.map((proc) => `${proc.name}::${proc.nodesText}`),
    ].join('::');

    if (snapshot === currentSnapshot) return;

    // ------------------------------------------------------------

    // allocationTables의 초기값을 설정합니다.
    const newTables: AllocationTable[] = procedures.map((proc, i) => {
      const isFirst = i === 0;

      const sourceName = isFirst ? dataConnectionCriteria : procedures[i - 1].name;
      const destName = proc.name;

      // Build header columns (destination nodes)
      const header = proc.nodes.map((node) => ({ name: node }));

      // Build data rows (source nodes or filter values)
      let data: AllocationTableRow[];
      if (isFirst) {
        // First step: use filter values as source
        data = filterOptionsWithTime.valueItems[dataConnectionCriteria].map((v) => ({
          name: v.text,
          values: Array(proc.nodes.length).fill(0),
        }));
      } else {
        // Subsequent steps: use previous procedure's nodes as source
        data = procedures[i - 1].nodes.map((node) => ({
          name: node,
          values: Array(proc.nodes.length).fill(0),
        }));
      }

      // Build source condition options
      const sourceCondition = {
        logicItems: [{ id: 'AND', text: 'AND' }],
        criteriaItems: [{ id: sourceName, text: sourceName }],
        operatorItems: { [sourceName]: [{ id: '01', text: 'is in', multiSelect: true }] },
        valueItems: {
          [sourceName]: isFirst
            ? filterOptionsWithTime.valueItems[dataConnectionCriteria]
            : procedures[i - 1].nodes.map((node) => ({ id: node, text: node })),
        },
      };

      // Build destination condition options
      const destCondition = {
        logicItems: [{ id: 'AND', text: 'AND' }],
        criteriaItems: [{ id: destName, text: destName }],
        operatorItems: { [destName]: [{ id: '01', text: 'is in', multiSelect: true }] },
        valueItems: {
          [destName]: proc.nodes.map((node) => ({ id: node, text: node })),
        },
      };

      return {
        title: proc.nameText || '',
        header,
        data,
        sourceCondition,
        destCondition,
        waitTime: '0',
        hidden: false,
      };
    });

    setAllocationTables(newTables);
    setSnapshot(currentSnapshot);

    // ------------------------------------------------------------

    const initialConditions: AllocationCondition[][] = newTables.map(({ sourceCondition, destCondition }) => {
      const initialCondition = generateInitialCondition(sourceCondition, destCondition, filterOptionsWithTime);
      return [initialCondition];
    });

    setAllocationConditions(initialConditions);
    setAllocationConditionsEnabled(Array(newTables.length).fill(false));
  }, [
    visible,
    filterOptionsWithTime,
    dataConnectionCriteria,
    procedures,
    snapshot,
    selectedSecondTab,
    setAllocationTables,
    setSnapshot,
    setAllocationConditions,
    setAllocationConditionsEnabled,
  ]);

  const updateAllocationConditionTableData = (
    currentFilter: AllocationCondition,
    key: 'sourceConditions' | 'destConditions' | 'ifConditions',
    states: Option[],
    what: keyof Filter,
    index: number = 0
  ) => {
    const selectedText = states[0]?.text || '';

    // --------------------------------------------------------------------------
    const updatedFilters = currentFilter[key].map((filter, i) => {
      if (i !== index) return filter;

      const clonedFilter: Filter = structuredClone(filter);

      if (what === 'value') {
        clonedFilter.value = states.map((option) => option.text);
      } else {
        clonedFilter[what] = selectedText;
      }

      // criteria가 바뀌면 관련된 value + operator 초기화
      if (key === 'ifConditions' && what === 'criteria') {
        const newValueItems = filterOptionsWithTime?.valueItems?.[selectedText] || [];
        const newOperatorItems = filterOptionsWithTime?.operatorItems?.[selectedText] || [];

        clonedFilter.value = newValueItems.length > 0 ? [newValueItems[0].text] : [];
        clonedFilter.operator = newOperatorItems.length > 0 ? newOperatorItems[0].id : '';
      }

      return clonedFilter;
    });

    const updatedCondition = { ...currentFilter, [key]: updatedFilters };

    // --------------------------------------------------------------------------
    // sourceConditions와 destConditions의 경우, 테이블 데이터 업데이트
    if (key === 'sourceConditions' || key === 'destConditions') {
      const destValues = updatedCondition.destConditions[index]?.value || [];
      const sourceValues = updatedCondition.sourceConditions[index]?.value || [];

      updatedCondition.tableData = {
        ...updatedCondition.tableData,
        header: destValues.map((val) => ({ name: val })),
        data: sourceValues.map((val) => ({ name: val, values: Array(destValues.length).fill(0) })),
      };
    }

    return updatedCondition;
  };

  // -------------------------------------------------------------
  // 테이블의 유효성을 검사하는 함수입니다.
  const validateTable = useCallback(() => {
    const isDefaultTableValid = checkNotEmptyRows(allocationTables[selectedSecondTab].data);
    const isConditionsTableValid = allocationConditionsEnabled[selectedSecondTab]
      ? allocationConditions[selectedSecondTab].every((condition) => checkNotEmptyRows(condition.tableData.data))
      : true;

    const isDone = isDefaultTableValid && isConditionsTableValid;

    if (isDone && validatedTableStates[selectedSecondTab]) {
      return; // 이미 완료된 상태라면 아무 작업도 하지 않음
    } else if (isDone && !validatedTableStates[selectedSecondTab]) {
      // 완료된 상태로 변경
      setValidatedTableStates((prev) => prev.map((v, i) => (i === selectedSecondTab ? true : v)));
    } else if (!isDone && validatedTableStates[selectedSecondTab]) {
      // 완료되지 않은 상태로 변경
      setValidatedTableStates((prev) => prev.map((v, i) => (i === selectedSecondTab ? false : v)));
      setAvailableScenarioTab(Math.max(availableScenarioTab - 1, 4));
    }
  }, [
    allocationTables,
    allocationConditions,
    allocationConditionsEnabled,
    availableScenarioTab,
    selectedSecondTab,
    setAvailableScenarioTab,
    validatedTableStates,
  ]);

  useEffect(() => {
    if (!visible) return;

    if (allocationTables.length === 0 || allocationConditions.length === 0) return;

    validateTable();
  }, [allocationTables, allocationConditions, validateTable, visible]);

  // -------------------------------------------------------------

  const generateDefaultTableData = (deviceCount: number) => ({
    header: Array(deviceCount)
      .fill(0)
      .map((_, index) => ({
        name: `Desk ${String(index + 1).padStart(2, '0')}`,
        style: { background: '#F9F9FB' },
        minWidth: 80,
      })),
    data: FACILITY_SETTINGS_DEFAULTS.map((item, index) => ({
      name: item.name,
      values: Array(deviceCount).fill(String(index === 0 ? 60 : 200)),
      style: { background: '#FFFFFF' },
    })),
  });

  const generateOpeningHoursTableData = (deviceCount: number, processingTime: number) => {
    const timeUnit = DEFAULT_TIME_UNIT;
    // const timeUnit = currentSetting.timeUnit || DEFAULT_TIME_UNIT;
    const times = generateTimeSlots(timeUnit);

    return {
      header: Array(deviceCount)
        .fill(0)
        .map((_, index) => {
          return {
            name: `Desk ${String(index + 1).padStart(2, '0')}`,
            style: { background: '#F9F9FB' },
            minWidth: 80,
          };
        }),
      data: times.map((time) => {
        return {
          name: time,
          values: Array(deviceCount)
            .fill(0)
            .map((_, cidx) => String(processingTime)),
          style: { background: '#FFFFFF' },
          height: TABLE_CELL_HEIGHT,
          checkToNumber: processingTime,
        };
      }),
    };
  };

  const generateTimeSlots = (interval: number): string[] => {
    const slots: string[] = [];
    for (let minutes = 0; minutes < 1440; minutes += interval) {
      const hours = Math.floor(minutes / 60)
        .toString()
        .padStart(2, '0');
      const mins = (minutes % 60).toString().padStart(2, '0');
      slots.push(`${hours}:${mins}`);
    }
    return slots;
  };

  // --------------------------------------------------------------------------

  const fetchBarChartData = async () => {
    const cleanedProcesses = allocationTables.reduce((acc, table, index) => {
      // 각 테이블의 데이터를 행렬(matrix) 형태로 변환합니다.
      // 예: { "소스1": { "목적지1": 0.5, "목적지2": 0.3 }, "소스2": { "목적지1": 0.2, "목적지2": 0.7 } }
      const defaultMatrix = table.data?.reduce((matrix, row) => {
        // 각 행(row)에 대해 열(column) 데이터를 처리합니다
        matrix[row.name] = row.values.reduce((rowAcc, val, idx) => {
          // 각 값을 퍼센트에서 소수점으로 변환 (예: 50 -> 0.5)
          const destinationName = table.header[idx].name;
          rowAcc[destinationName] = Number(val) / 100;
          return rowAcc;
        }, {});
        return matrix;
      }, {});

      acc[index + 1] = {
        name: table.title,
        nodes: table.header.map((header) => header.name),
        source: String(index),
        destination: procedures.length < index + 2 ? null : String(index + 2),
        wait_time: 0,
        default_matrix: defaultMatrix,
        priority_matrix: [],
      };
      return acc;
    }, {});

    const params = {
      destribution_conditions: normalDistributionParams.map(({ conditions, mean, stddev }, index) => ({
        index,
        conditions,
        mean,
        standard_deviation: stddev,
      })),
      flight_schedule: {
        airport: targetAirport.iata,
        date: targetDate,
        condition: flightScheduleFilters,
      },
      processes: {
        '0': {
          name: dataConnectionCriteria,
          nodes: [],
          source: null,
          destination: '1',
          wait_time: null,
          default_matrix: null,
          priority_matrix: null,
        },
        ...cleanedProcesses,
      },
    };

    try {
      const { data } = await getFacilityConns(simulationId, params);
      return data;
    } catch (error) {
      console.error('Error fetching bar chart data:', error);
      return null;
    }
  };

  const loadBarChartData = async () => {
    const data = await fetchBarChartData();
    setBarChartData(data);
  };

  // --------------------------------------------------------------------------

  const buildInitialSettings = () =>
    procedures.reduce((settings, procedure, procedureIndex) => {
      procedure.nodes.forEach((_, nodeIndex) => {
        const key = `${procedureIndex}_${nodeIndex}`;
        settings[key] = {
          numberOfEachDevices: DEFAULT_DEVICE_COUNT,
          processingTime: DEFAULT_PROCESSING_TIME,
          maximumQueuesAllowedPer: 200,
          timeUnit: DEFAULT_TIME_UNIT,
          overviewChartVisible: false,
          defaultTableData: generateDefaultTableData(DEFAULT_DEVICE_COUNT),
          lineChartData: null,
          openingHoursTableData: generateOpeningHoursTableData(DEFAULT_DEVICE_COUNT, DEFAULT_PROCESSING_TIME),
          facilityType: 'limited_facility', // TODO: 'limited_facility' | 'unlimited_facility'
        };
      });
      return settings;
    }, {});

  const initializeFacilitySettings = () => {
    setSettings(buildInitialSettings());
    setSelectedNodes(Array(procedures.length).fill(0));
  };

  // --------------------------------------------------------------------------
  const [loading, setLoading] = useState(false);

  return !visible ? null : (
    <div>
      <h2 className="title-sm mt-[25px]">Allocate Passenger Attributes to Processing Facilities</h2>

      <TabDefault
        className="tab-secondary mt-[25px]"
        tabCount={procedures.length}
        currentTab={selectedSecondTab}
        tabs={procedures.map((proc) => ({ text: proc.nameText || '' }))}
        onTabChange={setSelectedSecondTab}
      />

      {loadError ? (
        <div className="mt-[25px] flex flex-col items-center justify-center rounded-md border border-default-200 bg-default-50 py-[75px] text-center">
          <Image width={16} height={16} src="/image/ico-error.svg" alt="" />

          <p className="title-sm" style={{ color: '#30374F' }}>
            Unable to load data
          </p>
        </div>
      ) : (
        <div>
          <div className="mt-[30px] flex items-center justify-center gap-[100px]">
            <p className="text-[40px] text-xl font-semibold text-default-800">
              {selectedSecondTab === 0 ? dataConnectionCriteria : procedures[selectedSecondTab - 1].nameText}
            </p>

            <p className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-default-100">
              <FontAwesomeIcon className="nav-icon" size="sm" icon={faArrowRight} />
            </p>

            <p className="text-[40px] text-xl font-semibold text-default-800">
              {procedures?.[selectedSecondTab]?.nameText}
            </p>
          </div>

          {selectedSecondTab < 1 ? null : (
            <div className="add-time mt-[30px]">
              <p className="flex items-center gap-[10px]">
                <span>Add a wait time after completing the previous step *</span>
                {/* <button><Tooltip text={'test'} /></button> */}
              </p>

              <div className="relative mt-[10px]">
                <TheInput
                  className="input-rounded"
                  placeholder=""
                  type="number"
                  value={allocationTables[selectedSecondTab]?.waitTime}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setAllocationTables(
                      allocationTables.map((val, idx) =>
                        idx == selectedSecondTab
                          ? { ...val, waitTime: Math.max(Number(e.target.value), 0).toString() }
                          : val
                      )
                    )
                  }
                />
              </div>
            </div>
          )}

          <div className="mt-[30px]">
            <div className="flex items-center gap-[10px] rounded-md border border-gray-200 bg-gray-50 p-[15px]">
              <Checkbox
                id="add-conditions"
                className="checkbox-toggle"
                label=""
                checked={allocationConditionsEnabled[selectedSecondTab] || false}
                onChange={() => {
                  setAllocationConditionsEnabled(
                    allocationConditionsEnabled.map((val, idx) => (idx === selectedSecondTab ? !val : val))
                  );
                }}
              />

              <dl>
                <dt className="font-semibold">Add Conditions</dt>
                <dd className="text-sm font-medium text-default-400">
                  Enable the option to set conditions for filtering passenger data.{' '}
                </dd>
              </dl>
            </div>

            {/* HACK: 이벤트명을 개선하자 + 아래 함수를 개선하자 */}
            {allocationConditionsEnabled[selectedSecondTab] && filterOptionsWithTime ? (
              <>
                {allocationConditions[selectedSecondTab]?.map((conditions, conditionsIdx) => (
                  <Conditions
                    key={`conditions-${selectedSecondTab}-${conditionsIdx}`}
                    deletable={true}
                    ifConditions={filterOptionsWithTime}
                    sourceConditions={allocationTables[selectedSecondTab].sourceCondition}
                    destConditions={allocationTables[selectedSecondTab].destCondition}
                    selectedValues={conditions} // 👈 실제로 선택한 요소들
                    // 컨디션 덩어리 내부에서 IF 조건이 추가될 때 호출되는 이벤트
                    onAddCondition={(newCondition) => {
                      const updatedConditions = allocationConditions.map((conditions) =>
                        conditions.map((cond, i) => ({
                          ...cond,
                          ifConditions: i === conditionsIdx ? [...cond.ifConditions, newCondition] : cond.ifConditions,
                        }))
                      );
                      setAllocationConditions(updatedConditions);
                    }}
                    // 컨디션 덩어리 내부에서 IF 조건이 삭제될 때 호출되는 이벤트
                    onDeleteCondition={(index) => {
                      const updatedConditions = allocationConditions.map((conditions) =>
                        conditions.map((cond, i) => ({
                          ...cond,
                          ifConditions:
                            i === selectedSecondTab
                              ? cond.ifConditions.filter((_, j) => j !== index)
                              : cond.ifConditions,
                        }))
                      );
                      setAllocationConditions(updatedConditions);
                    }}
                    // 컨디션의 조건이 변경될 때 호출되는 이벤트
                    onChange={({ key, state, what, index }) => {
                      const updatedCondition = updateAllocationConditionTableData(
                        allocationConditions[selectedSecondTab][conditionsIdx],
                        key,
                        state,
                        what,
                        index
                      );
                      const updatedConditions = allocationConditions.map((conditions, i) =>
                        i === selectedSecondTab
                          ? conditions.map((cond, j) => (j === conditionsIdx ? updatedCondition : cond))
                          : conditions
                      );
                      setAllocationConditions(updatedConditions);
                    }}
                    // 컨디션 덩어리의 테이블 데이터가 변경될 때 호출되는 이벤트
                    onDataChange={(data) => {
                      const updatedConditions = allocationConditions.map((conditions, i) =>
                        i === selectedSecondTab
                          ? conditions.map((cond, j) =>
                              j === conditionsIdx ? { ...cond, tableData: { ...cond.tableData, data } } : cond
                            )
                          : conditions
                      );
                      setAllocationConditions(updatedConditions);
                    }}
                    // 컨디션 덩어리를 삭제할 때 호출되는 이벤트
                    onDelete={() => {
                      if (allocationConditions[selectedSecondTab].length === 1) {
                        setAllocationConditionsEnabled(
                          allocationConditionsEnabled.map((val, idx) => (idx === selectedSecondTab ? false : val))
                        );
                      }
                      setAllocationConditions(
                        allocationConditions.map((cond, i) =>
                          i === selectedSecondTab ? cond.filter((_, idx) => idx !== conditionsIdx) : cond
                        )
                      );
                    }}
                  />
                ))}

                <div className="mt-[20px] flex items-center justify-center rounded-md border border-default-200 bg-default-100">
                  <button
                    className="h-[60px] w-full text-lg font-medium text-accent-600 hover:text-accent-700"
                    onClick={() => {
                      const newCondition = generateInitialCondition(
                        allocationTables[selectedSecondTab].sourceCondition,
                        allocationTables[selectedSecondTab].destCondition,
                        filterOptionsWithTime
                      );
                      setAllocationConditions(
                        allocationConditions.map((conditions, i) =>
                          i === selectedSecondTab ? [...conditions, newCondition] : conditions
                        )
                      );
                    }}
                  >
                    + Add Logic
                  </button>
                </div>
              </>
            ) : null}
          </div>

          <div className="mt-[50px] flex items-center justify-between">
            <p className="tex-[40px] pl-[30px] text-xl font-medium text-default-800">
              {allocationConditionsEnabled[selectedSecondTab] || false ? 'ELSE' : null}
            </p>

            <div className="w-[340px]">
              <SelectBox
                options={TABLE_TYPES}
                selectedOption={tableType}
                onSelectedOption={(val) => setTableType(val)}
              />
            </div>
          </div>

          {procedures.length === allocationTables.length ? (
            <SimulationGridTable
              // className="max-h-[80vh]"
              type={tableType === TABLE_TYPES[0] ? 'checkbox' : tableType === TABLE_TYPES[1] ? 'number' : 'text'}
              title={allocationTables[selectedSecondTab]?.title || ''}
              header={allocationTables[selectedSecondTab]?.header || []}
              data={allocationTables[selectedSecondTab]?.data || []}
              errorMessage={
                validatedTableStates[selectedSecondTab]
                  ? ''
                  : '● Please make sure to fill in all fields without leaving any blank rows!'
              }
              stickyTopRows={1}
              onDataChange={(data) => {
                // HACK: 현재는 Cell이 1개 바뀔 때마다 모든 테이블 데이터를 업데이트하고 있다.
                //       추후에는 선택된 테이블의 데이터만 업데이트하도록 개선해야 한다.
                setAllocationTables(
                  allocationTables.map((val, i) => (selectedSecondTab === i ? { ...val, data } : val))
                );
              }}
            />
          ) : null}

          <div className="mt-[20px] flex items-center justify-between">
            <Button
              className="btn-md btn-tertiary"
              text="Prev"
              disabled={selectedSecondTab === 0}
              onClick={() => setSelectedSecondTab(Math.max(0, selectedSecondTab - 1))}
            />

            <Button
              className="btn-md btn-tertiary"
              text="Next"
              disabled={selectedSecondTab === procedures.length - 1}
              onClick={() => setSelectedSecondTab(Math.min(procedures.length - 1, selectedSecondTab + 1))}
            />
          </div>
        </div>
      )}

      {/* =============== 탭 이동 버튼 =============== */}
      <SimulationTabNavigation
        buttons={[
          {
            label: 'Flight Schedule',
            icon: <ChevronLeft />,
            iconPosition: 'left',
            onClick: () => setTabIndex(tabIndex - 1),
          },
          {
            loading,
            label: 'Facility Information',
            icon: <ChevronRight />,
            onClick: async () => {
              setLoading(true);
              try {
                initializeFacilitySettings();
                await loadBarChartData();
                //
                setTabIndex(tabIndex + 1);
                setAvailableScenarioTab(Math.min(availableScenarioTab + 1, 5));
              } finally {
                setLoading(false);
              }
            },
          },
        ]}
      />
    </div>
  );
}
