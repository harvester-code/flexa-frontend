'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { faAngleLeft, faAngleRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { FacilityInformation, ProcedureInfo } from '@/types/simulations';
import { getFacilityInfoLineChartData } from '@/services/simulations';
import { useSimulationMetadata, useSimulationStore } from '@/stores/simulation';
import Button from '@/components/Button';
import Checkbox from '@/components/Checkbox';
import { Dropdown } from '@/components/Conditions';
import Input from '@/components/Input';
import TabDefault from '@/components/TabDefault';
import { useResize } from '@/hooks/useResize';
import { numberWithCommas } from '@/lib/utils';
import GridTable, { GridTableHeader, GridTableRow } from './GridTable';

const BarChart = dynamic(() => import('@/components/charts/BarChart'), { ssr: false });

const DefaultTimeUnit = 10;

interface TableData {
  title?: string;
  header: GridTableHeader[];
  data: GridTableRow[];
}

interface TabFacilityInformationProps {
  simulationId: string;
  visible: boolean;
}

interface FacilitySettings {
  numberOfEachDevices: number;
  processingTime: number;
  maximumQueuesAllowedPer: number;
  defaultTableData?: TableData;
  automaticInput?: boolean;
  timeUnit?: number;
  openingHoursTableData?: TableData;
  lineChartData?: {
    x: string[];
    y: number[];
  };
  overviewChartVisible?: boolean;
}

const facilitySettingsDefaults = [
  { name: 'Processing time (sec)', value: 60 },
  // { name: 'Maximum Allowed Queue (persons)', value: 200 },
];

const tableHeaderHeight = 52;
const tableCellHeight = 36;

export default function TabFacilityInformation({ simulationId, visible }: TabFacilityInformationProps) {
  const refWidth = useRef(null);
  const { passenger_attr, facility_conn, facility_info, setFacilityInformation } = useSimulationMetadata();
  const {
    tabIndex,
    setTabIndex,
    facilityConnCapacities,
    setFacilityConnCapacities,
    flightScheduleTime,
    processingProcedureTime,
  } = useSimulationStore();

  const [procedureIndex, setProcedureIndex] = useState(0);
  const [nodeIndex, setNodeIndex] = useState<number[]>([]);
  const [availableProcedureIndex, setAvailableProcedureIndex] = useState(1);

  const { width } = useResize(refWidth);

  const id = `${procedureIndex}_${nodeIndex[procedureIndex] || 0}`;
  const [facilitySettings, _setFacilitySettings] = useState<{
    [id: string]: FacilitySettings;
  }>({});

  const [loaded, setLoaded] = useState(false);

  const saveSnapshot = (params?: Partial<FacilityInformation>, snapshot: any = {}) => {
    const newSnapshot: any = {
      procedureIndex,
      nodeIndex,
      availableProcedureIndex,
      facilitySettings,
      ...snapshot,
    };
    setFacilityInformation({ ...facility_info, ...(params || {}), snapshot: newSnapshot });
  };

  const restoreSnapshot = () => {
    if (facility_info?.snapshot) {
      const snapshot = facility_info?.snapshot;
      if (snapshot.params) setFacilityInformation({ ...facility_info, params: snapshot.params });
      if (snapshot.procedureIndex) setProcedureIndex(snapshot.procedureIndex);
      if (snapshot.nodeIndex) setNodeIndex(snapshot.nodeIndex);
      if (snapshot.availableProcedureIndex) setAvailableProcedureIndex(snapshot.availableProcedureIndex);
      if (snapshot.facilitySettings) _setFacilitySettings(snapshot.facilitySettings);
    }
    if (facility_conn?.snapshot) {
      const snapshot = facility_conn?.snapshot;
      if (snapshot.facilityConnCapacities) setFacilityConnCapacities(snapshot.facilityConnCapacities);
    }
  };

  useEffect(() => {
    if (visible && !loaded) {
      if (!flightScheduleTime && !processingProcedureTime && facility_info?.snapshot) {
        restoreSnapshot();
      }
      setLoaded(true);
    }
  }, [visible]);

  const facilitySettingsCurrent = facilitySettings[id] || {};
  const setFacilitySettings = (data: FacilitySettings, snapshot: boolean = false) => {
    const defaultTableData =
      data.numberOfEachDevices != facilitySettingsCurrent.numberOfEachDevices
        ? // || data.maximumQueuesAllowedPer != facilitySettingsCurrent.maximumQueuesAllowedPer
          {
            header: Array(data.numberOfEachDevices)
              .fill(0)
              .map((_, index) => {
                return {
                  name: `Desk ${String(index + 1).padStart(2, '0')}`,
                  style: { background: '#F9F9FB' },
                  minWidth: 80,
                };
              }),
            data: facilitySettingsDefaults.map((item, index) => {
              return {
                name: item.name,
                values: Array(data.numberOfEachDevices).fill(
                  String(index == 0 ? data.processingTime : data.maximumQueuesAllowedPer)
                ),
                style: { background: '#FFFFFF' },
              };
            }),
          }
        : facilitySettingsCurrent.defaultTableData;
    const newFacilitySettings = { ...facilitySettings, [id]: { ...data, defaultTableData } };
    _setFacilitySettings(newFacilitySettings);
    if (snapshot) saveSnapshot({}, { facilitySettings: newFacilitySettings });
  };

  const defaultTableData = facilitySettingsCurrent.defaultTableData;
  const setDefaultTableData = (defaultTableData: TableData) => {
    _setFacilitySettings({
      ...facilitySettings,
      [id]: {
        ...facilitySettingsCurrent,
        defaultTableData: { ...facilitySettingsCurrent.defaultTableData, ...defaultTableData },
      },
    });
  };

  const openingHoursTableData = facilitySettingsCurrent.openingHoursTableData;
  const setOpeningHoursTableData = (openingHoursTableData: TableData) => {
    _setFacilitySettings({
      ...facilitySettings,
      [id]: {
        ...facilitySettingsCurrent,
        openingHoursTableData: { ...facilitySettingsCurrent.openingHoursTableData, ...openingHoursTableData },
      },
    });
  };

  useEffect(() => {
    if (!facilitySettingsCurrent || !facilitySettingsCurrent.defaultTableData) {
      setFacilitySettings({
        numberOfEachDevices: 5,
        processingTime: 60,
        maximumQueuesAllowedPer: 200,
        overviewChartVisible: true,
      });
    }
  }, [id]);

  const chartDataCurrent = [...(facilitySettingsCurrent.openingHoursTableData?.data || [])].reverse();

  const procedures = [
    ...(passenger_attr?.procedures?.map((item, index) => {
      return {
        text: item.name,
      };
    }) || []),
  ] as ProcedureInfo[];

  useEffect(() => {
    if (visible && !loaded) {
      setLoaded(true);
    }
  }, [visible]);

  useEffect(() => {
    if (passenger_attr?.procedures && passenger_attr?.procedures?.length > 0) {
      setProcedureIndex(0);
      setNodeIndex(Array(passenger_attr?.procedures.length).fill(0));
    }
  }, [passenger_attr?.procedures]);

  const onSetOpeningHoursTableData = () => {
    const timeUnit = facilitySettingsCurrent.timeUnit || DefaultTimeUnit;
    const times: Array<string> = [];
    for (let timeCur = 0; timeCur < 1440; timeCur += timeUnit) {
      times.push(`${String(Math.floor(timeCur / 60)).padStart(2, '0')}:${String(timeCur % 60).padStart(2, '0')}`);
    }
    setFacilitySettings(
      {
        ...facilitySettingsCurrent,
        timeUnit: timeUnit,
        openingHoursTableData: {
          header: Array(facilitySettingsCurrent.numberOfEachDevices)
            .fill(0)
            .map((_, index) => {
              return {
                name: `Desk ${String(index + 1).padStart(2, '0')}`,
                style: { background: '#F9F9FB' },
                minWidth: 80,
              };
            }),
          data: times.map((time, index) => {
            return {
              name: time,
              values: Array(facilitySettingsCurrent.numberOfEachDevices)
                .fill(0)
                .map((_, cidx) => String(facilitySettingsCurrent.defaultTableData?.data[0].values[cidx])),
              style: { background: '#FFFFFF' },
              height: tableCellHeight,
              checkToNumber: facilitySettingsCurrent.defaultTableData?.data[0].values,
            } as GridTableRow;
          }),
        },
      },
      true
    );
  };

  useEffect(() => {
    onSetChartData();
  }, [facilitySettingsCurrent.openingHoursTableData?.data, facilitySettingsCurrent.timeUnit]);

  const onSetChartData = () => {
    if (!facilitySettingsCurrent.openingHoursTableData) return;
    const params = {
      time_unit: facilitySettingsCurrent.timeUnit || DefaultTimeUnit,
      facility_schedules: facilitySettingsCurrent.openingHoursTableData?.data.map((item) => {
        return item.values.map((val) => {
          if (val.length < 1) return 0;
          const num = Number(val);
          return num == 0 ? 0.0000000001 : num;
        });
      }),
    };

    getFacilityInfoLineChartData(params).then(({ data }) => {
      setFacilitySettings({ ...facilitySettingsCurrent, lineChartData: data }, true);
    });
  };

  const onBtnNext = () => {
    const nodeCount = passenger_attr?.procedures?.[procedureIndex]?.nodes?.length || 0;
    if (nodeIndex[procedureIndex] + 1 < nodeCount) {
      const newNodeIndex = nodeIndex.map((val, idx) => (idx == procedureIndex ? val + 1 : val));
      setNodeIndex(newNodeIndex);
      saveSnapshot({}, { nodeIndex: newNodeIndex });
    } else if (procedureIndex + 1 < procedures.length) {
      setProcedureIndex(procedureIndex + 1);
      setAvailableProcedureIndex(procedureIndex + 1);
      saveSnapshot({}, { procedureIndex: procedureIndex + 1, availableProcedureIndex: procedureIndex + 1 });
    }
  };

  let simulationAvairable = true;

  for (let p = 0; p < procedures.length; p++) {
    const nodeCount = passenger_attr?.procedures?.[p]?.nodes?.length || 0;
    for (let n = 0; n < nodeCount; n++) {
      if (!facilitySettings?.[`${p}_${n}`]?.lineChartData) {
        simulationAvairable = false;
        break;
      }
    }
  }

  const onSimulation = () => {
    if (!simulationAvairable) return;
    let nodeIdCur = 0;
    const components: any[] = [];
    const params = { ...facility_conn?.params, components, scenario_id: simulationId };
    for (let p = 0; p < procedures.length; p++) {
      const componentCur = procedures[p];
      const nodes: any[] = [];
      const nodeCount = passenger_attr?.procedures?.[p]?.nodes?.length || 0;
      for (let n = 0; n < nodeCount; n++) {
        const idCur = `${p}_${n}`;
        const facilitySettingsCurrent = facilitySettings[idCur];
        const nodeName = passenger_attr?.procedures?.[p]?.nodes[n];
        nodes.push({
          id: nodeIdCur++,
          name: nodeName,
          max_queue_length: facilitySettingsCurrent.maximumQueuesAllowedPer,
          facility_count: facilitySettingsCurrent.numberOfEachDevices,
          facility_schedules: facilitySettingsCurrent.openingHoursTableData?.data.map((item) => {
            return item.values.map((val) => {
              if (val.length < 1) return 0;
              const num = Number(val);
              return num == 0 ? 0.0000000001 : num;
            });
          }),
        });
      }
      components.push({
        name: componentCur?.text?.toLowerCase().replace(/[\s-]+/g, '_'),
        nodes,
      });
    }

    saveSnapshot({ params });
    setTabIndex(tabIndex + 1);
  };

  const tableHeight = facilitySettingsCurrent?.openingHoursTableData?.data
    ? facilitySettingsCurrent?.openingHoursTableData?.data?.length * tableCellHeight + tableHeaderHeight + 2
    : 0;
  const vChartTop = facilitySettingsCurrent.lineChartData ? 1 : 0;
  const vChartHeight = facilitySettingsCurrent.lineChartData ? tableHeight + 544 : tableHeight + 8;
  const vChartMarginTop = facilitySettingsCurrent.lineChartData ? -270 : 0;
  const vChartParentHeight = facilitySettingsCurrent.lineChartData ? tableHeight + 280 : tableHeight;
  const procedureId = procedures[procedureIndex]?.text?.toLowerCase()?.replace(/[\s-]+/g, '_');
  const nodeName = passenger_attr?.procedures?.[procedureIndex]?.nodes?.[nodeIndex[procedureIndex]];

  const chartData: Plotly.Data[] = [];
  const chartDataOverview: Plotly.Data[] = [];

  if (procedureId && nodeName && facilitySettingsCurrent.lineChartData) {
    chartData.push({
      x: [...(facilityConnCapacities?.[procedureId]?.bar_chart_y_data[nodeName]?.y || [])].reverse(),
      y: chartDataCurrent.map((val) => `${val.name}  `),
      // name: item.name,
      type: 'bar',
      marker: {
        color: '#6941C6',
        opacity: 1,
        // @ts-expect-error 바 별 radius 추가
        cornerradius: 7,
      },
      orientation: 'h',
    });
    chartDataOverview.push({
      x: [...chartDataCurrent].reverse().map((val) => `${val.name}  `),
      y: facilityConnCapacities?.[procedureId]?.bar_chart_y_data[nodeName]?.y,
      type: 'bar',
      marker: {
        color: '#6941C6',
        opacity: 1,
        // @ts-expect-error 바 별 radius 추가
        cornerradius: 7,
      },
    });
    chartData.push({
      x: [...(facilitySettingsCurrent.lineChartData?.y || [])].reverse(),
      y: chartDataCurrent.map((val) => `${val.name}  `),
      type: 'scatter',
      mode: 'lines',
      marker: {
        color: '#FF0000',
        opacity: 1,
      },
      orientation: 'h',
    });
    chartDataOverview.push({
      x: [...chartDataCurrent].reverse().map((val) => `${val.name}  `),
      y: facilitySettingsCurrent.lineChartData?.y,
      type: 'scatter',
      mode: 'lines',
      marker: {
        color: '#FF0000',
        opacity: 1,
      },
    });
  }

  useEffect(() => {
    if (defaultTableData && facilitySettingsCurrent?.processingTime) {
      setDefaultTableData({
        ...defaultTableData,
        data: defaultTableData.data.map((item, index) => {
          return item.name == 'Processing time (sec)'
            ? {
                ...item,
                values: Array(item.values.length).fill(String(facilitySettingsCurrent.processingTime)),
              }
            : item;
        }),
      });
    }
  }, [facilitySettingsCurrent?.processingTime]);

  return !visible ? null : (
    <div ref={refWidth}>
      <h2 className="title-sm mt-[25px]">Facility Information</h2>
      <TabDefault
        tabCount={procedures.length}
        currentTab={procedureIndex}
        availableTabs={availableProcedureIndex}
        tabs={procedures.map((tab) => ({ text: tab.text, number: tab.number || 0 }))}
        onTabChange={(index) => {
          if (index > availableProcedureIndex) return;
          setProcedureIndex(index);
        }}
        className={`tab-secondary mt-[25px]`}
      />
      <ul className="gate-list grid-cols-5">
        {passenger_attr?.procedures?.[procedureIndex]?.nodes?.map((text, index) => (
          <li
            key={index}
            className={`${index == nodeIndex[procedureIndex] ? 'active' : facilitySettings?.[`${procedureIndex}_${index}`]?.lineChartData ? 'check' : ''}`}
          >
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
      <div className="mt-[30px] flex items-center justify-between">
        <h2 className="title-sm">Facility Default Settings</h2>
      </div>
      <div className="process-item-content mt-[17px] rounded-lg border border-default-300 bg-gray-100 p-[20px]">
        <div className="flex justify-between gap-[20px]">
          <dl className="flex flex-grow flex-col gap-[5px]">
            <dt>
              <h4 className="pl-[10px] text-sm font-semibold">{procedures[procedureIndex]?.text} desks</h4>
            </dt>
            <dd>
              <div className="flex h-[50px] w-full items-center justify-between rounded-full border border-default-300 bg-white p-[10px] text-sm">
                <button
                  onClick={() => {
                    if (facilitySettingsCurrent.numberOfEachDevices > 0) {
                      setFacilitySettings({
                        ...facilitySettingsCurrent,
                        numberOfEachDevices: facilitySettingsCurrent.numberOfEachDevices - 1,
                      });
                    }
                  }}
                >
                  <img src="/image/ico-num-minus.svg" alt="-" />
                </button>
                <Input
                  type="text"
                  placeholder=""
                  value={String(facilitySettingsCurrent.numberOfEachDevices)}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setFacilitySettings({
                      ...facilitySettingsCurrent,
                      numberOfEachDevices: Number(e.target.value),
                    });
                  }}
                  className="!border-0 text-center focus:!outline-none"
                />
                <button
                  onClick={() => {
                    setFacilitySettings({
                      ...facilitySettingsCurrent,
                      numberOfEachDevices: facilitySettingsCurrent.numberOfEachDevices + 1,
                    });
                  }}
                >
                  <img src="/image/ico-num-plus.svg" alt="+" />
                </button>
              </div>
            </dd>
          </dl>
          <dl className="flex flex-grow flex-col gap-[5px]">
            <dt>
              <h4 className="pl-[10px] text-sm font-semibold">Processing time (sec)</h4>
            </dt>
            <dd>
              <div className="flex h-[50px] w-full items-center justify-between rounded-full border border-default-300 bg-white p-[10px] text-sm">
                <button
                  onClick={() => {
                    if (facilitySettingsCurrent.processingTime > 0) {
                      setFacilitySettings({
                        ...facilitySettingsCurrent,
                        processingTime: facilitySettingsCurrent.processingTime - 1,
                      });
                    }
                  }}
                >
                  <img src="/image/ico-num-minus.svg" alt="-" />
                </button>
                <Input
                  type="text"
                  placeholder=""
                  value={String(facilitySettingsCurrent.processingTime)}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setFacilitySettings({
                      ...facilitySettingsCurrent,
                      processingTime: Number(e.target.value),
                    });
                  }}
                  className="!border-0 text-center focus:!outline-none"
                />
                <button
                  onClick={() => {
                    setFacilitySettings({
                      ...facilitySettingsCurrent,
                      processingTime: facilitySettingsCurrent.processingTime + 1,
                    });
                  }}
                >
                  <img src="/image/ico-num-plus.svg" alt="+" />
                </button>
              </div>
            </dd>
          </dl>
          <dl className="flex flex-grow flex-col gap-[5px]">
            <dt>
              <h4 className="pl-[10px] text-sm font-semibold">Maximum queues allowed per desks</h4>
            </dt>
            <dd>
              <div className="flex h-[50px] w-full items-center justify-between rounded-full border border-default-300 bg-white p-[10px] text-sm">
                <button
                  onClick={() => {
                    if (facilitySettingsCurrent.maximumQueuesAllowedPer > 0) {
                      setFacilitySettings({
                        ...facilitySettingsCurrent,
                        maximumQueuesAllowedPer: facilitySettingsCurrent.maximumQueuesAllowedPer - 1,
                      });
                    }
                  }}
                >
                  <img src="/image/ico-num-minus.svg" alt="-" />
                </button>
                <Input
                  type="text"
                  placeholder=""
                  value={String(facilitySettingsCurrent.maximumQueuesAllowedPer)}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setFacilitySettings({
                      ...facilitySettingsCurrent,
                      maximumQueuesAllowedPer: Number(e.target.value),
                    });
                  }}
                  className="!border-0 text-center focus:!outline-none"
                />
                <button
                  onClick={() => {
                    setFacilitySettings({
                      ...facilitySettingsCurrent,
                      maximumQueuesAllowedPer: facilitySettingsCurrent.maximumQueuesAllowedPer + 1,
                    });
                  }}
                >
                  <img src="/image/ico-num-plus.svg" alt="+" />
                </button>
              </div>
            </dd>
          </dl>
        </div>
        <h4 className="mt-[30px] pl-[10px] text-sm font-semibold">Desks details</h4>
        {!facilitySettingsCurrent?.defaultTableData ? null : (
          <div>
            <GridTable
              type={'text'}
              titleWidth={120}
              header={facilitySettingsCurrent.defaultTableData.header}
              data={facilitySettingsCurrent.defaultTableData.data}
              onDataChange={(data) => {
                setDefaultTableData({
                  ...defaultTableData,
                  data,
                } as TableData);
              }}
            />
          </div>
        )}
      </div>
      <p className="mt-[20px] flex justify-end">
        <Button className="btn-md btn-tertiary" text="Apply" onClick={() => onSetOpeningHoursTableData()} />
      </p>
      <div className={`${facilitySettingsCurrent?.openingHoursTableData ? '' : 'hidden'}`}>
        <div className={`mt-[30px] flex items-center justify-between`}>
          <h2 className="title-sm">Set Opening Hours</h2>
          <div className="flex items-center gap-[20px]">
            <Checkbox
              id="Automatic"
              label="Check-box"
              checked={!!facilitySettingsCurrent.automaticInput}
              onChange={() =>
                setFacilitySettings({
                  ...facilitySettingsCurrent,
                  automaticInput: !facilitySettingsCurrent.automaticInput,
                })
              }
              className="checkbox-toggle"
            />
            <dl className="flex items-center gap-[10px]">
              <dt>Time Unit</dt>
              <dd>
                <Dropdown
                  items={[{ id: '10', text: '10 Min' }]}
                  defaultId={'10'}
                  className="min-w-[200px]"
                  onChange={(items) => {
                    setFacilitySettings({ ...facilitySettingsCurrent, timeUnit: Number(items[0].id) });
                  }}
                />
              </dd>
            </dl>
          </div>
        </div>
        <div className={`table-wrap mt-[10px] overflow-hidden rounded-md`}>
          <div className={`relative h-[600px] overflow-auto pr-[400px]`}>
            <div
            // className={`h-[${tableHeight}px]`}
            >
              {facilitySettingsCurrent?.openingHoursTableData && nodeName ? (
                <>
                  <GridTable
                    className={``}
                    type={facilitySettingsCurrent.automaticInput ? 'checkbox' : 'text'}
                    title="Opening Time"
                    titleWidth={92}
                    headerHeight={tableHeaderHeight}
                    stickyTopRows={1}
                    header={facilitySettingsCurrent.openingHoursTableData.header}
                    data={facilitySettingsCurrent.openingHoursTableData.data}
                    onDataChange={(data) => {
                      setOpeningHoursTableData({
                        ...openingHoursTableData,
                        data,
                      } as TableData);
                    }}
                  />
                  <div style={{ marginTop: vChartMarginTop, top: vChartTop, right: 0, position: 'absolute' }}>
                    <div style={{ overflow: 'hidden', height: vChartParentHeight }}>
                      {chartData?.length > 0 ? (
                        <BarChart
                          chartData={chartData}
                          chartLayout={{
                            width: 390,
                            height: vChartHeight,
                            margin: {
                              l: 50,
                              r: 0,
                              t: 64,
                              b: 0,
                            },
                            barmode: 'overlay',
                            bargap: 0.4,
                            showlegend: false,
                            yaxis: {
                              dtick: 1,
                            },
                          }}
                          config={{
                            displayModeBar: false,
                          }}
                        />
                      ) : null}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
        {/* <p className="mt-[38px] flex justify-end">
          <Button className="btn-md btn-tertiary" text="Apply" onClick={() => onSetChartData()} />
        </p> */}
      </div>
      {procedureId && nodeName && facilitySettingsCurrent.lineChartData ? (
        <>
          <div className="mt-[40px] flex items-center justify-center">
            {/* {facilitySettingsCurrent.overviewChartVisible ? (
              <button
                className="flex h-[50px] w-full items-center justify-center gap-[10px] text-lg font-medium text-default-300 hover:text-default-700"
                onClick={() => {
                  setFacilitySettings({ ...facilitySettingsCurrent, overviewChartVisible: false });
                }}
              >
                <FontAwesomeIcon className="nav-icon" size="sm" icon={faAngleUp} />
                Hide Overview Charts
              </button>
            ) : (
              <button
                className="flex h-[50px] w-full items-center justify-center gap-[10px] text-lg font-medium text-default-300 hover:text-default-700"
                onClick={() => {
                  setFacilitySettings({ ...facilitySettingsCurrent, overviewChartVisible: true });
                }}
              >
                <FontAwesomeIcon className="nav-icon" size="sm" icon={faAngleDown} />
                Show Overview Charts
              </button>
            )} */}
          </div>
          {facilitySettingsCurrent.overviewChartVisible ? (
            <div>
              <hr />
              <div className="mt-[34px] flex flex-row justify-between">
                <h3 className="title-sm">Estimated Passenger Inflow by Time</h3>
                {/* <p className="mt-[10px] text-sm text-default-500">Load completed(100%)</p> */}
              </div>
              <div className="mt-[20px] flex items-center justify-between">
                <p className="text-[40px] text-xl font-semibold">
                  Total:{' '}
                  {numberWithCommas(facilityConnCapacities?.[procedureId]?.bar_chart_y_data[nodeName]?.total || 0)} Pax
                </p>
                {/* <p>
                  <Button
                    className="btn-md btn-default"
                    icon={<Image width={20} height={20} src="/image/ico-filter.svg" alt="filter" />}
                    text="Color Criteria"
                    onClick={() => {}}
                  />
                </p> */}
              </div>
              <div>
                <div className="mt-[15px] flex justify-end">
                  <ul className="chart-info">
                    <li>
                      <span className="dot" style={{ backgroundColor: '#6941C6' }}></span>Passenger
                    </li>
                    <li>
                      <span className="dot" style={{ backgroundColor: '#FF0000' }}></span>Capacity
                    </li>
                  </ul>
                </div>
                <BarChart
                  chartData={chartDataOverview}
                  chartLayout={{
                    width,
                    height: 390,
                    margin: {
                      l: 30,
                      r: 10,
                      t: 0,
                      b: 60,
                    },
                    barmode: 'overlay',
                    legend: {
                      x: 1,
                      y: 1,
                      xanchor: 'right',
                      yanchor: 'top',
                      orientation: 'h',
                    },
                    bargap: 0.4,
                    showlegend: false,
                    xaxis: {
                      dtick: 6,
                    },
                  }}
                  config={{
                    displayModeBar: false,
                  }}
                />
              </div>
              {!simulationAvairable ? (
                <p className="mt-[20px] flex justify-end">
                  <Button className="btn-md btn-tertiary" text="Next" onClick={() => onBtnNext()} />
                </p>
              ) : null}
            </div>
          ) : null}
        </>
      ) : null}
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
          onClick={() => onSimulation()}
          disabled={!simulationAvairable}
        >
          <span className="flex flex-grow items-center justify-center">Simulation</span>
          <FontAwesomeIcon className="nav-icon" size="sm" icon={faAngleRight} />
        </button>
      </div>
    </div>
  );
}
