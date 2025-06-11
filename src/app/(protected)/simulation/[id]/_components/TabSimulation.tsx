'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { faAngleLeft, faAngleRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { OrbitProgress } from 'react-loading-indicators';
import { useShallow } from 'zustand/react/shallow';
import { ProcedureInfo, SimulationOverviewResponse, SimulationResponse } from '@/types/simulations';
import { popModal, pushModal } from '@/app/provider';
import { fetchSimulation, getSimulationOverview, requestSimulation } from '@/services/simulations';
import { BarColors } from '@/stores/simulation';
import { useScenarioStore } from '@/stores/useScenarioStore';
import { SANKEY_COLOR_SCALES } from '@/constants';
import Button from '@/components/Button';
import TabDefault from '@/components/TabDefault';
import AnalysisPopup from '@/components/popups/Analysis';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/DropdownMenu';

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
    // passenger_attr,
    // facility_info,
    // setFacilityInformation,
    // overview,
    // setOverview,
    // tabIndex,
    // setTabIndex,
    // scenarioInfo,
    // +++
    currentScenarioTab,
    setCurrentScenarioTab,
    scenarioTerminal,

    procedures_,
    settings,

    targetAirport,
    targetDate,
    flightScheduleFilters,

    dataConnectionCriteria,
    normalDistributionParams,

    allocationTables,

    matrix,
    setMatrix,
  } = useScenarioStore(
    useShallow((s) => ({
      // passenger_attr: s.passenger_attr,
      // facility_info: s.facility_info,
      // setFacilityInformation: s.setFacilityInformation,
      // overview: s.overview,
      // setOverview: s.setOverview,
      // tabIndex: s.tabIndex,
      // setTabIndex: s.setTabIndex,
      // scenarioInfo: s.scenarioInfo,
      // +++
      currentScenarioTab: s.scenarioProfile.currentScenarioTab,
      setCurrentScenarioTab: s.scenarioProfile.actions.setCurrentScenarioTab,
      scenarioTerminal: s.scenarioProfile.scenarioTerminal,

      procedures_: s.airportProcessing.procedures,
      settings: s.facilityCapacity.settings,
      targetAirport: s.flightSchedule.targetAirport,
      targetDate: s.flightSchedule.targetDate,
      flightScheduleFilters: s.flightSchedule.selectedFilters,

      dataConnectionCriteria: s.airportProcessing.dataConnectionCriteria,
      normalDistributionParams: s.passengerSchedule.normalDistributionParams,

      allocationTables: s.facilityConnection.allocationTables,

      matrix: s.scenarioOverview.matrix,
      setMatrix: s.scenarioOverview.actions.setMatrix,
    }))
  );

  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!visible) setIsInitialized(false);
  }, [visible]);

  const [simulationParams, setSimulationParams] = useState<any>();
  const [overviewData, setOverviewData] = useState<SimulationOverviewResponse>();
  const [simulationData, setSimulationData] = useState<SimulationResponse>();
  const [loadingSimulation, setLoadingSimulation] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const [procedureIndex, setProcedureIndex] = useState(0);
  const [nodeIndex, setNodeIndex] = useState<number[]>([]);

  const [selColorCriteria, setSelColorCriteria] = useState('Airline');
  const [selGroupCriteria, setSelGroupCriteria] = useState(GROUP_CRITERIAS[0].id);

  const [loaded, setLoaded] = useState(false);

  // const procedures = [
  //   ...(passenger_attr?.procedures?.map((item, index) => {
  //     return {
  //       text: item.name,
  //     };
  //   }) || []),
  //   { text: 'Total' },
  // ] as ProcedureInfo[];

  // useEffect(() => {
  //   if (nodeIndex.length < 1 && passenger_attr?.procedures) {
  //     setNodeIndex(Array(passenger_attr?.procedures.length).fill(0));
  //   }
  // }, [passenger_attr?.procedures]);

  const loadOverview = () => {
    // if (loaded) {
    //   const params = {
    //     ...(facility_info?.params || simulationParams),
    //     scenario_id: simulationId,
    //   };
    //   setLoadingSimulation(true);
    //   setOverviewData(undefined);
    //   setSimulationData(undefined);
    //   setSimulationParams(params);
    //   getSimulationOverview(simulationId, params)
    //     .then(({ data }) => {
    //       console.log(data);
    //       setOverviewData(data);
    //       setOverview({ ...overview, matric: data?.matric });
    //       setSimulationData(undefined);
    //       // saveSnapshot(params, data);
    //     })
    //     .catch((e) => {
    //       setLoadError(true);
    //     })
    //     .finally(() => {
    //       setLoadingSimulation(false);
    //     });
    // }
  };

  // FIXME: 아래 2개의 useEffect를 통합
  // 사용자가 해당 탭을 선택했을 때,
  // [1] 데이터가 loaded 되어있지 않으면 스냅샷에서 데이터를 가지고 온다.
  // [2] 데이터가 loaded 되어있으면 Overview 데이터를 가지고 온다.
  // useEffect(() => {
  //   if (visible) {
  //     if (!loaded) {
  //       // restoreSnapshot();
  //       setLoaded(true);
  //     } else {
  //       loadOverview();
  //       loadSimulation();
  //     }
  //   }
  // }, [visible]);

  // 위 useEffect에서 loaded 값이 변하면 Overview 데이터를 가지고 온다.
  // useEffect(() => {
  //   if (loaded) {
  //     loadOverview();
  //     loadSimulation();
  //   }
  // }, [loaded]);

  const runSimulation = async () => {
    if (!simulationParams) {
      return console.error('Simulation parameters are not set.');
    }

    console.log(simulationParams);

    await requestSimulation(simulationId, simulationParams);

    // NOTE: 시뮬레이션 시작 코드
    // setLoadingSimulation(true);
    // runSimulation(params)
    //   .then(({ data }) => {
    //     const chartKeys = ['inbound', 'outbound', 'queing'];
    //     for (const chartGroupCur of data?.chart || []) {
    //       for (const chartKeyCur of chartKeys) {
    //         const chartCur = chartGroupCur[chartKeyCur] as {
    //           chart_x_data: string[];
    //           chart_y_data: ChartData;
    //         };
    //         for (const criteriaCur in chartCur?.chart_y_data) {
    //           const criteriaDataCur = chartCur?.chart_y_data[criteriaCur].sort((a, b) => a.order - b.order);
    //           const acc_y = Array(criteriaDataCur[0]?.y?.length || 0).fill(0);
    //           for (const itemCur of criteriaDataCur || []) {
    //             itemCur.acc_y = Array(itemCur.y.length).fill(0);
    //             for (let i = 0; i < itemCur.y.length; i++) {
    //               acc_y[i] += itemCur.y[i];
    //               itemCur.acc_y[i] = Number(acc_y[i]);
    //             }
    //           }
    //         }
    //       }
    //     }
    //     setSimulationData(data);
    //     saveSnapshot(params, overviewData, data);
    //     setLoadingSimulation(false);
    //   })
    //   .catch((e) => {
    //     console.error(e);
    //     setSimulationData(undefined);
    //     setLoadError(true);
    //     setLoadingSimulation(false);
    //   });
  };

  const loadSimulation = useCallback(async () => {
    try {
      const { data } = await fetchSimulation(simulationId);
      if (data) {
        setSimulationData(data);
      }
    } catch (error) {
      console.error(error);
      return null;
    }
  }, [simulationId]);

  // ==============================================================================

  // HACK: 아래 코드 개선하기
  // ‼️ 코드의 시작점이다.
  useEffect(() => {
    if (!visible || isInitialized) return;

    let nodeIdCur = 0;

    const components: {
      name: string;
      nodes: {
        id: number;
        name: string;
        max_queue_length: number;
        facility_count: number;
        facility_schedules: Array<number[]>;
      }[];
    }[] = [];

    for (let p = 0; p < procedures_.length; p++) {
      const currentComponent = procedures_[p];
      const nodeCount = currentComponent?.nodes?.length || 0;
      const nodes: {
        id: number;
        name: string;
        max_queue_length: number;
        facility_count: number;
        facility_schedules: Array<number[]>;
      }[] = [];

      for (let n = 0; n < nodeCount; n++) {
        const id = `${p}_${n}`;
        const targetSetting = settings[id] || {};
        const nodeName = procedures_[p].nodes[n];

        nodes.push({
          id: nodeIdCur++,
          name: nodeName,
          max_queue_length: targetSetting.maximumQueuesAllowedPer,
          facility_count: targetSetting.numberOfEachDevices,
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

      components.push({
        // name: currentComponent?.nameText?.toLowerCase().replace(/[\s-]+/g, '_') || '',
        name: currentComponent.name,
        nodes,
      });
    }

    // --- 🔥 삭제 고려 대상 🔥 ---
    const cleanedProcesses = {};

    allocationTables.forEach((table, index) => {
      const defaultMatrix = {};

      table.data?.forEach((row) => {
        // const rowName = row.name.toLowerCase().replace(/[\s-]+/g, '_');

        defaultMatrix[row.name] = {};

        row.values.forEach((val, idx) => {
          defaultMatrix[row.name][table.header[idx].name] = Number(val) / 100;
        });
      });

      cleanedProcesses[index + 1] = {
        name: table.title,
        nodes: table.header.map((header) => header.name),
        source: String(index),
        destination: procedures_.length < index + 2 ? null : String(index + 2),
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
    // --- 🔥 삭제 고려 대상 🔥 ---

    getSimulationOverview(simulationId, {
      scenario_id: simulationId,
      components,
      ...params,
    })
      .then(({ data }) => {
        setMatrix(data.matric);
      })
      .catch((e) => {
        console.error('Error fetching overview data:', e);
        setLoadError(true);
      });

    loadSimulation();

    setSimulationParams({ scenario_id: simulationId, components, ...params });
    setIsInitialized(true);
  }, [
    visible,
    isInitialized,
    allocationTables,
    dataConnectionCriteria,
    flightScheduleFilters,
    loadSimulation,
    normalDistributionParams,
    procedures_,
    setMatrix,
    settings,
    simulationId,
    targetAirport.iata,
    targetDate,
  ]);

  // ==============================================================================

  const processCurrent = procedures_[procedureIndex]?.nameText?.toLowerCase().replace(/[\s-]+/g, '_');

  const kpiDataCurrent = simulationData?.kpi?.find(
    (item) =>
      // item.process == processCurrent &&
      // passenger_attr?.procedures?.[procedureIndex]?.nodes[nodeIndex[procedureIndex]] == item.node
      item
  );

  const chartDataCurrent = simulationData?.chart?.find(
    (item) =>
      // item.process == processCurrent &&
      // passenger_attr?.procedures?.[procedureIndex]?.nodes[nodeIndex[procedureIndex]] == item.node
      item
  );

  const lineChartDataCurrent = simulationData?.line_chart?.find(
    (item) =>
      // item.process == processCurrent &&
      // passenger_attr?.procedures?.[procedureIndex]?.nodes[nodeIndex[procedureIndex]] == item.node
      item
  );

  const inOutChartMaxY = Math.max(
    ...(chartDataCurrent?.inbound?.chart_y_data[selColorCriteria]?.map((item) => item.acc_y)?.[0] || [0]),
    ...(chartDataCurrent?.outbound?.chart_y_data[selColorCriteria]?.map((item) => item.acc_y)?.[0] || [0])
  );
  // const lineChartDate = dayjs(chartDataCurrent?.inbound?.chart_x_data?.[chartDataCurrent?.inbound?.chart_x_data.length / 2]).format('YYYY-MM-DD');

  return !visible ? null : (
    <div>
      <h2 className="title-sm mt-[25px]">Overview</h2>

      {/* @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ */}
      {/* 여기서부터 하기!!!!!!!!!! */}
      {/* @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ */}
      {matrix && matrix.length > 0 ? (
        <div className="overview-wrap mt-[10px]">
          {matrix.map((item, index) => (
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
      ) : null}

      {loadingSimulation ? (
        <div className="flex min-h-[200px] flex-1 items-center justify-center">
          <OrbitProgress color="#32cd32" size="medium" text="" textColor="" />
        </div>
      ) : simulationData ? (
        <div>
          <h2 className="title-sm mt-[40px]">Simulation completed</h2>

          <div className="mt-[20px] flex items-center justify-between gap-[20px]">
            <div className="flex flex-grow items-center gap-[25px] rounded-md border border-default-300 bg-default-50 px-[20px] py-[40px]">
              <Image width={60} height={60} src="/image/ico-check-green.svg" alt="" />

              <dl className="flex flex-col gap-[8px]">
                <dt className="text-2xl font-semibold text-default-800">
                  {simulationData.simulation_completed[0].value} Passengers
                </dt>
                <dd className="text-xl text-default-500">completed passengers</dd>
              </dl>
            </div>

            <div className="flex flex-grow items-center gap-[25px] rounded-md border border-default-300 bg-default-50 px-[20px] py-[40px]">
              <Image width={60} height={60} src="/image/ico-check-red.png" alt="" />
              <dl className="flex flex-col gap-[8px]">
                <dt className="text-2xl font-semibold text-default-800">
                  {simulationData.simulation_completed[1].value} Passengers
                </dt>
                <dd className="text-xl text-default-500">incomplete passengers</dd>
              </dl>
            </div>
          </div>

          <h2 className="title-sm mt-[44px]">
            Passenger Flow {simulationData.simulation_completed[0].value} Passengers
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
                    // color: simulationData?.sankey.label.map((_, index) => SankeyColors[index % SankeyColors.length]),
                  },
                  link: simulationData?.sankey.link,
                },
              ]}
              chartLayout={{
                title: 'Sankey Diagram',
                margin: { l: 16, r: 16, b: 16, t: 16 },
                font: { size: 20 },
              }}
              // config={{ displayModeBar: false }}
            />
          </div>

          <div>
            <h2 className="title-sm mt-[60px]">Passenger by Facility</h2>

            <TabDefault
              tabCount={procedures_.length}
              currentTab={procedureIndex}
              tabs={procedures_.map((tab) => ({ text: tab.nameText, number: null }))}
              onTabChange={(index) => {
                setProcedureIndex(index);
              }}
              className={`tab-secondary mt-[25px]`}
            />

            {/* {procedureIndex < procedures_.length - 1 ? (
              <ul className="gate-list grid-cols-5">
                {passenger_attr?.procedures?.[procedureIndex]?.nodes?.map((text, index) => (
                  <li key={index} className={`${index == nodeIndex[procedureIndex] ? 'active' : ''}`}>
                    <button
                      onClick={() => {
                        setNodeIndex(nodeIndex.map((val, idx) => (idx == procedureIndex ? index : val)));
                      }}
                    >
                      {text}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null} */}
          </div>

          {procedureIndex < procedures_.length - 1 ? (
            <div>
              <div className="indicator mt-[20px]">
                <h4 className="text-lg font-semibold">KPI Indicators</h4>

                <ul className="indicator-list grid-cols-3 gap-[20px]">
                  {kpiDataCurrent?.kpi?.map((item, index) => (
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

              <div className="mt-[40px] flex items-center justify-between">
                <p className="text-40 text-xl font-semibold">Graphs</p>
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
                      {Object.keys(simulationData?.chart[0]?.inbound?.chart_y_data).map((text, index) => (
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

              <div className="mb-[20px] mt-[30px] flex justify-between">
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
                      color: '#FF0000',
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
                  // yaxis: { range: [0, inOutChartMaxY] },
                }}
                // config={{ displayModeBar: false, doubleClick: false }}
              />

              <div className="mb-[20px] mt-[50px] flex justify-between">
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
                  // yaxis: { range: [0, inOutChartMaxY] },
                }}
                // config={{ displayModeBar: false }}
              />

              <div className="mb-[20px] mt-[50px] flex justify-between">
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
                          // TODO 겹쳐지는 모든 Bar 들에 radius 줄 수 있는 방법 찾아보기.
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
                // config={{ displayModeBar: false }}
              />

              <div className="mb-[20px] mt-[50px] flex justify-between">
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
                // config={{ displayModeBar: false }}
              />
            </div>
          ) : (
            <>
              <div className="mt-[40px] flex items-center justify-between">
                <p className="text-40 mb-[10px] text-xl font-semibold">Total</p>
                <div className="flex flex-col">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div className="flex h-[30px] flex-row items-center pb-[10px]">
                        <Button
                          className="btn-lg btn-default text-sm"
                          icon={<Image width={20} height={20} src="/image/ico-button-menu.svg" alt="" />}
                          text="Group Criteria"
                          onClick={() => {}}
                        />
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
                // config={{ displayModeBar: false }}
              />
            </>
          )}

          <div className="chart-btn mt-[60px]">
            <button
              onClick={() => {
                const popupId = pushModal({
                  component: (
                    <AnalysisPopup
                      open={true}
                      onClose={() => {
                        popModal(popupId);
                      }}
                    />
                  ),
                });
              }}
            >
              <Image width={30} height={30} src="/image/ico-chart-result-01.svg" alt="" />
              Analyze Results
            </button>

            <button>
              <Image width={30} height={30} src="/image/ico-chart-result-02.svg" alt="" />
              Save Results
            </button>

            <button>
              <Image width={30} height={30} src="/image/ico-chart-result-03.svg" alt="" />
              Share Results
            </button>

            <button>
              <Image width={30} height={30} src="/image/ico-chart-result-04.svg" alt="" />
              View Recommendations
              <span>Beta</span>
            </button>
          </div>
        </div>
      ) : loadError ? (
        <div className="mt-[25px] flex flex-col items-center justify-center rounded-md border border-default-200 bg-default-50 py-[75px] text-center">
          <Image width={16} height={16} src="/image/ico-error.svg" alt="" />

          <p className="title-sm" style={{ color: '#30374F' }}>
            Unable to load data
          </p>
        </div>
      ) : (
        <div className="h-[50px]" />
      )}

      {/* 하단버튼 */}
      <div className="mt-[30px] flex justify-between">
        <button
          className="btn-md btn-default btn-rounded w-[210px] justify-between"
          onClick={() => setCurrentScenarioTab(currentScenarioTab - 1)}
        >
          <FontAwesomeIcon className="nav-icon" size="sm" icon={faAngleLeft} />
          <span className="flex flex-grow items-center justify-center">Facility Information</span>
        </button>

        {/* FIXME: [25.04.07] ADD CONDITIONS가 있을 때 데이터가 제대로 안 나오는 현상 발생 */}
        <button className="btn-md btn-tertiary btn-rounded w-[210px] justify-between" onClick={runSimulation}>
          <span className="flex flex-grow items-center justify-center">Run Simulation</span>
          <FontAwesomeIcon className="nav-icon" size="sm" icon={faAngleRight} />
        </button>
      </div>
    </div>
  );
}
