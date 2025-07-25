'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { faAngleLeft, faAngleRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Pencil, Plus, X } from 'lucide-react';
import { useDebounce } from 'react-use';
import { v4 as uuidv4 } from 'uuid';
import { useShallow } from 'zustand/react/shallow';
import { Filter, FilterOptions, NormalDistributionParam, Option } from '@/types/scenarios';
import { PassengerSchedulesParams, getPassengerSchedules } from '@/services/simulations';
import { LineColors } from '@/stores/simulation';
import { useScenarioStore } from '@/stores/useScenarioStore';
import Button from '@/components/Button';
import Checkbox from '@/components/Checkbox';
import Conditions, { Dropdown } from '@/components/Conditions';
import TheInput from '@/components/TheInput';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/DropdownMenu';
import { Separator } from '@/components/ui/Separator';
import { numberWithCommas } from '@/lib/utils';
import SimulationLoading from '../../_components/SimulationLoading';
import SimulationGridTable from './SimulationGridTable';

const BarChart = dynamic(() => import('@/components/charts/BarChart'), { ssr: false });
const LineChart = dynamic(() => import('@/components/charts/LineChart'), { ssr: false });

interface PrioritiesProps {
  id: number;
  conditions: Filter[];
  mean: number;
  stddev: number;
  filterOptions: FilterOptions | null;
  className?: string;
  addCondition: boolean;
  onAddCondition?: (newFilter: Filter) => void;
  onChange?: (index: number, newPriority: NormalDistributionParam) => void;
  onDelete?: (index: number) => void;
  onFilterChange?: (payload: { what: keyof Filter; states: Option[]; index?: number }) => void;
}

function Priorities({
  className,
  id,
  filterOptions,
  conditions,
  mean,
  stddev,
  addCondition,
  onAddCondition,
  onChange,
  onDelete,
  onFilterChange,
}: PrioritiesProps) {
  if (!filterOptions) {
    return (
      <div className="mt-5 flex items-center justify-center rounded-lg border border-gray-300 p-8">
        <p className="text-rose-500">⚠️ First, you need to load the Flight Schedule to use this feature.</p>
      </div>
    );
  }

  return (
    <div className={`mt-5 flex flex-col rounded-lg border border-gray-300 ${className}`}>
      <Conditions
        addCondition={addCondition}
        conditions={conditions}
        logicItems={filterOptions.logicItems}
        criteriaItems={filterOptions.criteriaItems}
        operatorItems={filterOptions.operatorItems}
        valueItems={filterOptions.valueItems}
        onAddCondition={(newFilter) => {
          if (onAddCondition) onAddCondition(newFilter);
        }}
        onChange={(payload) => {
          if (onFilterChange) onFilterChange(payload);
        }}
        onDelete={(index) => {
          if (onDelete) onDelete(index);
        }}
      />

      <div className="p-5">
        <div className="flex flex-col gap-[10px]">
          <p className="font-semibold text-default-900">Passengers with above characteristics arrive at the airport</p>

          <div className="flex items-center gap-[10px] text-xl">
            <span>normally distributed with mean</span>
            <input
              className="text-md w-[100px] rounded-full border border-gray-500 px-[14px] py-[8px]"
              type="number"
              value={mean}
              onChange={(e) => {
                if (onChange) onChange(id, { conditions, mean: Number(e.target.value), stddev });
              }}
              onBlur={(e) => {
                const val = Math.max(Math.min(Number(e.target.value), 999), 20);
                if (onChange) onChange(id, { conditions, mean: val, stddev });
              }}
            />
            <span>standard deviation</span>
            <input
              className="text-md w-[100px] rounded-full border border-gray-500 px-[14px] py-[8px]"
              type="number"
              value={stddev}
              onChange={(e) => {
                if (onChange) onChange(id, { conditions, mean, stddev: Number(e.target.value) });
              }}
              onBlur={(e) => {
                const val = Math.max(Math.min(Number(e.target.value), 500), 1);
                if (onChange) onChange(id, { conditions, mean, stddev: val });
              }}
            />
            <span>minutes</span>
          </div>
          <p className="text-xl">before the flight departure.</p>
        </div>
      </div>
    </div>
  );
}

function gaussian(x: number, mean: number, stddev: number) {
  const exponent = -((x - mean) ** 2) / (2 * stddev ** 2);
  return (1 / (stddev * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
}

function generateNormalDistributionLineChart(mean: number, stddev: number, start: number, end: number, step: number) {
  const xValues: number[] = [];
  const yValues: number[] = [];

  for (let x = start; x <= end; x += step) {
    xValues.push(x);
    yValues.push(gaussian(x, mean, stddev));
  }

  return { x: xValues, y: yValues };
}

function getPassengerDistributionChartData(passengerPatterns: NormalDistributionParam[], lineColors: string[]) {
  // x축 범위 계산 (모든 패턴의 평균±4*표준편차 중 최소/최대)
  const xRange = {
    min: Number(passengerPatterns[0]?.mean) * -1,
    max: Number(passengerPatterns[0]?.mean) * -1,
  };
  passengerPatterns.forEach((pattern) => {
    const mean = Number(pattern.mean) * -1;
    const stddev = Number(pattern.stddev);
    const candidateMin = mean - stddev * 4;
    const candidateMax = Math.max(mean + stddev * 4, 5);
    if (candidateMin < xRange.min) xRange.min = candidateMin;
    if (candidateMax > xRange.max) xRange.max = candidateMax;
  });

  const distributionData: Plotly.Data[] = [];
  const vlineData: Array<{ x: number; minY: number; maxY: number; color: string }> = [];

  passengerPatterns.forEach((pattern, patternIdx) => {
    const mean = Number(pattern.mean) * -1;
    const stddev = Number(pattern.stddev);
    const { min: start, max: end } = xRange;
    const step = 0.1;

    const { x, y } = generateNormalDistributionLineChart(mean, stddev, start, end, step);

    const minY = Math.min(...y);
    const maxY = Math.max(...y);

    const lineColor = patternIdx < lineColors.length ? lineColors[patternIdx] : 'blue';

    vlineData.push({ x: mean - stddev, minY, maxY, color: lineColor });
    vlineData.push({ x: mean + stddev, minY, maxY, color: lineColor });

    distributionData.push({
      x,
      y,
      type: 'scatter',
      mode: 'lines',
      name: `Condition${patternIdx + 1}`,
      line: { color: lineColor, width: 2 },
    } as Plotly.Data);
  });

  // 기준점(항공편 출발 시각) 마커 추가
  distributionData.push({
    name: 'flight',
    x: [0],
    y: [0],
    mode: 'markers',
    type: 'scatter',
    marker: { symbol: 'circle', size: 16, color: '#53389e' },
  } as Plotly.Data);

  return { distributionData, vlineData };
}

interface TabPassengerScheduleProps {
  simulationId: string;
  visible: boolean;
}

export default function TabPassengerSchedule({ simulationId, visible }: TabPassengerScheduleProps) {
  const {
    currentScenarioTab,
    availableScenarioTab,
    setAvailableScenarioTab,
    filterOptions,
    selectedFilters,
    passengerScheduleColorCriteria,
    passengerScheduleChartData,
    isPriorityFilterEnabled,
    selectedPriorities,
    isPassengerPropertyEnabled,
    passengerPropertyParams,
    setPassengerPropertyParam,
    setPassengerPropertyParams,
    setIsPassengerPropertyEnabled,
    distributionData,
    vlineData,
    setDistributionData,
    setVlineData,
    setCurrentScenarioTab,
    setIsPriorityFilterEnabled,
    setPassengerScheduleChartData,
    setPassengerScheduleColorCriteria,
    setSelectedPriorities,
    setSelectedPriority,
    targetAirport,
    targetDate,
  } = useScenarioStore(
    useShallow((s) => ({
      currentScenarioTab: s.scenarioProfile.currentScenarioTab,
      availableScenarioTab: s.scenarioProfile.availableScenarioTab,
      setAvailableScenarioTab: s.scenarioProfile.actions.setAvailableScenarioTab,
      //
      filterOptions: s.passengerSchedule.filterOptions,
      selectedFilters: s.flightSchedule.selectedFilters,
      passengerScheduleColorCriteria: s.passengerSchedule.selectedCriteria,
      passengerScheduleChartData: s.passengerSchedule.chartData,
      //
      isPriorityFilterEnabled: s.passengerSchedule.isFilterEnabled,
      selectedPriorities: s.passengerSchedule.normalDistributionParams,
      //
      isPassengerPropertyEnabled: s.passengerSchedule.isPassengerPropertyEnabled,
      setIsPassengerPropertyEnabled: s.passengerSchedule.actions.setIsPassengerPropertyEnabled,
      //
      passengerPropertyParams: s.passengerSchedule.passengerPropertyParams,
      setPassengerPropertyParam: s.passengerSchedule.actions.setPassengerPropertyParam,
      setPassengerPropertyParams: s.passengerSchedule.actions.setPassengerPropertyParams,
      //
      distributionData: s.passengerSchedule.distributionData,
      vlineData: s.passengerSchedule.vlineData,
      setDistributionData: s.passengerSchedule.actions.setDistributionData,
      setVlineData: s.passengerSchedule.actions.setVlineData,
      setCurrentScenarioTab: s.scenarioProfile.actions.setCurrentScenarioTab,
      setIsPriorityFilterEnabled: s.passengerSchedule.actions.setIsFilterEnabled,
      setPassengerScheduleChartData: s.passengerSchedule.actions.setChartData,
      setPassengerScheduleColorCriteria: s.passengerSchedule.actions.setSelectedCriteria,
      setSelectedPriorities: s.passengerSchedule.actions.setNormalDistributionParams,
      setSelectedPriority: s.passengerSchedule.actions.setNormalDistributionParam,
      targetAirport: s.flightSchedule.targetAirport,
      targetDate: s.flightSchedule.targetDate,
    }))
  );

  const [loadingPassengerSchedules, setLoadingPassengerSchedules] = useState(false);
  const [isLoadError, setIsLoadError] = useState(false);

  // const [distributionData, setDistributionData] = useState<Plotly.Data[]>([]);
  // const [vlineData, setVlineData] = useState<
  //   {
  //     x: number;
  //     minY: number;
  //     maxY: number;
  //     color: string;
  //   }[]
  // >([]);

  // useEffect(() => {
  //   if (isPriorityFilterEnabled && selectedPriorities.length === 1) {
  //     setSelectedPriorities([{ conditions: [], mean: 120, stddev: 30 }, ...selectedPriorities]);
  //   }
  // }, [isPriorityFilterEnabled, selectedPriorities, setSelectedPriorities]);

  const loadPassengerSchedules = async () => {
    try {
      setLoadingPassengerSchedules(true);

      const params: PassengerSchedulesParams = {
        flight_schedule: { airport: targetAirport.iata, condition: selectedFilters, date: targetDate },
        destribution_conditions: isPriorityFilterEnabled
          ? selectedPriorities.map(({ conditions, mean, stddev }, index) => ({
              index,
              conditions,
              mean,
              standard_deviation: stddev,
            }))
          : [
              {
                index: 0,
                conditions: selectedPriorities[selectedPriorities.length - 1].conditions,
                mean: selectedPriorities[selectedPriorities.length - 1].mean,
                standard_deviation: selectedPriorities[selectedPriorities.length - 1].stddev,
              },
            ],
      };

      const { data } = await getPassengerSchedules(simulationId, params);

      if (data?.bar_chart_x_data && data?.bar_chart_y_data) {
        for (const criteriaCur in data?.bar_chart_y_data) {
          const criteriaDataCur = data?.bar_chart_y_data[criteriaCur].sort((a, b) => a.order - b.order);

          const acc_y = Array(criteriaDataCur[0].y.length).fill(0);

          for (const itemCur of criteriaDataCur) {
            itemCur.acc_y = Array(itemCur.y.length).fill(0);

            for (let i = 0; i < itemCur.y.length; i++) {
              acc_y[i] += itemCur.y[i];
              itemCur.acc_y[i] = Number(acc_y[i]);
            }
          }
        }
        const newChartData = {
          total: data?.total,
          total_sub_obj: data?.total_sub_obj,
          x: data?.bar_chart_x_data,
          data: data?.bar_chart_y_data,
        };
        setPassengerScheduleChartData(newChartData);

        const newColorCriterias = Object.keys(newChartData?.data);
        setPassengerScheduleColorCriteria(newColorCriterias[0]);
      }

      const { distributionData, vlineData } = getPassengerDistributionChartData(selectedPriorities, LineColors);

      setDistributionData(distributionData);
      setVlineData(vlineData);
      setAvailableScenarioTab(currentScenarioTab + 1);
    } catch (error) {
      console.error(error);
      setIsLoadError(true);
    } finally {
      setLoadingPassengerSchedules(false);
    }
  };

  // ====================================================================================================
  const [localIndex, setLocalIndex] = useState<number | null>(null);

  // 컬럼 변경 시 테이블 데이터를 재생성하는 함수
  const regenerateTableData = () => {
    if (localIndex === null) return;

    const param = passengerPropertyParams[localIndex];

    // 컬럼 문자열을 파싱하여 헤더 배열 생성
    const newHeader = param.columns
      .split(',')
      .map((col) => ({ name: col.trim() }))
      .filter((col) => col.name);

    // 각 행에 대해 균등하게 분배된 값으로 새로운 데이터 생성
    const equalDistributionValue = (100 / newHeader.length).toFixed(2);
    const newData = Array.from({ length: param.rows.length }).map(() => ({
      name: '',
      values: Array(newHeader.length).fill(equalDistributionValue),
    }));

    // 업데이트된 테이블 데이터로 파라미터 갱신
    setPassengerPropertyParam(localIndex, {
      ...param,
      tableData: {
        data: newData,
        header: newHeader,
      },
    });

    setLocalIndex(null);
  };

  // 컬럼 변경 시 300ms 지연 후 테이블 데이터 재생성
  useDebounce(
    regenerateTableData,
    300,
    [passengerPropertyParams.map((param) => param.columns)] // 컬럼 변경 시 트리거
  );

  return !visible ? null : (
    <div>
      <h2 className="title-sm mt-[25px]">Passenger Schedule</h2>

      <p className="mt-[30px] text-[40px] text-xl font-semibold text-default-800">Passenger Show-up Patterns</p>

      {/* ==================== 데이터 필터링 섹션 ==================== */}
      <div className="mt-5 flex items-center gap-[10px] rounded-md border border-gray-200 bg-gray-50 p-[15px]">
        <Checkbox
          id="add-conditions"
          className="checkbox-toggle"
          label=""
          checked={isPriorityFilterEnabled}
          onChange={() => setIsPriorityFilterEnabled(!isPriorityFilterEnabled)}
        />
        <dl>
          <dt className="font-semibold">Add Priorities</dt>
          <dd className="text-sm font-medium text-default-400">
            Enable the option to set priorities for filtering passenger data.
          </dd>
        </dl>
      </div>

      {/* ========== 필터링 IF 섹션 ========== */}
      {isPriorityFilterEnabled && selectedPriorities.length > 1
        ? selectedPriorities.slice(0, -1).map((item, procIndex) => (
            <Priorities
              key={procIndex}
              id={procIndex}
              filterOptions={filterOptions}
              conditions={item.conditions}
              mean={item.mean}
              stddev={item.stddev}
              addCondition={procIndex < selectedPriorities.length - 1}
              onAddCondition={(newFilter) => {
                setSelectedPriority(procIndex, {
                  ...selectedPriorities[procIndex],
                  conditions: [...selectedPriorities[procIndex].conditions, newFilter],
                });
              }}
              onChange={setSelectedPriority}
              onDelete={(filterIndex) => {
                if (selectedPriorities[procIndex].conditions.length <= 1) {
                  setSelectedPriorities(selectedPriorities.filter((_, i) => i !== procIndex));
                  setIsPriorityFilterEnabled(false);
                  return;
                }

                setSelectedPriority(procIndex, {
                  ...selectedPriorities[procIndex],
                  conditions: selectedPriorities[procIndex].conditions.filter((_, i) => i !== filterIndex),
                });
              }}
              onFilterChange={({ states, what, index }) => {
                if (index === undefined) return;

                const updatedConditions = selectedPriorities[procIndex].conditions.map((filter, i) => {
                  if (i !== index) return filter;

                  if (what === 'criteria') {
                    const newCriteria = states[0].id;
                    const defaultOperator = filterOptions?.operatorItems[newCriteria][0].id || '';

                    return { ...filter, criteria: newCriteria, operator: defaultOperator, value: [] };
                  }

                  if (what === 'value') {
                    return { ...filter, value: states.map((s) => s.id) };
                  }

                  return filter;
                });

                setSelectedPriority(procIndex, {
                  ...selectedPriorities[procIndex],
                  conditions: updatedConditions,
                });
              }}
            />
          ))
        : null}

      {/* ========== 필터링 ELSE IF 섹션 ========== */}
      {isPriorityFilterEnabled ? (
        <div className="mt-5 flex items-center justify-center rounded-md border border-default-200 bg-default-100">
          <button
            className="h-[60px] w-full text-lg font-medium text-accent-600 hover:text-accent-700"
            onClick={() => {
              const newPriorty = { conditions: [], mean: 120, stddev: 30 };
              // ‼️ 아래 코드의 순서가 굉장히 중요하다. (변경 X)
              setSelectedPriorities([
                ...selectedPriorities.slice(0, -1),
                newPriorty,
                selectedPriorities[selectedPriorities.length - 1],
              ]);
            }}
          >
            + Add ELSE IF
          </button>
        </div>
      ) : null}

      {/* ========== 필터링 ELSE 섹션 ========== */}
      <div className="schedule-block mt-5">
        {isPriorityFilterEnabled ? (
          <>
            <div className="schedule-top">
              <div className="select-grid">
                <div className="select-list">
                  <dl>
                    <dt>
                      Logic <span className="text-accent-600">*</span>
                      {/* <Tooltip title={'test'} text={'test'} /> */}
                    </dt>
                    <dd className="pl-[10px]">
                      <Dropdown items={[{ id: 'ELSE', text: 'ELSE' }]} defaultId={'ELSE'} />
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </>
        ) : null}

        <div className="schedule-bottom">
          <div className="flex flex-col gap-[10px]">
            <p className="font-semibold text-default-900">
              Passengers with above characteristics arrive at the airport
            </p>
            <div className="flex items-center gap-[10px] text-xl">
              <span>normally distributed with mean</span>
              <input
                className="text-md w-[100px] rounded-full border border-gray-500 px-[14px] py-[8px]"
                type="number"
                value={selectedPriorities[selectedPriorities.length - 1]?.mean}
                onChange={(e) => {
                  const prev = selectedPriorities[selectedPriorities.length - 1];
                  setSelectedPriority(selectedPriorities.length - 1, { ...prev, mean: Number(e.target.value) });
                }}
                onBlur={(e) => {
                  const prev = selectedPriorities[selectedPriorities.length - 1];
                  const val = Math.max(Math.min(Number(e.target.value), 999), 20);
                  setSelectedPriority(selectedPriorities.length - 1, { ...prev, mean: val });
                }}
              />
              <span>standard deviation</span>
              <input
                className="text-md w-[100px] rounded-full border border-gray-500 px-[14px] py-[8px]"
                type="number"
                value={selectedPriorities[selectedPriorities.length - 1]?.stddev}
                onChange={(e) => {
                  const prev = selectedPriorities[selectedPriorities.length - 1];
                  setSelectedPriority(selectedPriorities.length - 1, { ...prev, stddev: Number(e.target.value) });
                }}
                onBlur={(e) => {
                  const prev = selectedPriorities[selectedPriorities.length - 1];
                  const val = Math.max(Math.min(Number(e.target.value), 500), 1);
                  setSelectedPriority(selectedPriorities.length - 1, { ...prev, stddev: val });
                }}
              />
              <span>minutes</span>
            </div>
            <p className="text-xl">before the flight departure.</p>
          </div>
        </div>
      </div>

      {/* ==================== ADD PROPERTIES 섹션 ==================== */}
      {/* <div className="mt-5 flex items-center gap-[10px] rounded-md border border-gray-200 bg-gray-50 p-[15px]">
        <Checkbox
          id="add-properties"
          className="checkbox-toggle"
          label=""
          checked={isPassengerPropertyEnabled}
          onChange={() => setIsPassengerPropertyEnabled(!isPassengerPropertyEnabled)}
        />
        <dl>
          <dt className="font-semibold">Add Passengers Properties</dt>
          <dd className="text-sm font-medium text-default-400">
            Give the passengers different properties, such as seat class, nationality, and PRM status.
          </dd>
        </dl>
      </div>

      {isPassengerPropertyEnabled ? (
        <>
          <h1 className="my-8 text-2xl">Passengers Properties</h1>

          {passengerPropertyParams.map((param, idx) => (
            <div className="[&:not(:last-child)]:mb-10" key={`property_${param.id}`}>
              <div className="flex items-center gap-2.5">
                <span className="text-xl font-semibold">Property {idx + 1}</span>

                <div className="select-none rounded-full bg-default-100 p-2 hover:cursor-pointer hover:bg-default-200">
                  <Pencil size={14} />
                </div>

                <div
                  className="select-none rounded-full bg-default-100 p-2 hover:cursor-pointer hover:bg-default-200"
                  onClick={() => {
                    const filteredPropertyParams = passengerPropertyParams.filter((_, i) => i !== idx);
                    if (filteredPropertyParams.length === 0) {
                      setIsPassengerPropertyEnabled(false);
                    }
                    setPassengerPropertyParams(filteredPropertyParams);
                  }}
                >
                  <X size={14} />
                </div>
              </div>

              <div className="mt-6 flex gap-5">
                <div className="flex-1">
                  <p className="mb-1.5">
                    Row <span className="text-brand">*</span>
                  </p>

                  <Dropdown
                    multiSelect
                    items={filterOptions?.criteriaItems || []}
                    defaultId={param.rows}
                    onChange={(e) => {
                      console.log(e);
                    }}
                  />
                </div>

                <div className="flex-1">
                  <p className="mb-1.5">
                    Columns <span className="text-brand">*</span>
                  </p>

                  <TheInput
                    className="rounded-full"
                    type="text"
                    value={param.columns}
                    onChange={(e) => {
                      setLocalIndex(idx);
                      setPassengerPropertyParam(idx, { ...param, columns: e.target.value });
                    }}
                  />
                </div>
              </div>

              <div className="mt-6">
                <SimulationGridTable
                  data={param.tableData?.data || []}
                  header={param.tableData?.header || []}
                  onDataChange={() => {}}
                />
              </div>
            </div>
          ))}

          <div className="relative mt-16">
            <Separator />

            <div
              className="absolute -top-6 right-1/2 inline-block rounded-full border border-default-300 bg-white p-2 hover:cursor-pointer hover:bg-default-50"
              onClick={() => {
                const initialRows = filterOptions?.criteriaItems[0].id || '';
                const initialColumns = 'EX1, EX2';
                const initialTableData = {
                  header: initialColumns.split(',').map((col) => ({ name: col.trim() })),
                  data: [
                    { name: '1', values: ['50', '50'] },
                    { name: '2', values: ['50', '50'] },
                    { name: '3', values: ['50', '50'] },
                  ],
                };

                const newProperty = {
                  id: uuidv4(),
                  rows: initialRows,
                  columns: initialColumns,
                  tableData: initialTableData,
                };

                console.log(newProperty);

                setPassengerPropertyParams([...passengerPropertyParams, newProperty]);
              }}
            >
              <Plus size={30} />
            </div>
          </div>
        </>
      ) : null} */}

      {/* ==================== APPLY 버튼 ==================== */}
      <p className="mt-10 flex justify-end">
        <Button
          className="btn-md btn-tertiary"
          text="Apply"
          disabled={loadingPassengerSchedules}
          onClick={loadPassengerSchedules}
        />
      </p>

      {/* ==================== 그래프 섹션 ==================== */}
      {loadingPassengerSchedules ? (
        <SimulationLoading minHeight="min-h-[200px]" />
      ) : isLoadError ? (
        <div className="mt-[25px] flex flex-col items-center justify-center rounded-md border border-default-200 bg-default-50 py-[75px] text-center">
          <Image width={16} height={16} src="/image/ico-error.svg" alt="" />
          <p className="title-sm" style={{ color: '#30374F' }}>
            Unable to load data
          </p>
        </div>
      ) : passengerScheduleChartData && passengerScheduleChartData.total > 0 ? (
        <>
          <p className="mt-5 text-[40px] text-xl font-semibold text-default-800">Check Generated Passenger Data</p>

          <dl className="mt-[25px]">
            <dt className="text-[40px] text-xl font-semibold">
              Total: {numberWithCommas(passengerScheduleChartData?.total)} Pax
            </dt>

            <dd className="text-[40px] text-xl font-semibold">
              {passengerScheduleChartData?.total_sub_obj
                ?.map((textItem, index) => {
                  return (
                    <React.Fragment key={`value_${index}`}>
                      {textItem.value}
                      {textItem.unit || ''}
                      <span className="text-sm">{` ${textItem.title}`}</span>
                    </React.Fragment>
                  );
                })
                .map((textcompo, index) => {
                  return (
                    <React.Fragment key={`compo_${index}`}>
                      {index > 0 ? ' ｘ ' : ''}
                      {textcompo}
                    </React.Fragment>
                  );
                })}
            </dd>
          </dl>

          {/* ========== 여객 정규분포 차트 ========== */}
          <div className="mt-[10px] rounded-md bg-white">
            <LineChart
              // HACK: structuredClone is used to avoid mutating the original data
              chartData={structuredClone(distributionData) || []}
              chartLayout={{
                height: 210,
                margin: { l: 20, r: 10, t: 0, b: 20 },
                legend: { x: 1, y: 1.2, xanchor: 'right', yanchor: 'top', orientation: 'h' },
                xaxis: {
                  title: {
                    text: 'X',
                  },
                },
                yaxis: { showticklabels: false },
                shapes: vlineData?.map((vline) => {
                  return {
                    type: 'line',
                    x0: vline.x,
                    x1: vline.x,
                    y0: vline.minY,
                    y1: vline.maxY,
                    line: { color: vline.color, width: 1, dash: 'dot' },
                  };
                }),
              }}
              config={{ displayModeBar: false }}
            />
          </div>

          {/* ========== 여객 SHOW-UP 차트 ========== */}
          <div className="mt-[50px]">
            <div className="flex items-center justify-end pl-[35px]">
              <div className="flex flex-col">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="flex h-[30px] flex-row items-center pb-[10px]">
                      <Button
                        className="btn-lg btn-default text-sm"
                        icon={<Image width={20} height={20} src="/image/ico-button-menu.svg" alt="" />}
                        text={`Color by : ${passengerScheduleColorCriteria}`}
                        onClick={() => {}}
                      />
                    </div>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent className="cursor-pointer bg-white">
                    {Object.keys(passengerScheduleChartData?.data).map((text, index) => (
                      <div key={index} className="flex flex-col">
                        <DropdownMenuItem
                          className="flex cursor-pointer flex-row px-[14px] py-[10px] pl-[14px]"
                          style={{ width: 143 }}
                          onClick={() => setPassengerScheduleColorCriteria(text)}
                        >
                          <span className="ml-[10px] text-base font-medium text-gray-800">{text}</span>
                        </DropdownMenuItem>
                      </div>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="mt-[10px] rounded-md bg-white">
              <BarChart
                chartData={[...passengerScheduleChartData?.data?.[passengerScheduleColorCriteria]]
                  .sort((a, b) => b.order - a.order)
                  .map((item, index) => {
                    return {
                      x: passengerScheduleChartData?.x,
                      y: item.y,
                      name: item.name,
                      type: 'bar',
                      // marker: { color: barColorsCurrent[index], opacity: 1, cornerradius: 7 },
                      hovertemplate: item.y?.map((val) => `[%{x}] ${val}`),
                    };
                  })}
                chartLayout={{
                  barmode: 'stack',
                  margin: { l: 40, r: 10, t: 0, b: 30 },
                  legend: { x: 1, y: 1.2, xanchor: 'right', yanchor: 'top', orientation: 'h' },
                  bargap: 0.4,
                }}
                config={{ displayModeBar: false }}
              />
            </div>
          </div>
        </>
      ) : null}

      {/* =============== 탭 이동 버튼 =============== */}
      <div className="mt-[30px] flex justify-between">
        <button
          className="btn-md btn-default btn-rounded w-[210px] justify-between"
          onClick={() => setCurrentScenarioTab(currentScenarioTab - 1)}
        >
          <FontAwesomeIcon className="nav-icon" size="sm" icon={faAngleLeft} />
          <span className="flex flex-grow items-center justify-center">Filght Schedule</span>
        </button>

        <button
          className="btn-md btn-default btn-rounded w-[210px] justify-between"
          // HACK: 추후 탭 인덱스 값을 Props로 받아서 처리하도록 개선 (하드코딩 제거)
          disabled={availableScenarioTab < 3}
          onClick={() => setCurrentScenarioTab(currentScenarioTab + 1)}
        >
          <span className="flex flex-grow items-center justify-center">Processing Procedures</span>
          <FontAwesomeIcon className="nav-icon" size="sm" icon={faAngleRight} />
        </button>
      </div>
    </div>
  );
}
