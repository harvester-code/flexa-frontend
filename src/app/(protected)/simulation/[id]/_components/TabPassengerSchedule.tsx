'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { faAngleLeft, faAngleRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { OrbitProgress } from 'react-loading-indicators';
import { ConditionData } from '@/types/conditions';
import { ChartData, PassengerPatternState, PassengerSchedule } from '@/types/simulations';
import { getPassengerSchedules } from '@/services/simulations';
import { BarColors, LineColors, useSimulationMetadata, useSimulationStore } from '@/stores/simulation';
import Button from '@/components/Button';
import Checkbox from '@/components/Checkbox';
import Conditions, { Dropdown } from '@/components/Conditions';
import Tooltip from '@/components/Tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { useResize } from '@/hooks/useResize';
import { numberWithCommas } from '@/lib/utils';

const BarChart = dynamic(() => import('@/components/charts/BarChart'), { ssr: false });
const LineChart = dynamic(() => import('@/components/charts/LineChart'), { ssr: false });

interface TabPassengerScheduleProps {
  visible: boolean;
}

function normalDistributionPDF(x: number, mean: number, stdDev: number) {
  const exponent = -0.5 * Math.pow((x - mean) / stdDev, 2);
  return (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
}

function generateNormalDistributionLineChart(
  mean: number,
  variance: number,
  start: number,
  end: number,
  step: number
) {
  const xValues: number[] = [];
  const yValues: number[] = [];

  for (let x = start; x <= end; x += step) {
    xValues.push(x);
    yValues.push(normalDistributionPDF(x, mean, Math.sqrt(variance)));
  }

  return { x: xValues, y: yValues };
}

const DropdownLists = {
  Mean: Array(101)
    .fill(0)
    .map((_, index) => {
      const id = String(50 + index);
      return { id, text: id };
    }),
  Variance: Array(61)
    .fill(0)
    .map((_, index) => {
      const id = String(30 + index);
      return { id, text: id };
    }),
};

interface PrioritiesProps {
  className?: string;
  conditions: ConditionData;
  defaultValues?: PassengerPatternState;
  onChange?: (state: PassengerPatternState) => void;
}

let _priorityIdCurrent = 0;

function Priorities({ className, conditions, defaultValues, onChange }: PrioritiesProps) {
  const [id] = useState(++_priorityIdCurrent);
  const [states, _setStates] = useState<PassengerPatternState | undefined>(defaultValues);
  const setStates = (newStates: PassengerPatternState) => {
    _setStates(newStates);
    if (onChange) onChange(newStates);
  };
  useEffect(() => {
    if (!defaultValues)
      setStates({
        conditions: undefined,
        mean: DropdownLists.Mean[0].id,
        variance: DropdownLists.Variance[0].id,
      });
  }, []);
  return (
    <div className={`mt-[20px] flex flex-col rounded-lg border border-gray-300 ${className}`}>
      <Conditions
        className=""
        logicItems={conditions.logicItems}
        criteriaItems={conditions.criteriaItems}
        operatorItems={conditions.operatorItems}
        valueItems={conditions.valueItems}
        initialValue={states?.conditions}
        onChange={(conditions) => setStates({ ...states, conditions })}
      />
      <div className="p-[20px]">
        <div className="flex flex-col gap-[10px]">
          <p className="font-semibold text-default-900">
            Passengers with above characteristics arrive at the airport
          </p>
          <div className="flex items-center gap-[10px] text-xl">
            normally distributed with mean
            <input
              id={`priority-mean-${id}`}
              className="text-md w-[100px] rounded-full border border-gray-500 px-[14px] py-[8px]"
              type="number"
              defaultValue={states?.mean}
              onBlur={(e) => {
                const val = Math.max(Math.min(Number(e.target.value), 999), 20);
                setStates({ ...states, mean: String(val) });
                const element = document.getElementById(`priority-mean-${id}`) as HTMLInputElement;
                if (element) element.value = String(val);
              }}
            />
            variance
            <input
              id={`priority-variance-${id}`}
              className="text-md w-[100px] rounded-full border border-gray-500 px-[14px] py-[8px]"
              type="number"
              defaultValue={states?.variance}
              onBlur={(e) => {
                const val = Math.max(Math.min(Number(e.target.value), 500), 1);
                setStates({ ...states, variance: String(val) });
                const element = document.getElementById(`priority-variance-${id}`) as HTMLInputElement;
                if (element) element.value = String(val);
              }}
            />
            minutes
          </div>
          <p className="text-xl">before the flight departure.</p>
        </div>
      </div>
    </div>
  );
}

export default function TabPassengerSchedule({ visible }: TabPassengerScheduleProps) {
  const refWidth = useRef(null);
  const { setPassengerSchedule, flight_sch, passenger_sch } = useSimulationMetadata();
  const { tabIndex, setTabIndex, priorities, availableTabIndex } = useSimulationStore();

  const [chartData, setChartData] = useState<{
    total: number;
    total_sub: string;
    x: string[];
    data: ChartData;
  }>();
  const [selColorCriteria, setSelColorCriteria] = useState('Airline');
  const [addPrioritiesVisible, setAddPrioritiesVisible] = useState(false);
  const [selPriorities, setSelPriorities] = useState<PassengerPatternState[]>();
  const [otherPassengerState, setOtherPassengerState] = useState<PassengerPatternState>({
    mean: DropdownLists.Mean[0].id,
    variance: DropdownLists.Variance[0].id,
  });
  const [loadingPassengerSchedules, setLoadingPassengerSchedules] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [timestamp, setTimestamp] = useState(Date.now());

  const { width } = useResize(refWidth);

  const [loaded, setLoaded] = useState(false);

  const saveSnapshot = (params?: Partial<PassengerSchedule>, snapshot: any = {}) => {
    const newSnapshot: any = {
      chartData,
      selColorCriteria,
      addPrioritiesVisible,
      selPriorities,
      otherPassengerState,
      ...snapshot,
    };
    setPassengerSchedule({ ...passenger_sch, ...(params || {}), snapshot: newSnapshot });
  };

  const restoreSnapshot = () => {
    if (passenger_sch?.snapshot) {
      const snapshot = passenger_sch?.snapshot;
      if (snapshot.chartData) setChartData(snapshot.chartData);
      if (snapshot.selColorCriteria) setSelColorCriteria(snapshot.selColorCriteria);
      if (snapshot.addPrioritiesVisible) setAddPrioritiesVisible(snapshot.addPrioritiesVisible);
      if (snapshot.selPriorities) setSelPriorities(snapshot.selPriorities);
      if (snapshot.otherPassengerState) setOtherPassengerState(snapshot.otherPassengerState);
      setTimestamp(Date.now());
    }
  };

  useEffect(() => {
    if (visible && !loaded && passenger_sch?.snapshot) {
      restoreSnapshot();
      setLoaded(true);
    }
  }, [visible]);

  const chartDataCurrent = chartData?.data?.[selColorCriteria] || [];

  const barColorsCurrent = !chartDataCurrent
    ? []
    : String(chartDataCurrent?.length) in BarColors
      ? BarColors[String(chartDataCurrent?.length)]
      : BarColors.DEFAULT;

  const conditions = priorities;

  const prioritiesItems = selPriorities && selPriorities?.length > 0 ? selPriorities : [undefined];
  const loadPassengerSchedules = useCallback(() => {
    setLoadingPassengerSchedules(true);

    const params = {
      flight_schedule: flight_sch?.params,
      destribution_conditions: [
        ...(addPrioritiesVisible
          ? prioritiesItems?.map((item, index) => {
              return { index, conditions: item.conditions, mean: item.mean, standard_deviation: item.variance };
            }) || []
          : []),
        {
          index: addPrioritiesVisible ? prioritiesItems.length : 0,
          mean: otherPassengerState.mean,
          standard_deviation: otherPassengerState.variance,
          conditions: [],
        },
      ],
    };

    getPassengerSchedules(params)
      .then(({ data }) => {
        console.log(data);
        const passengerSchedule: Partial<PassengerSchedule> = { params };
        const snapshotData: any = {};
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
            total_sub: data?.total_sub,
            x: data?.bar_chart_x_data,
            data: data?.bar_chart_y_data,
          };
          setChartData(newChartData);
          snapshotData.chartData = newChartData;
        }
        setLoadingPassengerSchedules(false);
        saveSnapshot(passengerSchedule, snapshotData);
      })
      .catch(() => {
        setLoadError(true);
        setLoadingPassengerSchedules(false);
      });
  }, [selPriorities, otherPassengerState, addPrioritiesVisible, flight_sch]);

  useEffect(() => {
    if (visible && !loaded && passenger_sch?.params) {
      setLoaded(true);
      const conditions = passenger_sch?.params?.destribution_conditions;
      if (conditions.length > 1) {
        const priorities: PassengerPatternState[] = [];
        for (let i = 0; i < conditions.length - 1; i++) {
          const itemCur = conditions[i];
          priorities.push({
            mean: itemCur.mean,
            variance: itemCur.standard_deviation,
            conditions: itemCur.conditions,
          });
        }
        setSelPriorities(priorities);
        setAddPrioritiesVisible(true);
      }
      const otherCondition = conditions[conditions.length - 1];
      setOtherPassengerState({
        mean: otherCondition.mean,
        variance: otherCondition.standard_deviation,
      });
    }
  }, [visible]);

  const distributionData: Plotly.Data[] = [];

  const minMaxMean = { min: Number(otherPassengerState.mean) * -1, max: Number(otherPassengerState.mean) * -1 };

  const prioritiesList = addPrioritiesVisible
    ? [...prioritiesItems, otherPassengerState]
    : [otherPassengerState];

  for (const itemCur of prioritiesList) {
    const minCur = Number(itemCur?.mean) * -1 - Math.max(Number(itemCur?.variance) / 2, 20);
    const maxCur = Math.max(Number(itemCur?.mean) * -1 + Math.max(Number(itemCur?.variance) / 2, 20), 5);
    if (minCur < minMaxMean.min) minMaxMean.min = minCur;
    if (maxCur > minMaxMean.max) minMaxMean.max = maxCur;
  }

  prioritiesList.map((item, index) => {
    if (!item) return null;
    const mean = Number(item?.mean) * -1;
    const start = minMaxMean.min;
    const end = minMaxMean.max;
    const step = 0.1;

    const { x, y } = generateNormalDistributionLineChart(mean, Number(item?.variance), start, end, step);

    distributionData.push({
      x: x,
      y: y,
      type: 'scatter',
      mode: 'lines',
      name: `Condition${index + 1}`,
      line: {
        color: index < LineColors.length ? LineColors[index] : 'blue',
        width: 2,
      },
    });
  });

  distributionData.push({
    name: 'flight',
    x: [0],
    y: [0],
    mode: 'markers',
    type: 'scatter',
    marker: {
      symbol: 'circle',
      size: 16,
      color: '#53389e',
    },
  });

  return !visible ? null : (
    <div ref={refWidth}>
      <h2 className="title-sm mt-[25px]">Passenger Schedule</h2>
      <p className="mt-[30px] text-[40px] text-xl font-semibold text-default-800">Passenger Show-up Patterns</p>
      <div className="mt-[20px] flex items-center gap-[10px] rounded-md border border-gray-200 bg-gray-50 p-[15px]">
        <Checkbox
          id="add-conditions"
          label=""
          checked={addPrioritiesVisible}
          onChange={() => setAddPrioritiesVisible(!addPrioritiesVisible)}
          className="checkbox-toggle"
        />
        <dl>
          <dt className="font-semibold">Add Priorities</dt>
          <dd className="text-sm font-medium text-default-400">
            Enable the option to set conditions for filtering passenger data.
          </dd>
        </dl>
      </div>
      {conditions && addPrioritiesVisible ? (
        <>
          {prioritiesItems.map((item, index) => (
            <Priorities
              key={index}
              conditions={conditions}
              defaultValues={item}
              onChange={(states) => {
                setSelPriorities([...prioritiesItems.map((rowCur, idx) => (index == idx ? states : rowCur))]);
              }}
            />
          ))}
          <div className="mt-[20px] flex items-center justify-center rounded-md border border-default-200 bg-default-100">
            <button
              className="h-[60px] w-full text-lg font-medium text-accent-600 hover:text-accent-700"
              onClick={() => {
                setSelPriorities([...prioritiesItems, undefined] as PassengerPatternState[]);
              }}
            >
              + Add ELSE IF
            </button>
          </div>
        </>
      ) : null}
      <div className="schedule-block mt-[20px]">
        {conditions && addPrioritiesVisible ? (
          <div className="schedule-top">
            <div className="select-grid">
              <div className="select-list">
                <dl>
                  <dt>
                    Logic <span className="text-accent-600">*</span>
                    <Tooltip title={'test'} text={'test'} />
                  </dt>
                  <dd className="pl-[10px]">
                    <Dropdown items={[{ id: 'ELSE', text: 'ELSE' }]} defaultId={'ELSE'} />
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        ) : null}
        <div className="schedule-bottom">
          <div className="flex flex-col gap-[10px]" key={timestamp}>
            <p className="font-semibold text-default-900">Other passengers arrive at the airport</p>
            <div className="flex items-center gap-[10px] text-xl">
              normally distributed with mean
              <input
                id="other-passenger-mean"
                className="text-md w-[100px] rounded-full border border-gray-500 px-[14px] py-[8px]"
                type="number"
                defaultValue={otherPassengerState.mean}
                onBlur={(e) => {
                  const val = Math.max(Math.min(Number(e.target.value), 999), 20);
                  setOtherPassengerState({ ...otherPassengerState, mean: String(val) });
                  const element = document.getElementById('other-passenger-mean') as HTMLInputElement;
                  if (element) element.value = String(val);
                }}
              />
              variance
              <input
                id="other-passenger-variance"
                className="text-md w-[100px] rounded-full border border-gray-500 px-[14px] py-[8px]"
                type="number"
                defaultValue={otherPassengerState.variance}
                onBlur={(e) => {
                  const val = Math.max(Math.min(Number(e.target.value), 500), 1);
                  setOtherPassengerState({ ...otherPassengerState, variance: String(val) });
                  const element = document.getElementById('other-passenger-variance') as HTMLInputElement;
                  if (element) element.value = String(val);
                }}
              />
              minutes
            </div>
            <p className="text-xl">before the flight departure.</p>
          </div>
        </div>
      </div>
      <p className="mt-[20px] flex justify-end">
        <Button
          className="btn-md btn-tertiary"
          // iconRight={applied ? <FontAwesomeIcon className="nav-icon" size="sm" icon={faCheck} /> : null}
          disabled={loadingPassengerSchedules}
          text={'Apply'}
          onClick={() => loadPassengerSchedules()}
        />
      </p>
      {loadingPassengerSchedules ? (
        <div className="flex min-h-[200px] flex-1 items-center justify-center">
          <OrbitProgress color="#32cd32" size="medium" text="" textColor="" />
        </div>
      ) : chartData ? (
        <>
          <p className="mt-[20px] text-[40px] text-xl font-semibold text-default-800">
            Check Generated Passenger Data
          </p>
          <dl className="mt-[25px]">
            <dt className="text-[40px] text-xl font-semibold">
              Total: {numberWithCommas(chartData?.total)} Pax
            </dt>
            <dd className="text-sm">{chartData.total_sub}</dd>
          </dl>
          <div className="mt-[10px] flex h-[210px] items-center justify-center rounded-md bg-white">
            <LineChart
              chartData={distributionData}
              chartLayout={{
                width,
                height: 210,
                margin: {
                  l: 20,
                  r: 10,
                  t: 0,
                  b: 20,
                },
                legend: {
                  x: 1,
                  y: 1.2,
                  xanchor: 'right',
                  yanchor: 'top',
                  orientation: 'h',
                },
                xaxis: {
                  title: 'X',
                },
                yaxis: {
                  showticklabels: false,
                },
              }}
              config={{
                displayModeBar: false,
              }}
            />
          </div>
          <div className="mt-[50px]">
            <div className="flex items-center justify-end pl-[35px]">
              <div className="flex flex-col">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="flex h-[30px] flex-row items-center pb-[10px]">
                      <Button
                        className="btn-lg btn-default text-sm"
                        icon={<Image width={20} height={20} src="/image/ico-button-menu.svg" alt="" />}
                        text={`Color by : ${selColorCriteria}`}
                        onClick={() => {}}
                      />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="cursor-pointer bg-white">
                    {Object.keys(chartData?.data).map((text, index) => (
                      <div key={index} className="flex flex-col">
                        <DropdownMenuItem
                          className="flex cursor-pointer flex-row px-[14px] py-[10px] pl-[14px]"
                          style={{ width: 143 }}
                          onClick={() => setSelColorCriteria(text)}
                        >
                          <span className="ml-[10px] text-base font-medium text-gray-800">{text}</span>
                        </DropdownMenuItem>
                      </div>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="mt-[10px] flex items-center justify-center rounded-md bg-white">
              <BarChart
                chartData={chartDataCurrent
                  .sort((a, b) => b.order - a.order)
                  .map((item, index) => {
                    return {
                      x: chartData?.x,
                      y: item.acc_y,
                      name: item.name,
                      type: 'bar',
                      marker: {
                        color: barColorsCurrent[index],
                        opacity: 1,
                        cornerradius: 7,
                        // TODO 겹쳐지는 모든 Bar 들에 radius 줄 수 있는 방법 찾아보기.
                      },
                      hovertemplate: item.y?.map((val) => `[%{x}] ${val}`),
                    };
                  })}
                chartLayout={{
                  width,
                  height: 390,
                  margin: {
                    l: 20,
                    r: 10,
                    t: 0,
                    b: 30,
                  },
                  barmode: 'overlay',
                  legend: {
                    x: 1,
                    y: 1.2,
                    xanchor: 'right',
                    yanchor: 'top',
                    orientation: 'h',
                  },
                  bargap: 0.4,
                  // barcornerradius: 7,
                }}
                config={{
                  displayModeBar: false,
                }}
              />
            </div>
          </div>
        </>
      ) : loadError ? (
        <div className="mt-[25px] flex flex-col items-center justify-center rounded-md border border-default-200 bg-default-50 py-[75px] text-center">
          <Image width={16} height={16} src="/image/ico-error.svg" alt="" />

          <p className="title-sm" style={{ color: '#30374F' }}>
            Unable to load data
          </p>
        </div>
      ) : (
        <div className="h-[10px]" />
      )}
      <div className="mt-[30px] flex justify-between">
        <button
          className="btn-md btn-default btn-rounded w-[210px] justify-between"
          onClick={() => setTabIndex(tabIndex - 1)}
        >
          <FontAwesomeIcon className="nav-icon" size="sm" icon={faAngleLeft} />
          <span className="flex flex-grow items-center justify-center">Filght Schedule</span>
        </button>
        <button
          className="btn-md btn-default btn-rounded w-[210px] justify-between"
          disabled={!chartData}
          onClick={() => setTabIndex(tabIndex + 1)}
        >
          <span className="flex flex-grow items-center justify-center">Processing Procedures</span>
          <FontAwesomeIcon className="nav-icon" size="sm" icon={faAngleRight} />
        </button>
      </div>
    </div>
  );
}
