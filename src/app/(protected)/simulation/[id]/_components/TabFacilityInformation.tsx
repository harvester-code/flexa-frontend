'use client';

import React, { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { faAngleLeft, faAngleRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import dayjs from 'dayjs';
import { useDebounce } from 'react-use';
import { useShallow } from 'zustand/react/shallow';
import { getFacilityInfoLineChartData } from '@/services/simulations';
import { useScenarioStore } from '@/stores/useScenarioStore';
import Checkbox from '@/components/Checkbox';
import { Dropdown } from '@/components/Conditions';
import TabDefault from '@/components/TabDefault';
import TheInput from '@/components/TheInput';
import TheRadioGroup from '@/components/TheRadioGroup';
import { cn } from '@/lib/utils';
import SimulationGridTable from './SimulationGridTable';

const PlotlyChart = dynamic(() => import('@/components/ThePlotlyChart'), { ssr: false });

const DEFAULT_TIME_UNIT = 10;

const TABLE_HEADER_HEIGHT = 52;
const TABLE_ROW_HEIGHT = 36;

const INFINITE_FACILITY_OPTIONS = [
  {
    value: 'limited_facility' as const,
    label: 'Limited Facility',
    description: 'Set it to a facility with limited physical capacity, such as check-in · security',
  },
  {
    value: 'unlimited_facility' as const,
    label: 'Unlimited Facility',
    description: 'Set it to a facility with unlimited physical capacity, such as mobile check-in · hallway',
  },
];

interface TabFacilityInformationProps {
  simulationId: string;
  visible: boolean;
}

export default function TabFacilityInformation({ simulationId, visible }: TabFacilityInformationProps) {
  const {
    targetDate,
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
      targetDate: s.flightSchedule.targetDate,
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
  const calculatedTableHeight = currentSetting?.openingHoursTableData
    ? currentSetting.openingHoursTableData?.data?.length * TABLE_ROW_HEIGHT + TABLE_HEADER_HEIGHT + 2
    : 0;

  // ====================================================================================================
  const tableRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!visible) return;

    const handleTableScroll = () => {
      if (tableRef.current && chartRef.current) {
        chartRef.current.scrollTop = tableRef.current.scrollTop;
      }
    };

    const handleChartScroll = () => {
      if (chartRef.current && tableRef.current) {
        tableRef.current.scrollTop = chartRef.current.scrollTop;
      }
    };

    const tableElement = tableRef.current;
    const chartElement = chartRef.current;

    tableElement?.addEventListener('scroll', handleTableScroll);
    chartElement?.addEventListener('scroll', handleChartScroll);

    return () => {
      tableElement?.removeEventListener('scroll', handleTableScroll);
      chartElement?.removeEventListener('scroll', handleChartScroll);
    };
  }, [visible]);

  // ====================================================================================================
  const loadLineChartData = async () => {
    if (!currentSetting?.openingHoursTableData) {
      return null;
    }

    if (currentSetting?.facilityType === 'unlimited_facility') {
      return null;
    }

    const facilitySchedules = currentSetting?.openingHoursTableData?.data.map((item) =>
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
  };

  useDebounce(() => loadLineChartData(), 500, [currentSetting?.openingHoursTableData]);

  // ====================================================================================================
  const generateChartData = () => {
    const chartData = {
      type: 'bar' as const,
      marker: { color: '#6941C6', opacity: 1 },
      x: currentSetting?.openingHoursTableData?.data?.map((d) => d.name),
      // HACK: 이 부분은 나중에 개선 필요
      y:
        barChartData?.[procedures[selectedSecondTab].nameText!]?.bar_chart_y_data[
          procedures[selectedSecondTab].nodes[selectedNodes[selectedSecondTab]]
        ]?.y || [],
    };

    // Limited facility이고 lineChartData가 있으면 capacity line도 추가
    if (currentSetting?.facilityType === 'limited_facility' && currentSetting?.lineChartData) {
      return [
        chartData,
        {
          type: 'scatter' as const,
          mode: 'lines' as const,
          marker: { color: '#FF0000', opacity: 1 },
          x: currentSetting.openingHoursTableData?.data?.map((d) => `${d.name}`),
          y: currentSetting.lineChartData?.y || [],
        },
      ];
    }

    return [chartData];
  };

  // ====================================================================================================
  const generateHorizontalChartData = () => {
    const chartData = {
      type: 'bar' as const,
      orientation: 'h' as const,
      marker: { color: '#6941C6' },
      // HACK: 이 부분은 나중에 개선 필요
      x: barChartData?.[procedures[selectedSecondTab].nameText!]?.bar_chart_y_data[
        procedures[selectedSecondTab].nodes[selectedNodes[selectedSecondTab]]
      ]?.y,
      y: currentSetting?.openingHoursTableData?.data?.map((val) => val.name),
    };

    // Limited facility이고 lineChartData가 있으면 capacity line도 추가
    if (currentSetting?.facilityType === 'limited_facility' && currentSetting?.lineChartData) {
      return [
        chartData,
        {
          type: 'scatter' as const,
          mode: 'lines' as const,
          marker: { color: '#FF0000' },
          x: currentSetting.lineChartData?.y,
          y: currentSetting.openingHoursTableData?.data?.map((val) => val.name),
        },
      ];
    }

    // 기본적으로는 horizontal bar chart만 반환
    return [chartData];
  };

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

      <TheRadioGroup
        items={INFINITE_FACILITY_OPTIONS}
        defaultValue={INFINITE_FACILITY_OPTIONS[0].value}
        selectedValue={currentSetting.facilityType}
        onValueChange={(value) => {
          const numberOfEachDevices = value === 'limited_facility' ? 5 : 1;
          const maximumQueuesAllowedPer = value === 'limited_facility' ? 200 : 1;

          updateSetting(selectedSecondTab, selectedNodes[selectedSecondTab], {
            facilityType: value as (typeof INFINITE_FACILITY_OPTIONS)[number]['value'],
            numberOfEachDevices,
            maximumQueuesAllowedPer,
          });

          // --- Update defaultTableData header if it exists
          if (currentSetting.defaultTableData) {
            const updatedHeader = Array(numberOfEachDevices)
              .fill(0)
              .map((_, index) => ({
                name: `Desk ${String(index + 1).padStart(2, '0')}`,
                style: { background: '#F9F9FB' },
                minWidth: 80,
              }));

            const updatedData = currentSetting.defaultTableData.data?.map((item) => ({
              ...item,
              values: Array(numberOfEachDevices).fill(currentSetting.processingTime),
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
            const updatedHeader = Array(numberOfEachDevices)
              .fill(0)
              .map((_, index) => ({
                name: `Desk ${String(index + 1).padStart(2, '0')}`,
                style: { background: '#F9F9FB' },
                minWidth: 80,
              }));

            const updatedOpeningHoursData = currentSetting.openingHoursTableData.data?.map((item) => ({
              ...item,
              values: Array(numberOfEachDevices).fill(currentSetting.processingTime),
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

      <div className="process-item-content mt-[17px] rounded-lg border border-default-300 bg-gray-100 p-[20px]">
        <div className="flex justify-between gap-[20px]">
          {/* =============== DESK =============== */}
          {currentSetting?.facilityType === 'limited_facility' && (
            <dl className="flex flex-grow flex-col gap-[5px]">
              <dt>
                <h4 className="pl-[10px] text-sm font-semibold">
                  Number of each devices in {procedures[selectedSecondTab].nameText}
                </h4>
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

                  <TheInput
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
          )}

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

                <TheInput
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
          {currentSetting?.facilityType === 'limited_facility' && (
            <dl className="flex flex-grow flex-col gap-[5px]">
              <dt>
                <h4 className="pl-[10px] text-sm font-semibold">
                  Maximum queues allowed per {procedures[selectedSecondTab].nameText}
                </h4>
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

                  <TheInput
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
          )}
        </div>

        {/* =============== DESKS DETAILS TABLE =============== */}
        {currentSetting.facilityType === 'limited_facility' && (
          <>
            <h4 className="mt-[30px] pl-[10px] text-sm font-semibold">Desks details</h4>

            {currentSetting.defaultTableData && (
              <div className="overflow-auto">
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
            )}
          </>
        )}
      </div>

      {/* =============== SET OPENING HOURS =============== */}
      <div className={`${currentSetting?.openingHoursTableData ? '' : 'hidden'}`}>
        <div className={`mt-[30px] flex items-center justify-between`}>
          <h2 className="title-sm">Set Opening Hours</h2>

          {/* <div className="flex items-center gap-[20px]">
            <Checkbox
              id="Automatic"
              label="Check-box"
              checked={!!currentSetting.automaticInput}
              onChange={() =>
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
          </div> */}
        </div>

        {/* =============== TABLE & HORIZONTAL BAR CHART =============== */}
        {barChartData ? (
          <>
            <div className="flex h-[40rem]">
              <div ref={tableRef} className="opening-hours-table w-full max-w-5xl overflow-auto scrollbar-hide">
                <SimulationGridTable
                  type={currentSetting.automaticInput ? 'checkbox' : 'text'}
                  title="Opening Time"
                  titleWidth={120}
                  headerHeight={TABLE_HEADER_HEIGHT}
                  stickyTopRows={1}
                  header={currentSetting.openingHoursTableData?.header || []}
                  data={currentSetting.openingHoursTableData?.data || []}
                  onDataChange={(newData) => {
                    const newTableData = {
                      ...currentSetting.openingHoursTableData,
                      data: newData,
                    };
                    updateSetting(selectedSecondTab, selectedNodes[selectedSecondTab], {
                      openingHoursTableData: { ...newTableData, header: newTableData.header || [] },
                    });
                  }}
                />
              </div>

              <div ref={chartRef} className="overflow-auto">
                <PlotlyChart
                  chartData={generateHorizontalChartData()}
                  chartLayout={{
                    width: 256,
                    height: calculatedTableHeight,
                    margin: { l: 64, r: 0, t: TABLE_HEADER_HEIGHT, b: 0 },
                    barmode: 'overlay',
                    showlegend: false,
                    xaxis: {
                      fixedrange: true,
                    },
                    yaxis: {
                      fixedrange: true,
                      autorange: false,
                      range: [143.5, -0.5],
                      type: 'category',
                    },
                  }}
                />
              </div>
            </div>
          </>
        ) : null}
      </div>

      {/* ================= PASSENGER INFLOW CHART =============== */}
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

            <PlotlyChart
              chartData={generateChartData()}
              chartLayout={{
                margin: { l: 30, r: 10, t: 0, b: 60 },
                barmode: 'overlay',
                legend: { x: 1, y: 1, xanchor: 'right', yanchor: 'top', orientation: 'h' },
                bargap: 0.4,
                showlegend: false,
                xaxis: { dtick: 6 },
              }}
              chartConfig={{ displayModeBar: false }}
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
