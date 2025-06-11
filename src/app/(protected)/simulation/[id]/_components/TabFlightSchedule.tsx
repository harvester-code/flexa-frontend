'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { faAngleLeft, faAngleRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import dayjs from 'dayjs';
import { OrbitProgress } from 'react-loading-indicators';
import { useShallow } from 'zustand/react/shallow';
import { FilterOptions, FilterOptionsResponse, OperatorItem, Option, ValueItem } from '@/types/scenarios';
import { getFlightSchedules } from '@/services/simulations';
import { useScenarioStore } from '@/stores/useScenarioStore';
import Button from '@/components/Button';
import Checkbox from '@/components/Checkbox';
import Conditions from '@/components/Conditions';
import selectBoxStyles from '@/components/SelectBox.module.css';
import TabDefault from '@/components/TabDefault';
import { Calendar } from '@/components/ui/Calendar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/DropdownMenu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { cn } from '@/lib/utils';
import _jsonAirport from '../_json/airport_constants.json';

const BarChart = dynamic(() => import('@/components/charts/BarChart'), { ssr: false });

const SUB_TABS: { text: string; number: number }[] = [
  { text: 'Connect Cirium®', number: 0 },
  { text: 'Connect OAG®', number: 1 },
  { text: 'Direct Upload', number: 2 },
];

const JSON_AIRPORTS = _jsonAirport.map((item) => ({
  iata: item.iata,
  name: item.name,
  searchText: `${item.iata}/${item.name}`.toUpperCase(),
}));

const parseFilterOptions = (conditionData: FilterOptionsResponse[]): FilterOptions => {
  const logicItems: Option[] = [{ id: 'AND', text: 'AND' }];
  const criteriaItems: Option[] = [];
  const operatorItems: { [key: string]: OperatorItem[] } = {};
  const valueItems: { [key: string]: ValueItem[] } = {};

  for (const criteriaCur of conditionData) {
    const idCur = criteriaCur.name;

    criteriaItems.push({ id: idCur, text: criteriaCur.name });
    criteriaCur.operator.map((val) => {
      if (val === '=') {
        operatorItems[idCur] = [{ id: val, text: val, multiSelect: false }];
      } else if (val === 'is in') {
        operatorItems[idCur] = [{ id: val, text: val, multiSelect: true }];
      }
    });

    valueItems[idCur] = [];

    for (const valueCur of criteriaCur.value) {
      if (typeof valueCur == 'object' && valueCur['iata']) {
        valueItems[idCur].push({
          id: valueCur['iata'],
          text: valueCur['iata'],
          fullText: `${valueCur['iata']} : ${valueCur['name']}`,
        });
      } else {
        valueItems[idCur].push({ id: valueCur, text: valueCur });
      }
    }
  }

  return { logicItems, criteriaItems, operatorItems, valueItems };
};

interface TabFlightScheduleProps {
  simulationId: string;
  visible: boolean;
}

export default function TabFlightSchedule({ simulationId, visible }: TabFlightScheduleProps) {
  const {
    colorCriteria,
    currentScenarioTab,
    filterOptions,
    flightScheduleChartData,
    isFilterEnabled,
    selectedDatasource,
    selectedFilters,
    targetAirport,
    targetDate,
    setColorCriteria,
    setCurrentScenarioTab,
    setFlightScheduleFilters,
    setFlightScheduleChartData,
    setIsFilterEnabled,
    setFlightScheduleSelectedFilters,
    setPassengerScheduleFilters,
    setPassengerScheduleSelectedFilters,
    setTargetAirport,
    setTargetDate,
    resetPassengerSchedule,
    resetAirportProcessing,
    resetFacilityConnection,
    resetFacilityCapacity,
  } = useScenarioStore(
    useShallow((s) => ({
      colorCriteria: s.flightSchedule.selectedCriteria,
      currentScenarioTab: s.scenarioProfile.currentScenarioTab,
      filterOptions: s.flightSchedule.filterOptions,
      flightScheduleChartData: s.flightSchedule.chartData,
      isFilterEnabled: s.flightSchedule.isFilterEnabled,
      selectedDatasource: s.flightSchedule.datasource,
      selectedFilters: s.flightSchedule.selectedFilters,
      targetAirport: s.flightSchedule.targetAirport,
      targetDate: s.flightSchedule.targetDate,
      setColorCriteria: s.flightSchedule.actions.setSelectedCriteria,
      setCurrentScenarioTab: s.scenarioProfile.actions.setCurrentScenarioTab,
      setFlightScheduleFilters: s.flightSchedule.actions.setFilters,
      setFlightScheduleChartData: s.flightSchedule.actions.setChartData,
      setPassengerScheduleFilters: s.passengerSchedule.actions.setFilters,
      setPassengerScheduleSelectedFilters: s.passengerSchedule.actions.setNormalDistributionParams,
      setIsFilterEnabled: s.flightSchedule.actions.setIsFilterEnabled,
      setFlightScheduleSelectedFilters: s.flightSchedule.actions.setSelectedFilters,
      setTargetAirport: s.flightSchedule.actions.setTargetAirport,
      setTargetDate: s.flightSchedule.actions.setTargetDate,
      resetPassengerSchedule: s.passengerSchedule.actions.resetState,
      resetAirportProcessing: s.airportProcessing.actions.resetState,
      resetFacilityConnection: s.facilityConnection.actions.resetState,
      resetFacilityCapacity: s.facilityCapacity.actions.resetState,
    }))
  );

  const [loadError, setLoadError] = useState(false);
  const [loadingFlightSchedule, setLoadingFlightSchedule] = useState(false);
  const [isSomethingChanged, setIsSomethingChanged] = useState(false);

  // ‼️ 시리움에서 데이터를 불러온다.
  const loadFlightSchedule = async () => {
    if (!simulationId) return;

    // TODO: 아래와 같은 경우 사용자에게 메세지 주기
    if (!targetAirport) return;

    setFlightScheduleChartData(null);

    if (isSomethingChanged) {
      setIsFilterEnabled(false);
    }

    // FIXME: 해당 탭에서 처음 로드할 때만 탭 인덱스를 설정하도록 변경
    // setAvailableTabIndex(tabIndex);

    try {
      setLoadingFlightSchedule(true);

      const params = {
        airport: targetAirport.iata,
        date: dayjs(targetDate).format('YYYY-MM-DD'),
        condition: isSomethingChanged ? [] : isFilterEnabled ? selectedFilters : [],
      };

      const { data } = await getFlightSchedules(simulationId, params);

      // ========================================================
      // 처음 항공기 스케줄 로드할 때 or 사용자 입력값이 변했을 때
      if (!filterOptions || isSomethingChanged) {
        // 항공기 스케줄 데이터를 위한 필터 옵션 처리
        setFlightScheduleFilters(parseFilterOptions(data.add_conditions));
        setFlightScheduleSelectedFilters([]);
      }

      // 여객 스케줄 데이터를 위한 필터 옵션 처리
      setPassengerScheduleFilters(parseFilterOptions(data.add_priorities));
      setPassengerScheduleSelectedFilters([{ conditions: [], mean: 120, stddev: 30 }]);

      // ========================================================
      if (data?.chart_x_data && data?.chart_y_data) {
        for (const criteriaCur in data?.chart_y_data) {
          const criteriaDataCur = data?.chart_y_data[criteriaCur].sort((a, b) => a.order - b.order);
          const acc_y = Array(criteriaDataCur[0].y.length).fill(0);

          for (const itemCur of criteriaDataCur) {
            itemCur.acc_y = Array(itemCur.y.length).fill(0);

            for (let i = 0; i < itemCur.y.length; i++) {
              acc_y[i] += itemCur.y[i];
              itemCur.acc_y[i] = Number(acc_y[i]);
            }
          }
        }

        const newChartData = { total: data?.total, x: data?.chart_x_data, data: data?.chart_y_data };
        setFlightScheduleChartData(newChartData);

        const newColorCriterias = Object.keys(newChartData?.data);
        setColorCriteria(newColorCriterias[0]);
      }
    } catch (error) {
      console.error(error);
      setLoadError(true);
    } finally {
      setIsSomethingChanged(false);
      setLoadingFlightSchedule(false);
    }
  };

  // ===============================================================
  const [isTypingAirport, setIsTypingAirport] = useState(false);
  const [userInputAirport, setUserInputAirport] = useState('');
  const [filteredAirports, setFilteredAirports] = useState<{ iata: string; name: string; searchText: string }[]>([]);

  useEffect(() => {
    if (userInputAirport?.length > 2) {
      setFilteredAirports(
        JSON_AIRPORTS.filter((item) => {
          return item?.searchText?.indexOf(userInputAirport.toUpperCase()) >= 0;
        })
      );
    }
  }, [userInputAirport]);

  return !visible ? null : (
    <div>
      <h2 className="title-sm mt-[25px]">Flight Schedule</h2>

      {/* TODO: 아직 사용 불가한 데이터 소스에 대해서 not yet UI 추가하기 */}
      <TabDefault
        className={`tab-secondary mt-[25px]`}
        tabs={SUB_TABS.map((tab) => ({ text: tab.text, number: tab.number }))}
        tabCount={SUB_TABS.length}
        currentTab={selectedDatasource}
      />

      <div className="mt-[40px] flex items-center justify-between">
        <p className="text-xl font-semibold text-default-800">Load Flight Schedule Data</p>

        <div className="flex items-center gap-2.5">
          {/* =============== 공항 검색 버튼 =============== */}
          {isTypingAirport ? (
            <div className="relative">
              <div className="relative">
                <input
                  id="input-airport"
                  type="text"
                  placeholder=""
                  value={userInputAirport}
                  className="btn-md btn-default !w-[314px] !pl-[40px]"
                  onChange={(e) => setUserInputAirport(e.target.value)}
                  onBlur={() => {
                    if (userInputAirport.length < 3) {
                      setIsTypingAirport(false);
                      setFilteredAirports([]);
                      setUserInputAirport('');
                    }
                  }}
                />
                <div className="absolute bottom-0 left-[14px] top-0 flex flex-col justify-center">
                  <Image width={20} height={20} src="/image/ico-search-s.svg" alt="" />
                </div>
              </div>

              {filteredAirports.length > 0 ? (
                <div
                  className={cn(
                    selectBoxStyles.selectBox,
                    filteredAirports.length > 0 && selectBoxStyles['active'],
                    `top-[-40px] !h-0 !rounded-none !border-none !py-0`
                  )}
                >
                  <div className={cn(selectBoxStyles.selectItem, `max-h-[400px]`)}>
                    <ul className={cn(selectBoxStyles.selectOptionCont)}>
                      {filteredAirports?.map((airport, i) => (
                        <li
                          className={cn(selectBoxStyles.selectOptionItem)}
                          key={i}
                          onClick={() => {
                            setIsSomethingChanged(targetAirport.iata !== airport.iata);
                            setTargetAirport(airport);

                            // 값 초기화
                            setIsTypingAirport(false);
                            setFilteredAirports([]);
                            setUserInputAirport('');
                          }}
                        >
                          <button className={cn(selectBoxStyles.selectOptionBtn, `text-left`)}>
                            <span>{airport.iata}</span>
                            <span className="ml-2.5 text-default-500">{airport.name}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <Button
              className="btn-md btn-default"
              icon={<Image width={20} height={20} src="/image/ico-search-s.svg" alt="" />}
              text={targetAirport?.iata || ''}
              textSub={targetAirport?.name}
              onClick={() => {
                setIsTypingAirport(true);
                setTimeout(() => document.getElementById('input-airport')?.focus(), 50);
              }}
            />
          )}

          {/* =============== 날짜 검색 버튼 =============== */}
          <Popover>
            <PopoverTrigger asChild>
              <div>
                <Button
                  className="btn-md btn-default !min-w-36"
                  icon={<Image width={16} height={16} src="/image/ico-calendar.svg" alt="" />}
                  text={dayjs(targetDate).format('MMM DD, YYYY')}
                  onClick={() => {}}
                />
              </div>
            </PopoverTrigger>

            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dayjs(targetDate).toDate()}
                defaultMonth={dayjs(targetDate).toDate()}
                onSelect={(date) => {
                  if (date) {
                    setIsSomethingChanged(targetDate !== dayjs(date).format('YYYY-MM-DD'));
                    setTargetDate(dayjs(date).format('YYYY-MM-DD'));
                  }
                }}
              />
            </PopoverContent>
          </Popover>

          {/* =============== 데이터 호출 버튼 =============== */}
          <Button
            className="btn-md btn-primary"
            text="Load"
            iconRight={<Image width={20} height={20} src="/image/ico-search-w.svg" alt="" />}
            onClick={() => {
              if (!flightScheduleChartData) {
                return loadFlightSchedule();
              }

              if (confirm('If you load the data again, you will lose the current scenario settings. Is that okay?')) {
                resetPassengerSchedule(); // 여객 스케줄 데이터 초기화
                resetFacilityConnection(); // 시설 연결 데이터 초기화
                resetFacilityCapacity(); // 시설 용량 데이터 초기화
                // resetAirportProcessing(); // 공항 프로세스 데이터 초기화

                return loadFlightSchedule();
              }
            }}
          />
        </div>
      </div>

      {/* ========== 데이터 필터링 섹션 ========== */}
      <p className="mt-5 text-xl font-semibold">Flight Schedule Data Filtering</p>

      <div className="mt-2.5 flex items-center gap-2.5 rounded-md border border-gray-200 bg-gray-50 p-[15px]">
        {!filterOptions ? (
          <p>⚠️ Load the flight schedule data first to enable filtering options.</p>
        ) : (
          <>
            <Checkbox
              id="add-conditions"
              className="checkbox-toggle"
              label=""
              checked={isFilterEnabled}
              onChange={() => setIsFilterEnabled(!isFilterEnabled)}
              disabled={!filterOptions}
            />
            <dl>
              <dt className="font-semibold">Add Conditions</dt>
              <dd className="text-sm font-medium text-default-400">
                Enable the option to set conditions for filtering passenger data.
              </dd>
            </dl>
          </>
        )}
      </div>

      {isFilterEnabled && filterOptions ? (
        <Conditions
          className="mt-[30px] rounded-lg border border-gray-200"
          conditions={selectedFilters}
          logicItems={filterOptions.logicItems}
          criteriaItems={filterOptions.criteriaItems}
          operatorItems={filterOptions.operatorItems}
          valueItems={filterOptions.valueItems}
          // TODO: 아래 코드를 함수화해서 재사용할 수 있도록 개선
          onChange={({ states, what, index }) => {
            if (index === undefined) return;

            const updatedFilters = selectedFilters.map((filter, i) => {
              if (i !== index) return filter;

              if (what === 'criteria') {
                const newCriteria = states[0].id;
                const defaultOperator = filterOptions.operatorItems[newCriteria][0].id;

                return { ...filter, criteria: newCriteria, operator: defaultOperator, value: [] };
              }

              if (what === 'value') {
                return { ...filter, value: states.map((s) => s.id) };
              }

              return filter;
            });

            setFlightScheduleSelectedFilters(updatedFilters);
          }}
          onDelete={(index) => {
            const updatedFilters = selectedFilters.filter((_, i) => i !== index);

            if (updatedFilters.length === 0) {
              setIsFilterEnabled(false);
            }

            setFlightScheduleSelectedFilters(updatedFilters);
          }}
          onAddCondition={(newFilter) => setFlightScheduleSelectedFilters([...selectedFilters, newFilter])}
        />
      ) : null}

      {loadingFlightSchedule ? (
        <div className="flex min-h-[200px] flex-1 items-center justify-center">
          <OrbitProgress color="#32cd32" size="medium" text="" textColor="" />
        </div>
      ) : flightScheduleChartData && flightScheduleChartData.total > 0 ? (
        <>
          <div className="mt-[30px] flex items-center justify-between">
            <p className="text-lg font-semibold">Total: {flightScheduleChartData?.total} Flights</p>
            <div className="flex flex-col">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex h-[30px] flex-row items-center pb-2.5">
                    <Button
                      className="btn-lg btn-default text-sm"
                      icon={<Image width={20} height={20} src="/image/ico-button-menu.svg" alt="" />}
                      text={`Color by : ${colorCriteria}`}
                      onClick={() => {}}
                    />
                  </div>
                </DropdownMenuTrigger>

                <DropdownMenuContent className="cursor-pointer bg-white">
                  {Object.keys(flightScheduleChartData?.data).map((text, index) => (
                    <div key={index} className="flex flex-col">
                      <DropdownMenuItem
                        className="flex cursor-pointer flex-row px-[14px] py-2.5 pl-[14px]"
                        style={{ width: 143 }}
                        onClick={() => setColorCriteria(text)}
                      >
                        <span className="ml-2.5 text-base font-medium text-gray-800">{text}</span>
                      </DropdownMenuItem>
                    </div>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="z-10 mt-2.5 rounded-md bg-white">
            <BarChart
              chartData={
                // HACK: 현재는 간단히 구현하기 위해서 얕은 복사를 사용했지만
                // 추후에는 Zustand 자체에서 정렬된 데이터를 가져오게 개선이 필요하다.
                [...flightScheduleChartData?.data?.[colorCriteria || '']]
                  .sort((a, b) => b.order - a.order)
                  .map((item, index) => {
                    return {
                      x: flightScheduleChartData?.x,
                      y: item.y,
                      name: item.name,
                      type: 'bar',
                      marker: { opacity: 1, cornerradius: 7 },
                      hovertemplate: item.y?.map((val) => `[%{x}] ${val}`),
                    };
                  })
              }
              chartLayout={{
                barmode: 'stack',
                margin: { l: 30, r: 10, t: 0, b: 30 },
                legend: { x: 1, y: 1.2, xanchor: 'right', yanchor: 'top', orientation: 'h' },
                bargap: 0.4,
              }}
              config={{ displayModeBar: false }}
            />
          </div>
        </>
      ) : flightScheduleChartData && flightScheduleChartData.total < 1 ? (
        <div className="mt-[25px] flex flex-col items-center justify-center rounded-md border border-default-200 bg-default-50 py-[75px] text-center">
          <Image width={16} height={16} src="/image/ico-info.svg" alt="" />

          <p className="title-sm" style={{ color: '#30374F' }}>
            No data available
          </p>

          <p className="text-sm font-medium text-default-600">
            There are no flight schedules available for the selected conditions.
          </p>

          <p className="mt-[50px] flex items-center justify-center gap-2.5">
            <Button className="btn-md btn-default text-md" text="Clear Search" onClick={() => {}} />
            <Button
              className="btn-md btn-secondary text-md"
              text="Inquire About Data Access"
              icon={<Image width={16} height={16} src="/image/ico-question.svg" alt="" />}
              onClick={() => {}}
            />
          </p>
        </div>
      ) : loadError ? (
        <div className="mt-[25px] flex flex-col items-center justify-center rounded-md border border-default-200 bg-default-50 py-[75px] text-center">
          <Image width={16} height={16} src="/image/ico-error.svg" alt="" />

          <p className="title-sm" style={{ color: '#30374F' }}>
            Unable to load data
          </p>

          <p className="text-sm font-medium text-default-600">
            Please check the airport name or date and re-enter the information
          </p>

          <p className="mt-[50px] flex items-center justify-center gap-2.5">
            <Button className="btn-md btn-default text-md" text="Clear Search" onClick={() => {}} />
            <Button
              className="btn-md btn-secondary text-md"
              text="Inquire About Data Access"
              icon={<Image width={16} height={16} src="/image/ico-question.svg" alt="" />}
              onClick={() => {}}
            />
          </p>
        </div>
      ) : null}

      {/* =============== 탭 이동 버튼 =============== */}
      <div className="mt-[30px] flex justify-between">
        <button
          className="btn-md btn-default btn-rounded w-[210px] justify-between"
          onClick={() => setCurrentScenarioTab(currentScenarioTab - 1)}
        >
          <FontAwesomeIcon className="nav-icon" size="sm" icon={faAngleLeft} />
          <span className="flex flex-grow items-center justify-center">Scenario Overview</span>
        </button>

        <button
          className="btn-md btn-default btn-rounded w-[210px] justify-between"
          onClick={() => setCurrentScenarioTab(currentScenarioTab + 1)}
        >
          <span className="flex flex-grow items-center justify-center">Passenger Schedule</span>
          <FontAwesomeIcon className="nav-icon" size="sm" icon={faAngleRight} />
        </button>
      </div>
    </div>
  );
}
