'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { faAngleLeft, faAngleRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { OrbitProgress } from 'react-loading-indicators';
import { ChartData, ProcedureInfo, SimulationResponse } from '@/types/simulations';
import { runSimulation } from '@/services/simulations';
import { BarColors, SankeyColors, useSimulationMetadata, useSimulationStore } from '@/stores/simulation';
import Button from '@/components/Button';
import TabDefault from '@/components/TabDefault';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { useResize } from '@/hooks/useResize';
import { getLastAccessToken } from '@/lib/axios';
import { numberWithCommas } from '@/lib/utils';

const BarChart = dynamic(() => import('@/components/charts/BarChart'), { ssr: false });
const SankeyChart = dynamic(() => import('@/components/charts/SankeyChart'), { ssr: false });

interface TabSimulationProps {
  simulationId: string;
  visible: boolean;
}

export default function TabSimulation({ simulationId, visible }: TabSimulationProps) {
  const refWidth = useRef(null);
  const { passenger_attr, facility_info } = useSimulationMetadata();
  const { tabIndex, setTabIndex, scenarioInfo, overviews } = useSimulationStore();

  const [socket, setSocket] = useState<WebSocket>();
  const [loaded, setLoaded] = useState(false);

  const [simulationData, setSimulationData] = useState<SimulationResponse>();
  const [loadingSimulation, setLoadingSimulation] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const [procedureIndex, setProcedureIndex] = useState(0);
  const [nodeIndex, setNodeIndex] = useState<number[]>([]);
  const [selColorCriteria, setSelColorCriteria] = useState('Airline');

  const { width } = useResize(refWidth);

  const procedures = [
    ...(passenger_attr?.procedures?.map((item, index) => {
      return {
        text: item.name,
      };
    }) || []),
  ] as ProcedureInfo[];

  useEffect(() => {
    if (nodeIndex.length < 1 && passenger_attr?.procedures) {
      setNodeIndex(Array(passenger_attr?.procedures.length).fill(0));
    }
  }, [passenger_attr?.procedures]);

  const onRunSimulation = () => {
    const params = { ...facility_info?.params, scenario_id: simulationId };

    // const ws = new WebSocket('ws://43.202.4.213:8000/api/v1/test', getLastAccessToken());

    // ws.onopen = () => {
    //   console.log('WebSocket 연결이 열렸습니다.');

    //   // ws.send(params);
    // };

    // ws.onmessage = (event) => {
    //   console.log(event.data);
    // };

    // ws.onerror = (error) => {
    //   console.error('WebSocket 에러:', error);
    // };

    // ws.onclose = () => {
    //   console.log('WebSocket 연결이 종료되었습니다.');
    //   ws.close();
    //   setSocket(undefined);
    // };

    // setSocket(ws);

    setLoadingSimulation(true);

    runSimulation(params)
      .then(({ data }) => {
        const chartKeys = ['inbound', 'outbound', 'queing', 'waiting'];
        for (const chartGroupCur of data?.chart || []) {
          for (const chartKeyCur of chartKeys) {
            const chartCur = chartGroupCur[chartKeyCur] as {
              chart_x_data: string[];
              chart_y_data: ChartData;
            };
            for (const criteriaCur in chartCur?.chart_y_data) {
              const criteriaDataCur = chartCur?.chart_y_data[criteriaCur].sort((a, b) => a.order - b.order);
              const acc_y = Array(criteriaDataCur[0].y.length).fill(0);
              for (const itemCur of criteriaDataCur) {
                itemCur.acc_y = Array(itemCur.y.length).fill(0);
                for (let i = 0; i < itemCur.y.length; i++) {
                  acc_y[i] += itemCur.y[i];
                  itemCur.acc_y[i] = Number(acc_y[i]);
                }
              }
            }
          }
        }
        setSimulationData(data);
        setLoadingSimulation(false);
      })
      .catch(() => {
        setLoadError(true);
        setLoadingSimulation(false);
      });
  };

  const kpiDataCurrent = simulationData?.kpi?.find(
    (item) =>
      item.process == procedures[procedureIndex].text?.toLowerCase().replace(/[\s-]+/g, '_') &&
      passenger_attr?.procedures?.[procedureIndex]?.nodes[nodeIndex[procedureIndex]] == item.node
  );
  const chartDataCurrent = simulationData?.chart?.find(
    (item) =>
      item.process == procedures[procedureIndex].text?.toLowerCase().replace(/[\s-]+/g, '_') &&
      passenger_attr?.procedures?.[procedureIndex]?.nodes[nodeIndex[procedureIndex]] == item.node
  );

  return !visible ? null : (
    <div ref={refWidth}>
      <h2 className="title-sm mt-[25px]">Overview</h2>
      <div className="overview-wrap mt-[10px]">
        {overviews?.map((item, index) => (
          <a key={index} href="#" className="overview-item h-[120px] overflow-hidden">
            <dl>
              <dt className="text-left">{item.name}</dt>
              <dd className="text-right">
                {item.value || (item.name == 'Terminal' ? scenarioInfo?.terminal : '')}
              </dd>
            </dl>
          </a>
        ))}
      </div>
      {loadingSimulation ? (
        <div className="flex min-h-[200px] flex-1 items-center justify-center">
          <OrbitProgress color="#32cd32" size="medium" text="" textColor="" />
        </div>
      ) : simulationData ? (
        <div>
          <h2 className="title-sm mt-[40px]">Simulation completed</h2>
          <div className="mt-[20px] flex items-center justify-between gap-[20px]">
            <div className="flex flex-grow items-center gap-[25px] rounded-md border border-default-300 bg-default-50 px-[20px] py-[40px]">
              <img src="/image/ico-check-green.svg" alt="" />
              <dl className="flex flex-col gap-[8px]">
                <dt className="text-2xl font-semibold text-default-800">
                  {numberWithCommas(simulationData.simulation_completed[0].value)} Passengers
                </dt>
                <dd className="text-xl text-default-500">completed passengers</dd>
              </dl>
            </div>
            <div className="flex flex-grow items-center gap-[25px] rounded-md border border-default-300 bg-default-50 px-[20px] py-[40px]">
              <img src="/image/ico-check-red.png" alt="" />
              <dl className="flex flex-col gap-[8px]">
                <dt className="text-2xl font-semibold text-default-800">
                  {numberWithCommas(simulationData.simulation_completed[1].value)} Passengers
                </dt>
                <dd className="text-xl text-default-500">incomplete passengers</dd>
              </dl>
            </div>
          </div>
          <h2 className="title-sm mt-[44px]">Passenger Flow</h2>
          <div className="mt-[40px] flex h-[570px] items-center justify-center rounded-md bg-white">
            <SankeyChart
              chartData={[
                {
                  type: 'sankey',
                  orientation: 'h',
                  node: {
                    pad: 15,
                    thickness: 20,
                    line: {
                      color: 'black',
                      width: 0.5,
                    },
                    label: simulationData?.sankey.label,
                    color: simulationData?.sankey.label.map(
                      (_, index) => SankeyColors[index % SankeyColors.length]
                    ),
                  },
                  link: simulationData?.sankey.link,
                },
              ]}
              chartLayout={{
                title: 'Sankey Diagram',
                font: {
                  size: 10,
                },
                width,
                height: 570,
                margin: {
                  l: 100,
                  r: 100,
                  t: 0,
                  b: 0,
                },
              }}
              config={{
                displayModeBar: false,
              }}
            />
          </div>
          <div 
            // className='sticky top-0 z-[100] bg-white pb-[10px]'
            >
            <h2 className="title-sm mt-[60px]">Facility Information</h2>
            <TabDefault
              tabCount={procedures.length}
              currentTab={procedureIndex}
              tabs={procedures.map((tab) => ({ text: tab.text, number: tab.number || 0 }))}
              onTabChange={(index) => {
                setProcedureIndex(index);
              }}
              className={`tab-secondary mt-[25px]`}
            />
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
          </div>
          <div>
            <div className="indicator mt-[20px]">
              <h4 className="text-lg font-semibold">KPI Indicators</h4>
              <ul className="indicator-list grid-cols-3 gap-[20px]">
                {
                  kpiDataCurrent?.kpi?.map((item, index) => (
                    <li key={index}>
                      <dl>
                        <dt className="text-left">{item.title}</dt>
                        <dd className="text-right mt-[10px]">{item.value}{item.unit || ''}</dd>
                      </dl>
                    </li>
                  ))
                }
              </ul>
            </div>
            <div className="mt-[40px] flex items-center justify-between">
              <p className="text-40 text-xl font-semibold">Passenger Processing Graphs</p>
              <div className="flex flex-col">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="flex h-[30px] flex-row items-center pb-[10px]">
                      <Button
                        className="btn-lg btn-default text-sm"
                        icon={<Image width={20} height={20} src="/image/ico-button-menu.svg" alt="" />}
                        text="Color Criteria"
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
              <p className="text-sm font-medium text-default-600">Inbound Processing Volume Graph</p>
            </div>
            <BarChart
              chartData={[
                ...(chartDataCurrent?.inbound?.chart_y_data[selColorCriteria]
                  .sort((a, b) => b.order - a.order)
                  .map((item, index) => {
                    return {
                      x: chartDataCurrent?.inbound?.chart_x_data,
                      y: item.acc_y,
                      name: item.name,
                      type: 'bar',
                      marker: {
                        color: (String(chartDataCurrent?.inbound?.chart_x_data?.length) in BarColors
                          ? BarColors[String(chartDataCurrent?.inbound?.chart_x_data?.length)]
                          : BarColors.DEFAULT)[index],
                        opacity: 1,
                        cornerradius: 7,
                        // TODO 겹쳐지는 모든 Bar 들에 radius 줄 수 있는 방법 찾아보기.
                      },
                      hovertemplate: item.y?.map((val) => `[%{x}] ${val}`),
                    };
                  }) as Plotly.Data[]),
                // {
                //   x: [...(facilitySettingsCurrent.lineChartData?.y || [])].reverse(),
                //   y: chartDataCurrent.map((val) => `${val.name}  `),
                //   type: 'scatter',
                //   mode: 'lines',
                //   marker: {
                //     color: '#FF0000',
                //     opacity: 1,
                //   },
                //   orientation: 'h',
                // }
              ]}
              chartLayout={{
                width,
                height: 390,
                margin: {
                  l: 30,
                  r: 10,
                  t: 0,
                  b: 30,
                },
                barmode: 'overlay',
                legend: {
                  x: 1,
                  y: 1.1,
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
            <div className="mb-[20px] mt-[50px] flex justify-between">
              <p className="text-sm font-medium text-default-600">Outbound Processing Volume Graph</p>
            </div>
            <BarChart
              chartData={[
                ...(chartDataCurrent?.outbound?.chart_y_data[selColorCriteria]
                  .sort((a, b) => b.order - a.order)
                  .map((item, index) => {
                    return {
                      x: chartDataCurrent?.outbound?.chart_x_data,
                      y: item.acc_y,
                      name: item.name,
                      type: 'bar',
                      marker: {
                        color: (String(chartDataCurrent?.outbound?.chart_x_data?.length) in BarColors
                          ? BarColors[String(chartDataCurrent?.outbound?.chart_x_data?.length)]
                          : BarColors.DEFAULT)[index],
                        opacity: 1,
                        cornerradius: 7,
                        // TODO 겹쳐지는 모든 Bar 들에 radius 줄 수 있는 방법 찾아보기.
                      },
                      hovertemplate: item.y?.map((val) => `[%{x}] ${val}`),
                    };
                  }) as Plotly.Data[]),
                // {
                //   x: [...(facilitySettingsCurrent.lineChartData?.y || [])].reverse(),
                //   y: chartDataCurrent.map((val) => `${val.name}  `),
                //   type: 'scatter',
                //   mode: 'lines',
                //   marker: {
                //     color: '#FF0000',
                //     opacity: 1,
                //   },
                //   orientation: 'h',
                // }
              ]}
              chartLayout={{
                width,
                height: 390,
                margin: {
                  l: 30,
                  r: 10,
                  t: 0,
                  b: 30,
                },
                barmode: 'overlay',
                legend: {
                  x: 1,
                  y: 1.1,
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
            <div className="mb-[20px] mt-[50px] flex justify-between">
              <p className="text-sm font-medium text-default-600">Queing Processing Volume Graph</p>
            </div>
            <BarChart
              chartData={[
                ...(chartDataCurrent?.queing?.chart_y_data[selColorCriteria]
                  .sort((a, b) => b.order - a.order)
                  .map((item, index) => {
                    return {
                      x: chartDataCurrent?.queing?.chart_x_data,
                      y: item.acc_y,
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
                // {
                //   x: [...(facilitySettingsCurrent.lineChartData?.y || [])].reverse(),
                //   y: chartDataCurrent.map((val) => `${val.name}  `),
                //   type: 'scatter',
                //   mode: 'lines',
                //   marker: {
                //     color: '#FF0000',
                //     opacity: 1,
                //   },
                //   orientation: 'h',
                // }
              ]}
              chartLayout={{
                width,
                height: 390,
                margin: {
                  l: 30,
                  r: 10,
                  t: 0,
                  b: 30,
                },
                barmode: 'overlay',
                legend: {
                  x: 1,
                  y: 1.1,
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
            <div className="mb-[20px] mt-[50px] flex justify-between">
              <p className="text-sm font-medium text-default-600">Waiting Processing Volume Graph</p>
            </div>
            <BarChart
              chartData={[
                ...(chartDataCurrent?.waiting?.chart_y_data[selColorCriteria]
                  .sort((a, b) => b.order - a.order)
                  .map((item, index) => {
                    return {
                      x: chartDataCurrent?.waiting?.chart_x_data,
                      y: item.acc_y,
                      name: item.name,
                      type: 'bar',
                      marker: {
                        color: (String(chartDataCurrent?.waiting?.chart_x_data?.length) in BarColors
                          ? BarColors[String(chartDataCurrent?.waiting?.chart_x_data?.length)]
                          : BarColors.DEFAULT)[index],
                        opacity: 1,
                        cornerradius: 7,
                        // TODO 겹쳐지는 모든 Bar 들에 radius 줄 수 있는 방법 찾아보기.
                      },
                      hovertemplate: item.y?.map((val) => `[%{x}] ${val}`),
                    };
                  }) as Plotly.Data[]),
                // {
                //   x: [...(facilitySettingsCurrent.lineChartData?.y || [])].reverse(),
                //   y: chartDataCurrent.map((val) => `${val.name}  `),
                //   type: 'scatter',
                //   mode: 'lines',
                //   marker: {
                //     color: '#FF0000',
                //     opacity: 1,
                //   },
                //   orientation: 'h',
                // }
              ]}
              chartLayout={{
                width,
                height: 390,
                margin: {
                  l: 30,
                  r: 10,
                  t: 0,
                  b: 30,
                },
                barmode: 'overlay',
                legend: {
                  x: 1,
                  y: 1.1,
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
            <div className="chart-btn mt-[60px]">
              <button>
                <img src="/image/ico-chart-result-01.svg" alt="" />
                Analyze Results
              </button>
              <button>
                <img src="/image/ico-chart-result-02.svg" alt="" />
                Save Results
              </button>
              <button>
                <img src="/image/ico-chart-result-03.svg" alt="" />
                Share Results
              </button>
              <button>
                <img src="/image/ico-chart-result-04.svg" alt="" />
                View Recommendations
                <span>Beta</span>
              </button>
            </div>
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
          onClick={() => setTabIndex(tabIndex - 1)}
        >
          <FontAwesomeIcon className="nav-icon" size="sm" icon={faAngleLeft} />
          <span className="flex flex-grow items-center justify-center">Previous</span>
        </button>
        <button
          className="btn-md btn-tertiary btn-rounded w-[210px] justify-between"
          onClick={() => onRunSimulation()}
        >
          <span className="flex flex-grow items-center justify-center">Simulation Run</span>
          <FontAwesomeIcon className="nav-icon" size="sm" icon={faAngleRight} />
        </button>
      </div>
    </div>
  );
}
