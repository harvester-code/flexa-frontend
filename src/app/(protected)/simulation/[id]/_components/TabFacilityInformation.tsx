'use client';

import React, { useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { faAngleLeft, faAngleRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useShallow } from 'zustand/react/shallow';
import { getFacilityInfoLineChartData } from '@/services/simulations';
import { useScenarioStore } from '@/stores/useScenarioStore';
import Button from '@/components/Button';
import Checkbox from '@/components/Checkbox';
import { Dropdown } from '@/components/Conditions';
import Input from '@/components/Input';
import TabDefault from '@/components/TabDefault';
import { cn } from '@/lib/utils';
import SimulationGridTable from './SimulationGridTable';

const BarChart = dynamic(() => import('@/components/charts/BarChart'), { ssr: false });

const DEFAULT_TIME_UNIT = 10;

const TABLE_HEADER_HEIGHT = 52;
const TABLE_CELL_HEIGHT = 36;

interface TabFacilityInformationProps {
  simulationId: string;
  visible: boolean;
}

export default function TabFacilityInformation({ simulationId, visible }: TabFacilityInformationProps) {
  const {
    currentScenarioTab,
    setCurrentScenarioTab,
    procedures,
    selectedSecondTab,
    setSelectedSecondTab,
    selectedNodes,
    updateSelectedNode,
    settings,
    updateSetting,
    barChartData,
  } = useScenarioStore(
    useShallow((s) => ({
      currentScenarioTab: s.scenarioProfile.currentScenarioTab,
      setCurrentScenarioTab: s.scenarioProfile.actions.setCurrentScenarioTab,
      procedures: s.airportProcessing.procedures,
      selectedSecondTab: s.facilityCapacity.selectedSecondTab,
      setSelectedSecondTab: s.facilityCapacity.actions.setSelectedSecondTab,
      selectedNodes: s.facilityCapacity.selectedNodes,
      updateSelectedNode: s.facilityCapacity.actions.updateSelectedNode,
      settings: s.facilityCapacity.settings,
      updateSetting: s.facilityCapacity.actions.updateSetting,
      barChartData: s.facilityCapacity.barChartData,
    }))
  );

  const currentSetting = settings?.[`${selectedSecondTab}_${selectedNodes[selectedSecondTab]}`];

  // ====================================================================================================

  const tableHeight = currentSetting?.openingHoursTableData
    ? currentSetting.openingHoursTableData?.data?.length * TABLE_CELL_HEIGHT + TABLE_HEADER_HEIGHT + 2
    : 0;
  const vChartTop = currentSetting?.lineChartData ? 1 : 0;
  const vChartHeight = currentSetting?.lineChartData ? tableHeight + 544 : tableHeight + 8;
  const vChartMarginTop = currentSetting?.lineChartData ? -270 : 0;
  const vChartParentHeight = currentSetting?.lineChartData ? tableHeight + 280 : tableHeight;

  // ====================================================================================================
  // currentSetting이 변경되면, 해당 설정에 대한 바 차트 데이터를 불러오고, 라인 차트 데이터를 업데이트합니다.
  const loadLineChartData = useCallback(async () => {
    const facilitySchedules = currentSetting.openingHoursTableData?.data.map((item) =>
      item.values.map((val) => {
        const num = Number(val);
        return num > 0 ? num : 0.0000000001;
      })
    );

    const params = {
      time_unit: currentSetting.timeUnit || DEFAULT_TIME_UNIT,
      facility_schedules: facilitySchedules,
    };

    try {
      const { data } = await getFacilityInfoLineChartData(params);

      // NOTE: Zustand 상태 업데이트
      updateSetting(selectedSecondTab, selectedNodes[selectedSecondTab], {
        lineChartData: data,
      });
    } catch (error) {
      console.error('Error fetching line chart data:', error);
      return null;
    }
  }, [currentSetting, selectedSecondTab, selectedNodes, updateSetting]);

  useEffect(() => {
    if (!currentSetting.lineChartData) {
      loadLineChartData();
    }
  }, [currentSetting.lineChartData, loadLineChartData]);

  return !visible ? null : (
    <div>
      <h2 className="title-sm mt-[25px]">Facility Information</h2>

      {/* =============== SUB TABS =============== */}
      <TabDefault
        className="tab-secondary mt-[25px]"
        tabCount={procedures.length}
        currentTab={selectedSecondTab}
        tabs={procedures.map((proc, i) => ({ text: proc.nameText || '' }))}
        onTabChange={setSelectedSecondTab}
      />

      {/* =============== NODE TABS =============== */}
      <ul className="gate-list grid-cols-5">
        {procedures[selectedSecondTab]?.nodes?.map((node, i) => (
          <li key={i} className={`${i === selectedNodes[selectedSecondTab] ? 'active' : ''}`}>
            <button
              onClick={() => {
                if (i !== selectedNodes[selectedSecondTab]) updateSelectedNode(selectedSecondTab, i);
              }}
            >
              {node}
            </button>
          </li>
        ))}
      </ul>

      {/* =============== FACILITY SETTINGS =============== */}
      <div className="mt-[30px] flex items-center justify-between">
        <h2 className="title-sm">Facility Default Settings</h2>
      </div>

      <div className="process-item-content mt-[17px] rounded-lg border border-default-300 bg-gray-100 p-[20px]">
        <div className="flex justify-between gap-[20px]">
          {/* =============== DESK =============== */}
          <dl className="flex flex-grow flex-col gap-[5px]">
            <dt>
              <h4 className="pl-[10px] text-sm font-semibold">{procedures[selectedSecondTab].nameText} desks</h4>
            </dt>

            <dd>
              <div className="flex h-[50px] w-full items-center justify-between rounded-full border border-default-300 bg-white p-[10px] text-sm">
                <button
                  onClick={() => {
                    const newNumberOfDevices = Math.max(currentSetting.numberOfEachDevices - 1, 1);

                    updateSetting(selectedSecondTab, selectedNodes[selectedSecondTab], {
                      numberOfEachDevices: newNumberOfDevices,
                    });

                    // --- Update defaultTableData header if it exists
                    if (currentSetting.defaultTableData) {
                      const updatedHeader = Array(newNumberOfDevices)
                        .fill(0)
                        .map((_, index) => ({
                          name: `Desk ${String(index + 1).padStart(2, '0')}`,
                          style: { background: '#F9F9FB' },
                          minWidth: 80,
                        }));

                      const updatedData = currentSetting.defaultTableData.data?.map((item) => ({
                        ...item,
                        values: Array(newNumberOfDevices).fill(currentSetting.processingTime),
                      }));

                      updateSetting(selectedSecondTab, selectedNodes[selectedSecondTab], {
                        defaultTableData: {
                          ...currentSetting.defaultTableData,
                          header: updatedHeader,
                          data: updatedData,
                        },
                      });
                    }
                    // --- Update openingHoursTableData if it exists
                    if (currentSetting.openingHoursTableData) {
                      const updatedHeader = Array(newNumberOfDevices)
                        .fill(0)
                        .map((_, index) => ({
                          name: `Desk ${String(index + 1).padStart(2, '0')}`,
                          style: { background: '#F9F9FB' },
                          minWidth: 80,
                        }));

                      const updatedOpeningHoursData = currentSetting.openingHoursTableData.data?.map((item) => ({
                        ...item,
                        values: Array(newNumberOfDevices).fill(currentSetting.processingTime),
                      }));

                      updateSetting(selectedSecondTab, selectedNodes[selectedSecondTab], {
                        openingHoursTableData: {
                          ...currentSetting.openingHoursTableData,
                          header: updatedHeader,
                          data: updatedOpeningHoursData,
                        },
                      });
                    }
                  }}
                >
                  <Image src="/image/ico-num-minus.svg" alt="-" width={30} height={30} />
                </button>

                <Input
                  className="!border-0 text-center focus:!outline-none"
                  type="text"
                  placeholder=""
                  value={String(currentSetting.numberOfEachDevices)}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const inputValue = Number(e.target.value);

                    updateSetting(selectedSecondTab, selectedNodes[selectedSecondTab], {
                      numberOfEachDevices: inputValue,
                    });

                    // --- Update defaultTableData header if it exists
                    if (currentSetting.defaultTableData) {
                      const updatedHeader = Array(inputValue)
                        .fill(0)
                        .map((_, index) => ({
                          name: `Desk ${String(index + 1).padStart(2, '0')}`,
                          style: { background: '#F9F9FB' },
                          minWidth: 80,
                        }));

                      const updatedData = currentSetting.defaultTableData.data?.map((item) => ({
                        ...item,
                        values: Array(inputValue).fill(currentSetting.processingTime),
                      }));

                      updateSetting(selectedSecondTab, selectedNodes[selectedSecondTab], {
                        defaultTableData: {
                          ...currentSetting.defaultTableData,
                          header: updatedHeader,
                          data: updatedData,
                        },
                      });
                    }

                    // --- Update openingHoursTableData if it exists
                    if (currentSetting.openingHoursTableData) {
                      const updatedHeader = Array(inputValue)
                        .fill(0)
                        .map((_, index) => ({
                          name: `Desk ${String(index + 1).padStart(2, '0')}`,
                          style: { background: '#F9F9FB' },
                          minWidth: 80,
                        }));

                      const updatedOpeningHoursData = currentSetting.openingHoursTableData.data?.map((item) => ({
                        ...item,
                        values: Array(inputValue).fill(currentSetting.processingTime),
                      }));

                      updateSetting(selectedSecondTab, selectedNodes[selectedSecondTab], {
                        openingHoursTableData: {
                          ...currentSetting.openingHoursTableData,
                          header: updatedHeader,
                          data: updatedOpeningHoursData,
                        },
                      });
                    }
                  }}
                />

                <button
                  onClick={() => {
                    const newNumberOfDevices = currentSetting.numberOfEachDevices + 1;

                    updateSetting(selectedSecondTab, selectedNodes[selectedSecondTab], {
                      numberOfEachDevices: newNumberOfDevices,
                    });

                    // --- Update defaultTableData header if it exists
                    if (currentSetting.defaultTableData) {
                      const updatedHeader = Array(newNumberOfDevices)
                        .fill(0)
                        .map((_, index) => ({
                          name: `Desk ${String(index + 1).padStart(2, '0')}`,
                          style: { background: '#F9F9FB' },
                          minWidth: 80,
                        }));

                      const updatedData = currentSetting.defaultTableData.data?.map((item) => ({
                        ...item,
                        values: Array(newNumberOfDevices).fill(currentSetting.processingTime),
                      }));

                      updateSetting(selectedSecondTab, selectedNodes[selectedSecondTab], {
                        defaultTableData: {
                          ...currentSetting.defaultTableData,
                          header: updatedHeader,
                          data: updatedData,
                        },
                      });
                    }

                    // --- Update openingHoursTableData if it exists
                    if (currentSetting.openingHoursTableData) {
                      const updatedHeader = Array(newNumberOfDevices)
                        .fill(0)
                        .map((_, index) => ({
                          name: `Desk ${String(index + 1).padStart(2, '0')}`,
                          style: { background: '#F9F9FB' },
                          minWidth: 80,
                        }));

                      const updatedOpeningHoursData = currentSetting.openingHoursTableData.data?.map((item) => ({
                        ...item,
                        values: Array(newNumberOfDevices).fill(currentSetting.processingTime),
                      }));

                      updateSetting(selectedSecondTab, selectedNodes[selectedSecondTab], {
                        openingHoursTableData: {
                          ...currentSetting.openingHoursTableData,
                          header: updatedHeader,
                          data: updatedOpeningHoursData,
                        },
                      });
                    }
                  }}
                >
                  <Image src="/image/ico-num-plus.svg" alt="+" width={30} height={30} />
                </button>
              </div>
            </dd>
          </dl>

          {/* =============== PROCESSING TIME =============== */}
          <dl className="flex flex-grow flex-col gap-[5px]">
            <dt>
              <h4 className="pl-[10px] text-sm font-semibold">Processing time (sec)</h4>
            </dt>

            <dd>
              <div className="flex h-[50px] w-full items-center justify-between rounded-full border border-default-300 bg-white p-[10px] text-sm">
                <button
                  onClick={() => {
                    const newProcessingTime = currentSetting.processingTime - 1;

                    updateSetting(selectedSecondTab, selectedNodes[selectedSecondTab], {
                      processingTime: newProcessingTime,
                    });

                    // --------------------------------------------------------------
                    const updatedValues: string[] = Array(currentSetting.numberOfEachDevices).fill(newProcessingTime);

                    // --- Update defaultTableData values if it exists
                    if (currentSetting.defaultTableData) {
                      updateSetting(selectedSecondTab, selectedNodes[selectedSecondTab], {
                        defaultTableData: {
                          ...currentSetting.defaultTableData,
                          data: currentSetting.defaultTableData?.data?.map((item) => ({
                            ...item,
                            values: updatedValues,
                          })),
                        },
                      });
                    }

                    // --- Update openingHoursTableData values if it exists
                    if (currentSetting.openingHoursTableData) {
                      const updatedOpeningHoursData = currentSetting.openingHoursTableData.data?.map((item) => ({
                        ...item,
                        values: Array(currentSetting.numberOfEachDevices).fill(newProcessingTime),
                      }));

                      updateSetting(selectedSecondTab, selectedNodes[selectedSecondTab], {
                        openingHoursTableData: {
                          ...currentSetting.openingHoursTableData,
                          data: updatedOpeningHoursData,
                        },
                      });
                    }
                  }}
                >
                  <Image src="/image/ico-num-minus.svg" alt="-" width={30} height={30} />
                </button>

                <Input
                  className="!border-0 text-center focus:!outline-none"
                  type="text"
                  placeholder=""
                  value={String(currentSetting.processingTime)}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const inputValue = Number(e.target.value);

                    updateSetting(selectedSecondTab, selectedNodes[selectedSecondTab], {
                      processingTime: Number(e.target.value),
                    });

                    // --------------------------------------------------------------
                    const updatedValues: string[] = Array(currentSetting.numberOfEachDevices).fill(inputValue);

                    // --- Update defaultTableData values if it exists
                    if (currentSetting.defaultTableData) {
                      updateSetting(selectedSecondTab, selectedNodes[selectedSecondTab], {
                        defaultTableData: {
                          ...currentSetting.defaultTableData,
                          data: currentSetting.defaultTableData?.data?.map((item) => ({
                            ...item,
                            values: updatedValues,
                          })),
                        },
                      });
                    }

                    // --- Update openingHoursTableData values if it exists
                    if (currentSetting.openingHoursTableData) {
                      const updatedOpeningHoursData = currentSetting.openingHoursTableData.data?.map((item) => ({
                        ...item,
                        values: Array(currentSetting.numberOfEachDevices).fill(inputValue),
                      }));

                      updateSetting(selectedSecondTab, selectedNodes[selectedSecondTab], {
                        openingHoursTableData: {
                          ...currentSetting.openingHoursTableData,
                          data: updatedOpeningHoursData,
                        },
                      });
                    }
                  }}
                />

                <button
                  onClick={() => {
                    const newProcessingTime = currentSetting.processingTime + 1;

                    updateSetting(selectedSecondTab, selectedNodes[selectedSecondTab], {
                      processingTime: newProcessingTime,
                    });

                    // --------------------------------------------------------------
                    const updatedValues: string[] = Array(currentSetting.numberOfEachDevices).fill(newProcessingTime);

                    // --- Update defaultTableData values if it exists
                    if (currentSetting.defaultTableData) {
                      updateSetting(selectedSecondTab, selectedNodes[selectedSecondTab], {
                        defaultTableData: {
                          ...currentSetting.defaultTableData,
                          data: currentSetting.defaultTableData?.data?.map((item) => ({
                            ...item,
                            values: updatedValues,
                          })),
                        },
                      });
                    }

                    // --- Update openingHoursTableData values if it exists
                    if (currentSetting.openingHoursTableData) {
                      const updatedOpeningHoursData = currentSetting.openingHoursTableData.data?.map((item) => ({
                        ...item,
                        values: Array(currentSetting.numberOfEachDevices).fill(newProcessingTime),
                      }));

                      updateSetting(selectedSecondTab, selectedNodes[selectedSecondTab], {
                        openingHoursTableData: {
                          ...currentSetting.openingHoursTableData,
                          data: updatedOpeningHoursData,
                        },
                      });
                    }
                  }}
                >
                  <Image src="/image/ico-num-plus.svg" alt="+" width={30} height={30} />
                </button>
              </div>
            </dd>
          </dl>

          {/* =============== MAXIMUM QUEUES =============== */}
          <dl className="flex flex-grow flex-col gap-[5px]">
            <dt>
              <h4 className="pl-[10px] text-sm font-semibold">Maximum queues allowed per desks</h4>
            </dt>

            <dd>
              <div className="flex h-[50px] w-full items-center justify-between rounded-full border border-default-300 bg-white p-[10px] text-sm">
                <button
                  onClick={() => {
                    updateSetting(selectedSecondTab, selectedNodes[selectedSecondTab], {
                      maximumQueuesAllowedPer: currentSetting.maximumQueuesAllowedPer - 1,
                    });
                  }}
                >
                  <Image src="/image/ico-num-minus.svg" alt="-" width={30} height={30} />
                </button>

                <Input
                  type="text"
                  placeholder=""
                  value={String(currentSetting.maximumQueuesAllowedPer)}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    updateSetting(selectedSecondTab, selectedNodes[selectedSecondTab], {
                      maximumQueuesAllowedPer: Number(e.target.value),
                    });
                  }}
                  className="!border-0 text-center focus:!outline-none"
                />

                <button
                  onClick={() => {
                    updateSetting(selectedSecondTab, selectedNodes[selectedSecondTab], {
                      maximumQueuesAllowedPer: currentSetting.maximumQueuesAllowedPer + 1,
                    });
                  }}
                >
                  <Image src="/image/ico-num-plus.svg" alt="+" width={30} height={30} />
                </button>
              </div>
            </dd>
          </dl>
        </div>

        {/* =============== DESKS DETAILS TABLE =============== */}
        <h4 className="mt-[30px] pl-[10px] text-sm font-semibold">Desks details</h4>
        {currentSetting.defaultTableData ? (
          <div>
            <SimulationGridTable
              type={'text'}
              titleWidth={120}
              header={currentSetting.defaultTableData?.header || []}
              data={currentSetting.defaultTableData?.data || []}
              onDataChange={(data) => {
                const newTableData = { ...currentSetting.defaultTableData, data };

                updateSetting(selectedSecondTab, selectedNodes[selectedSecondTab], {
                  defaultTableData: { ...newTableData, header: newTableData.header || [] },
                });
              }}
            />
          </div>
        ) : null}
      </div>

      {/* =============== SET OPENING HOURS =============== */}
      <div className={`${currentSetting?.openingHoursTableData ? '' : 'hidden'}`}>
        <div className={`mt-[30px] flex items-center justify-between`}>
          <h2 className="title-sm">Set Opening Hours</h2>

          <div className="flex items-center gap-[20px]">
            {/* TODO: 라인차트를 숫자를 입력했을 때 마다 호출하도록 변경하기 */}
            <Button className="btn-md btn-tertiary" text="Update Line Chart" onClick={loadLineChartData} />

            <Checkbox
              id="Automatic"
              label="Check-box"
              checked={!!currentSetting.automaticInput}
              onChange={
                () =>
                  updateSetting(selectedSecondTab, selectedNodes[selectedSecondTab], {
                    automaticInput: !currentSetting.automaticInput,
                  })
              }
              className="checkbox-toggle"
            />

            <dl className="flex items-center gap-[10px]">
              <dt>Time Unit</dt>
              <dd>
                <Dropdown
                  items={[
                    { id: '10', text: '10 Min' },
                    { id: '30', text: '30 Min' },
                    { id: '60', text: '60 Min' },
                  ]}
                  defaultId={'10'}
                  className="min-w-[200px]"
                  onChange={(items) => {}}
                />
              </dd>
            </dl>
          </div>
        </div>

        <div className={`table-wrap mt-[10px] overflow-hidden rounded-md`}>
          <div className={cn('relative h-[600px] pr-[400px]', barChartData ? 'overflow-auto' : 'overflow-hidden')}>
            {/* =============== TABLE & HORIZONTAL BAR CHART =============== */}
            {barChartData ? (
              <>
                <SimulationGridTable
                  type={currentSetting.automaticInput ? 'checkbox' : 'text'}
                  title="Opening Time"
                  titleWidth={92}
                  headerHeight={TABLE_HEADER_HEIGHT}
                  stickyTopRows={1}
                  header={currentSetting.openingHoursTableData?.header || []}
                  data={currentSetting.openingHoursTableData?.data || []}
                  onDataChange={(data) => {
                    // setOpeningHoursTableData({ ...openingHoursTableData, data } as TableData);
                  }}
                />

                <div style={{ marginTop: vChartMarginTop, top: vChartTop, right: 0, position: 'absolute' }}>
                  <div style={{ overflow: 'hidden', height: vChartParentHeight }}>
                    <BarChart
                      // HACK: 이 부분은 나중에 개선 필요
                      chartData={[
                        {
                          type: 'bar',
                          orientation: 'h',
                          marker: { color: '#6941C6', opacity: 1 },
                          x: [
                            ...barChartData[procedures[selectedSecondTab].nameText!]?.bar_chart_y_data[
                              procedures[selectedSecondTab].nodes[selectedNodes[selectedSecondTab]]
                            ]?.y,
                          ].reverse(),
                          y: currentSetting.openingHoursTableData?.data?.map((val) => `${val.name}`).reverse(),
                        },
                        {
                          mode: 'lines',
                          marker: { color: '#FF0000', opacity: 1 },
                          x: [...(currentSetting.lineChartData?.y || [])].reverse(),
                          y: currentSetting.openingHoursTableData?.data?.map((val) => `${val.name}`).reverse(),
                        },
                      ]}
                      chartLayout={{
                        width: 390,
                        height: vChartHeight,
                        margin: { l: 50, r: 0, t: 64, b: 0 },
                        barmode: 'overlay',
                        bargap: 0.4,
                        showlegend: false,
                        yaxis: { dtick: 1 },
                      }}
                      config={{ displayModeBar: false }}
                    />
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* ================= BAR CHART =============== */}
      <div>
        <hr />
        <div className="mt-[34px] flex flex-row justify-between">
          <h3 className="title-sm">Estimated Passenger Inflow by Time</h3>
        </div>

        {barChartData ? (
          <div className="min-h-[300px] w-full">
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
              chartData={
                // HACK: 이 부분은 나중에 개선 필요
                currentSetting.lineChartData
                  ? [
                      {
                        type: 'bar',
                        marker: { color: '#6941C6', opacity: 1 },
                        x: currentSetting.openingHoursTableData?.data?.map((val) => `${val.name}`),
                        y:
                          barChartData[procedures[selectedSecondTab].nameText!]?.bar_chart_y_data[
                            procedures[selectedSecondTab].nodes[selectedNodes[selectedSecondTab]]
                          ]?.y || [],
                      },
                      {
                        type: 'scatter',
                        mode: 'lines',
                        marker: { color: '#FF0000', opacity: 1 },
                        x: currentSetting.openingHoursTableData?.data?.map((val) => `${val.name}`),
                        y: currentSetting.lineChartData?.y || [],
                      },
                    ]
                  : []
              }
              chartLayout={{
                // height: 390,
                margin: { l: 30, r: 10, t: 0, b: 60 },
                barmode: 'overlay',
                legend: { x: 1, y: 1, xanchor: 'right', yanchor: 'top', orientation: 'h' },
                bargap: 0.4,
                showlegend: false,
                xaxis: { dtick: 6 },
              }}
              config={{ displayModeBar: false }}
            />
          </div>
        ) : null}
      </div>

      {/* =============== NAVIGATION BUTTONS =============== */}
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
          // disabled={!simulationAvairable}
          onClick={() => setCurrentScenarioTab(currentScenarioTab + 1)}
        >
          <span className="flex flex-grow items-center justify-center">Simulation</span>
          <FontAwesomeIcon className="nav-icon" size="sm" icon={faAngleRight} />
        </button>
      </div>
    </div>
  );
}
