'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { faAngleLeft, faAngleRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useShallow } from 'zustand/react/shallow';
import { BarColors, SANKEY_COLOR_SCALES } from '@/components/charts/colors';
import { Button } from '@/components/ui/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/DropdownMenu';
import SimulationLoading from '../../_components/SimulationLoading';
import { useScenarioStore } from '../../_store/useScenarioStore';
import TabDefault from './TabDefault';
import TabNavigation from './TabNavigation';

const BarChart = dynamic(() => import('@/components/charts/BarChart'), { ssr: false });
const SankeyChart = dynamic(() => import('@/components/charts/SankeyChart'), { ssr: false });
const LineChart = dynamic(() => import('@/components/charts/LineChart'), { ssr: false });

interface TabSimulationProps {
  simulationId: string;
  visible: boolean;
}

const GROUP_CRITERIAS = [
  { id: 'throughput', text: 'Throughput(pax)' },
  { id: 'max_delay', text: 'Max_delay(min)' },
  { id: 'average_delay', text: 'Average_delay(min)' },
  { id: 'total_delay', text: 'Total_delay(min)' },
];

export default function TabSimulation({ simulationId, visible }: TabSimulationProps) {
  const {
    currentScenarioTab,
    setCurrentScenarioTab,
    scenarioTerminal,
    matrix,
    setMatrix,
    airport,
    date,
    condition,
    normalDistributionParams,
    procedures,
    dataConnectionCriteria,
    allocationTables,
    settings,
  } = useScenarioStore(
    useShallow((s) => ({
      // Scenario Profile
      currentScenarioTab: s.scenarioProfile.currentScenarioTab,
      setCurrentScenarioTab: s.scenarioProfile.actions.setCurrentScenarioTab,
      scenarioTerminal: s.scenarioProfile.scenarioTerminal,

      // Scenario Overview
      matrix: s.scenarioOverview.matrix,
      setMatrix: s.scenarioOverview.actions.setMatrix,

      // Flight Schedule
      airport: s.flightSchedule.airport,
      date: s.flightSchedule.date,
      condition: s.flightSchedule.condition,

      // Passenger Schedule
      normalDistributionParams: s.passengerSchedule.normalDistributionParams,

      // Airport Processing
      procedures: s.airportProcessing.procedures,
      dataConnectionCriteria: s.airportProcessing.dataConnectionCriteria,

      // Facility Connection
      allocationTables: s.facilityConnection.allocationTables,

      // Facility Capacity
      settings: s.facilityCapacity.settings,
    }))
  );

  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!visible) setIsInitialized(false);
  }, [visible]);

  const [simulationParams, setSimulationParams] = useState<any>();
  const [simulationData, setSimulationData] = useState<SimulationResponse>({} as SimulationResponse);
  const [loadingSimulation, setLoadingSimulation] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const [selColorCriteria, setSelColorCriteria] = useState('Airline');
  const [selGroupCriteria, setSelGroupCriteria] = useState(GROUP_CRITERIAS[0].id);

  const runSimulation = async () => {
    // TODO: API 엔드포인트 업데이트 필요 - 현재 비활성화됨
    console.log('Simulation feature temporarily disabled - API endpoints need to be updated');
    alert('Simulation feature is temporarily disabled. Please contact support.');
  };

  // FIXME: 새롭게 저장된 시뮬레이션 결과가 불러오지 않는 문제 발생.
  const loadSimulationOutput = useCallback(async () => {
    // TODO: API 엔드포인트 업데이트 필요 - 현재 비활성화됨
    console.log('Load simulation output feature temporarily disabled - API endpoints need to be updated');
    setLoadingSimulation(false);
    setLoadError(false);
  }, [simulationId]);

  const loadSimulationOverview = useCallback((components: any, params: any) => {
    // TODO: API 엔드포인트 업데이트 필요 - 현재 비활성화됨
    console.log('Load simulation overview feature temporarily disabled - API endpoints need to be updated');
    setMatrix([]);
    setLoadError(false);
  }, []);

  // ==============================================================================

  // HACK: 아래 코드 개선하기
  // ‼️ 코드의 시작점이다.
  useEffect(() => {
    if (!visible || isInitialized) return;

    // --- 🔥 삭제 고려 대상 🔥 ---
    let nodeIdCur = 0;

    const components: {
      name: string;
      nodes: {
        id: number;
        name: string;
        max_queue_length: number;
        facility_count: number;
        facility_type: 'limited_facility' | 'unlimited_facility';
        facility_schedules: Array<number[]>;
      }[];
    }[] = [];

    for (let p = 0; p < procedures.length; p++) {
      const currentComponent = procedures[p];
      const nodeCount = currentComponent?.nodes?.length || 0;
      const nodes: {
        id: number;
        name: string;
        max_queue_length: number;
        facility_count: number;
        facility_type: 'limited_facility' | 'unlimited_facility';
        facility_schedules: Array<number[]>;
      }[] = [];

      for (let n = 0; n < nodeCount; n++) {
        const id = `${p}_${n}`;
        const targetSetting = settings[id] || {};
        const nodeName = procedures[p].nodes[n];

        nodes.push({
          id: nodeIdCur++,
          name: nodeName,
          max_queue_length: targetSetting.maximumQueuesAllowedPer,
          facility_count: targetSetting.numberOfEachDevices,
          facility_type: targetSetting.facilityType,
          facility_schedules:
            targetSetting.openingHoursTableData?.data?.map((item) => {
              return item.values.map((val) => {
                // if (val.length < 1) return 0;
                // const num = Number(val);
                // return num == 0 ? 0.0000000001 : num;
                return isNaN(Number(val)) ? 0 : Number(val);
              });
            }) || [],
        });
      }

      components.push({ name: currentComponent.name, nodes });
    }

    const cleanedProcesses = {};

    allocationTables.forEach((table, index) => {
      const defaultMatrix = {};

      table.data?.forEach((row) => {
        const rowName = row.name;

        defaultMatrix[rowName] = {};

        row.values.forEach((val, idx) => {
          defaultMatrix[rowName][table.header[idx].name] = Number(val) / 100;
        });
      });

      cleanedProcesses[index + 1] = {
        name: table.title.toLowerCase().replace(/[\s-]+/g, '_'),
        nodes: table.header.map((header) => header.name),
        source: String(index),
        destination: procedures.length < index + 2 ? null : String(index + 2),
        wait_time: 0,
        default_matrix: defaultMatrix,
        // TODO: 아래는 어떤 값이지?
        priority_matrix: [],
      };
    });

    const params = {
      destribution_conditions: normalDistributionParams.map(({ conditions, mean, stddev }, index) => ({
        index,
        conditions,
        mean,
        standard_deviation: stddev,
      })),
      flight_schedule: {
        airport,
        date,
        condition,
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
    // --- 🔥 삭제 고려 대상 🔥 ---

    if (!matrix || matrix.length < 1) {
      loadSimulationOverview(components, params);
    }
    loadSimulationOutput();

    setSimulationParams({ scenario_id: simulationId, components, ...params });
    setIsInitialized(true);
  }, [
    visible,
    isInitialized,
    allocationTables,
    dataConnectionCriteria,
    condition,
    loadSimulationOutput,
    loadSimulationOverview,
    normalDistributionParams,
    procedures,
    setMatrix,
    settings,
    simulationId,
    airport,
    date,
    matrix,
  ]);

  // ==============================================================================

  const [selectedProcedure, setSelectedProcedure] = useState(0);
  const [selectedNodes, setSelectedNodes] = useState<number[]>([]);

  useEffect(() => {
    if (!procedures || procedures.length < 1) return;

    setSelectedProcedure(0);
    setSelectedNodes(Array(procedures.length).fill(0));
  }, [procedures]);

  const kpiDataCurrent = useMemo(() => {
    if (Object.keys(simulationData).length < 1 || !simulationData.kpi) return [];

    const target = simulationData.kpi.find(
      (item) =>
        item.process === procedures[selectedProcedure].name &&
        item.node === procedures[selectedProcedure]?.nodes[selectedNodes[selectedProcedure]]
    );
    return target?.kpi || [];
  }, [simulationData, procedures, selectedProcedure, selectedNodes]);

  const lineChartDataCurrent = useMemo(() => {
    if (Object.keys(simulationData).length < 1 || !simulationData.line_chart) return null;

    return simulationData.line_chart.find(
      (item) =>
        item.process === procedures[selectedProcedure].name &&
        item.node === procedures[selectedProcedure]?.nodes[selectedNodes[selectedProcedure]]
    );
  }, [simulationData, procedures, selectedProcedure, selectedNodes]);

  const chartDataCurrent = useMemo(() => {
    if (Object.keys(simulationData).length < 1 || !simulationData.chart) return null;

    return simulationData.chart.find(
      (item) =>
        item.process === procedures[selectedProcedure].name &&
        item.node === procedures[selectedProcedure]?.nodes[selectedNodes[selectedProcedure]]
    );
  }, [simulationData, procedures, selectedProcedure, selectedNodes]);

  // const inOutChartMaxY = Math.max(
  //   ...(chartDataCurrent?.inbound?.chart_y_data[selColorCriteria]?.map((item) => item.acc_y)?.[0] || [0]),
  //   ...(chartDataCurrent?.outbound?.chart_y_data[selColorCriteria]?.map((item) => item.acc_y)?.[0] || [0])
  // );
  // const lineChartDate = dayjs(chartDataCurrent?.inbound?.chart_x_data?.[chartDataCurrent?.inbound?.chart_x_data.length / 2]).format('YYYY-MM-DD');

  return !visible ? null : (
    <div className="pt-8">
      <div className="mt-[25px] flex items-center justify-between">
        <h2 className="title-sm">Overview</h2>
        <Button
          className="btn-md btn-tertiary"
          onClick={() => {
            loadSimulationOverview(simulationParams?.components || [], {
              destribution_conditions: simulationParams?.destribution_conditions || [],
              flight_schedule: simulationParams?.flight_schedule || {},
              processes: simulationParams?.processes || {},
            });
          }}
        >
          Reload Data
        </Button>
      </div>

      {matrix.length > 0 ? (
        <div className="overview-wrap mt-[10px]">
          {matrix?.map((item, index) => (
            <a key={index} href="#" className="overview-item h-[120px] overflow-hidden">
              <dl>
                <dt className="text-left">{item.name}</dt>
                <dd className="whitespace-pre text-right !text-lg">
                  {Array.isArray(item.value)
                    ? item.value.join('\n')
                    : item.value || (item.name === 'Terminal' ? scenarioTerminal : '')}
                </dd>
              </dl>
            </a>
          ))}
        </div>
      ) : (
        <div className="mt-[25px] flex flex-col items-center justify-center rounded-md border border-default-200 bg-default-50 py-[75px] text-center">
          <p className="title-sm text-default-700">
            Waiting for simulation overview data...
          </p>
        </div>
      )}

      {/* Navigation */}
      <TabNavigation />

      {loadingSimulation ? (
        <SimulationLoading minHeight="min-h-[200px]" />
      ) : Object.keys(simulationData).length > 0 ? (
        <div className="my-8">
          <h2 className="title-sm">Most Recent Simulation Result</h2>

          <div className="mt-5 flex items-center justify-between gap-5">
            <div className="flex flex-grow items-center gap-[25px] rounded-md border border-default-300 bg-default-50 px-5 py-[40px]">
              <Image width={60} height={60} src="/image/ico-check-green.svg" alt="" />

              <dl className="flex flex-col gap-[8px]">
                <dt className="text-2xl font-semibold text-default-800">
                  {simulationData?.simulation_completed?.[0]?.value} Passengers
                </dt>
                <dd className="text-xl text-default-500">completed passengers</dd>
              </dl>
            </div>

            <div className="flex flex-grow items-center gap-[25px] rounded-md border border-default-300 bg-default-50 px-5 py-[40px]">
              <Image width={60} height={60} src="/image/ico-check-red.png" alt="" />
              <dl className="flex flex-col gap-[8px]">
                <dt className="text-2xl font-semibold text-default-800">
                  {simulationData?.simulation_completed?.[1]?.value} Passengers
                </dt>
                <dd className="text-xl text-default-500">incomplete passengers</dd>
              </dl>
            </div>
          </div>

          <h2 className="title-sm mt-[44px]">
            Passenger Flow {simulationData?.simulation_completed?.[0]?.value} Passengers
          </h2>

          <div className="mt-[40px] rounded-md bg-white">
            <SankeyChart
              chartData={[
                {
                  type: 'sankey',
                  orientation: 'h',
                  node: {
                    pad: 15,
                    thickness: 20,
                    line: { color: 'black', width: 0.5 },
                    label: simulationData?.sankey.label,
                    color: SANKEY_COLOR_SCALES,
                  },
                  link: simulationData?.sankey.link,
                },
              ]}
              chartLayout={{
                title: {
                  text: 'Sankey Diagram',
                },
                margin: { l: 16, r: 16, b: 16, t: 16 },
                font: { size: 20 },
              }}
            />
          </div>

          <div>
            <h2 className="title-sm mt-[60px]">Passenger by Facility</h2>

            <TabDefault
              className="tab-secondary mt-[25px]"
              tabCount={procedures.length}
              currentTab={selectedProcedure}
              tabs={procedures?.map((tab) => ({ text: tab.nameText }))}
              onTabChange={setSelectedProcedure}
            />

            {selectedProcedure < procedures.length ? (
              <ul className="gate-list grid-cols-5">
                {procedures[selectedProcedure].nodes.map((node, idx) => (
                  <li key={idx} className={`${idx === selectedNodes[selectedProcedure] ? 'active' : ''}`}>
                    <Button
                      variant="btn-link"
                      onClick={() => {
                        setSelectedNodes((prev) => {
                          const newSelectedNodes = [...prev];
                          newSelectedNodes[selectedProcedure] = idx;
                          return newSelectedNodes;
                        });
                      }}
                    >
                      {node}
                    </Button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {chartDataCurrent ? (
            <div>
              {/* =============== KPI =============== */}
              {Object.keys(simulationData).length > 0 && simulationData?.kpi ? (
                <div className="indicator mt-5">
                  <h4 className="text-lg font-semibold">KPI Indicators</h4>

                  <ul className="indicator-list grid-cols-3 gap-5">
                    {kpiDataCurrent?.map((item, index) => (
                      <li key={index}>
                        <dl>
                          <dt className="text-left">{item.title}</dt>
                          <dd className="mt-[10px] text-right">
                            {item.value}
                            {item.unit || ''}
                          </dd>
                        </dl>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {/* =============== Charts =============== */}
              <div className="mt-[40px] flex items-center justify-between">
                <p className="text-40 text-xl font-semibold">Graphs</p>
                <div className="flex flex-col">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div className="flex h-[30px] flex-row items-center pb-[10px]">
                        <Button variant="btn-default" size="btn-lg" className="text-sm" onClick={() => {}}>
                          <Image width={20} height={20} src="/image/ico-button-menu.svg" alt="" />
                          Color by : {selColorCriteria}
                        </Button>
                      </div>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent className="cursor-pointer bg-white">
                      {Object.keys(simulationData?.chart[0]?.inbound?.chart_y_data)?.map((text, index) => (
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

              <div className="mb-5 mt-[30px] flex justify-between">
                <p className="text-sm font-medium text-default-600">Pax Inflow</p>
              </div>

              <BarChart
                chartData={[
                  ...(chartDataCurrent?.inbound?.chart_y_data[selColorCriteria]
                    .sort((a, b) => b.order - a.order)
                    .map((item, index) => {
                      return {
                        x: chartDataCurrent?.inbound?.chart_x_data,
                        y: item.y,
                        name: item.name,
                        type: 'bar',
                        marker: {
                          color: (String(chartDataCurrent?.inbound?.chart_x_data?.length) in BarColors
                            ? BarColors[String(chartDataCurrent?.inbound?.chart_x_data?.length)]
                            : BarColors.DEFAULT)[index],
                          opacity: 1,
                          cornerradius: 7,
                        },
                        hovertemplate: item.y?.map((val) => `[%{x}] ${val}`),
                      };
                    }) as Plotly.Data[]),
                  {
                    x: chartDataCurrent?.inbound?.chart_x_data,
                    y: lineChartDataCurrent?.y,
                    type: 'scatter',
                    mode: 'lines',
                    name: 'Capacity',
                    marker: {
                      color: 'hsl(var(--destructive))',
                      opacity: 1,
                    },
                    orientation: 'h',
                  },
                ]}
                chartLayout={{
                  margin: { l: 30, r: 10, t: 0, b: 30 },
                  barmode: 'stack',
                  bargap: 0.4,
                  legend: { x: 1, y: 1.1, xanchor: 'right', yanchor: 'top', orientation: 'h' },
                }}
              />

              <div className="mb-5 mt-[50px] flex justify-between">
                <p className="text-sm font-medium text-default-600">Pax Outflow</p>
              </div>

              <BarChart
                chartData={[
                  ...(chartDataCurrent?.outbound?.chart_y_data[selColorCriteria]
                    .sort((a, b) => b.order - a.order)
                    .map((item, index) => {
                      return {
                        x: chartDataCurrent?.outbound?.chart_x_data,
                        y: item.y,
                        name: item.name,
                        type: 'bar',
                        marker: {
                          color: (String(chartDataCurrent?.outbound?.chart_x_data?.length) in BarColors
                            ? BarColors[String(chartDataCurrent?.outbound?.chart_x_data?.length)]
                            : BarColors.DEFAULT)[index],
                          opacity: 1,
                          cornerradius: 7,
                        },
                        hovertemplate: item.y?.map((val) => `[%{x}] ${val}`),
                      };
                    }) as Plotly.Data[]),
                  {
                    x: chartDataCurrent?.outbound?.chart_x_data,
                    y: lineChartDataCurrent?.y,
                    type: 'scatter',
                    mode: 'lines',
                    name: 'Capacity',
                    marker: { color: '#FF0000', opacity: 1 },
                    orientation: 'h',
                  },
                ]}
                chartLayout={{
                  height: 390,
                  margin: { l: 30, r: 10, t: 0, b: 30 },
                  barmode: 'stack',
                  legend: { x: 1, y: 1.1, xanchor: 'right', yanchor: 'top', orientation: 'h' },
                  bargap: 0.4,
                }}
              />

              <div className="mb-5 mt-[50px] flex justify-between">
                <p className="text-sm font-medium text-default-600">Queue Pax</p>
              </div>

              <BarChart
                chartData={[
                  ...(chartDataCurrent?.queing?.chart_y_data[selColorCriteria]
                    .sort((a, b) => b.order - a.order)
                    .map((item, index) => {
                      return {
                        x: chartDataCurrent?.queing?.chart_x_data,
                        y: item.y,
                        name: item.name,
                        type: 'bar',
                        marker: {
                          color: (String(chartDataCurrent?.queing?.chart_x_data?.length) in BarColors
                            ? BarColors[String(chartDataCurrent?.queing?.chart_x_data?.length)]
                            : BarColors.DEFAULT)[index],
                          opacity: 1,
                          cornerradius: 7,
                        },
                        hovertemplate: item.y?.map((val) => `[%{x}] ${val}`),
                      };
                    }) as Plotly.Data[]),
                ]}
                chartLayout={{
                  height: 390,
                  margin: { l: 30, r: 10, t: 0, b: 30 },
                  barmode: 'stack',
                  legend: { x: 1, y: 1.1, xanchor: 'right', yanchor: 'top', orientation: 'h' },
                  bargap: 0.4,
                }}
              />

              <div className="mb-5 mt-[50px] flex justify-between">
                <p className="text-sm font-medium text-default-600">Wait Time</p>
              </div>

              <LineChart
                chartData={[
                  {
                    x: chartDataCurrent?.waiting?.chart_x_data,
                    y: chartDataCurrent?.waiting?.chart_y_data,
                    type: 'scatter',
                    mode: 'lines',
                    marker: { color: '#FF0000', opacity: 1 },
                    orientation: 'h',
                  },
                ]}
                chartLayout={{
                  height: 390,
                  margin: { l: 30, r: 10, t: 0, b: 30 },
                  legend: { x: 1, y: 1.1, xanchor: 'right', yanchor: 'top', orientation: 'h' },
                  bargap: 0.4,
                }}
              />
            </div>
          ) : (
            <>
              {/* <div className="mt-[40px] flex items-center justify-between">
                <p className="text-40 mb-[10px] text-xl font-semibold">Total</p>
                <div className="flex flex-col">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div className="flex h-[30px] flex-row items-center pb-[10px]">
                        <Button
                          variant="btn-default"
                          size="btn-lg"
                          className="text-sm"
                          onClick={() => {}}
                        >
                          <Image width={20} height={20} src="/image/ico-button-menu.svg" alt="" />
                          Group Criteria
                        </Button>
                      </div>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent className="cursor-pointer bg-white">
                      {GROUP_CRITERIAS.map((item, index) => (
                        <div key={index} className="flex flex-col">
                          <DropdownMenuItem
                            className="flex cursor-pointer flex-row px-[14px] py-[10px] pl-[14px]"
                            style={{ width: 200 }}
                            onClick={() => setSelGroupCriteria(item.id)}
                          >
                            <span className="ml-[10px] text-base font-medium text-gray-800">{item.text}</span>
                          </DropdownMenuItem>
                        </div>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <BarChart
                chartData={[
                  {
                    x: simulationData?.total?.defalut_x,
                    y: simulationData?.total?.[selGroupCriteria],
                    name: 'Total',
                    type: 'bar',
                    marker: { color: '#9E77ED', opacity: 1 },
                  },
                ]}
                chartLayout={{
                  height: 390,
                  margin: { l: 30, r: 10, t: 0, b: 30 },
                  barmode: 'overlay',
                  legend: { x: 1, y: 1.1, xanchor: 'right', yanchor: 'top', orientation: 'h' },
                  bargap: 0.4,
                }}
              /> */}
            </>
          )}
        </div>
      ) : loadError ? (
        <div className="mt-[25px] flex flex-col items-center justify-center rounded-md border border-default-200 bg-default-50 py-[75px] text-center">
          <Image width={16} height={16} src="/image/ico-error.svg" alt="" />

          <p className="title-sm text-default-700">
            Unable to load data
          </p>
        </div>
      ) : (
        <div className="h-12"></div>
      )}
    </div>
  );
}
