'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { faAngleLeft, faAngleRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import dayjs from 'dayjs';
import { OrbitProgress } from 'react-loading-indicators';
import { useShallow } from 'zustand/react/shallow';
import { ConditionData, ConditionParams, DropdownItem, OperatorItem } from '@/types/conditions';
import { getFlightSchedules } from '@/services/simulations';
import { BarColors } from '@/stores/simulation';
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

const SUB_TABS: { text: string; number?: number }[] = [
  { text: 'Connect Cirium®' },
  { text: 'Connect OAG®' },
  { text: 'Direct Upload' },
];

const jsonAirportObj = {};
const jsonAirport = _jsonAirport.map((item) => {
  jsonAirportObj[item.iata] = item.name;
  return {
    iata: item.iata,
    name: item.name,
    searchText: `${item.iata}/${item.name}`.toUpperCase(),
  };
});

const parseConditions = (conditionData: ConditionParams[]): ConditionData => {
  const logicItems: DropdownItem[] = [{ id: 'AND', text: 'AND' }];
  const criteriaItems: DropdownItem[] = [];

  const operatorItems: { [criteriaId: string]: OperatorItem[] } = {};
  const valueItems: { [criteriaId: string]: DropdownItem[] } = {};

  for (const criteriaCur of conditionData) {
    const idCur = criteriaCur.name;

    criteriaItems.push({ id: idCur, text: criteriaCur.name });
    criteriaCur.operator.map((val) => {
      if (val === '=') operatorItems[idCur] = [{ id: val, text: val, multiSelect: false }];
      else if (val === 'is in') operatorItems[idCur] = [{ id: val, text: val, multiSelect: true }];
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
    tabIndex,
    setTabIndex,
    setAvailableTabIndex,
    subTab,
    setTargetDate,
    targetDate,
    airport,
    flightSchedule,
    setFlightSchedule,
    setFlightScheduleTime,
    resetMetadata,
    chartData,
    setChartData,
    colorCriteria,
    setColorCriteria,
    conditionFilters,
    setConditionFilters,
    selectedConditions,
    setSelectedConditions,
    isConditionFilterEnabled,
    setIsConditionFilterEnabled,
    priorities,
    setPriorities,
  } = useScenarioStore(
    useShallow((state) => ({
      tabIndex: state.tabIndex,
      setTabIndex: state.setTabIndex,
      setAvailableTabIndex: state.setAvailableTabIndex,
      subTab: state.flight_sch?.snapshot?.tabSecondary || 0,
      setTargetDate: state.setTargetDate,
      targetDate: state.flight_sch?.params?.date || dayjs().format('YYYY-MM-DD'),
      airport: state.flight_sch?.params?.airport || 'ICN',
      flightSchedule: state.flight_sch?.snapshot || {},
      setFlightSchedule: state.setFlightSchedule,
      setFlightScheduleTime: state.setFlightScheduleTime,
      resetMetadata: state.resetMetadata,
      chartData: state.flight_sch?.snapshot?.chartData,
      setChartData: state.setChartData,
      colorCriteria: state.flight_sch?.snapshot?.selColorCriteria || 'Airline',
      setColorCriteria: state.setColorCriteria,
      conditionFilters: state.conditionFilters,
      setConditionFilters: state.setConditionFilters,
      selectedConditions: state.selectedConditions,
      setSelectedConditions: state.setSelectedConditions,
      isConditionFilterEnabled: state.isConditionFilterEnabled,
      setIsConditionFilterEnabled: state.setIsConditionFilterEnabled,
      priorities: state.priorities,
      setPriorities: state.setPriorities,
    }))
  );

  const [loadError, setLoadError] = useState(false);
  const [loadingFlightSchedule, setLoadingFlightSchedule] = useState(false);

  // ‼️ 시리움에서 데이터를 불러온다.
  const loadFlightSchedule = async () => {
    if (!simulationId) return;

    // TODO: 아래와 같은 경우 사용자에게 메세지 주기
    if (!userSelectedAirport) return;

    setLoadingFlightSchedule(true);

    // HACK: 완전 처음 입력되었을 때 해당 로직이 올바른지 테스트가 필요하다.
    const isSomethingChanged = airport !== userSelectedAirport?.iata || targetDateRef.current !== targetDate;

    // FIXME: 해당 탭에서 처음 로드할 때만 탭 인덱스를 설정하도록 변경
    // setAvailableTabIndex(tabIndex);

    const params = {
      date: dayjs(targetDate).format('YYYY-MM-DD'),
      airport: userSelectedAirport.iata,
      condition: isConditionFilterEnabled ? selectedConditions : [],
    };

    try {
      const { data } = await getFlightSchedules(simulationId, params);

      // ========================================================
      if (isSomethingChanged) {
        const conditions = parseConditions(data?.add_conditions);
        for (const keyCur in conditions) {
          if (Array.isArray(conditions[keyCur]))
            for (const rowCur of conditions[keyCur]) {
              rowCur.tooltip = { title: 'title', text: 'test' };
            }
        }
        setConditionFilters(conditions);
      }

      // ========================================================
      if (isSomethingChanged) {
        const priorities = parseConditions(data?.add_priorities);
        for (const keyCur in priorities) {
          if (Array.isArray(priorities[keyCur]))
            for (const rowCur of priorities[keyCur]) {
              rowCur.tooltip = { title: 'title', text: 'test' };
            }
        }
        setPriorities(priorities);
      }

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

        const newChartData = {
          total: data?.total,
          x: data?.chart_x_data,
          data: data?.chart_y_data,
        };

        setChartData(newChartData);
      }

      // ========================================================
      // resetMetadata();
      // setFlightScheduleTime(Date.now());
      // setApplied(true);
    } catch (error) {
      setLoadError(true);
    } finally {
      setLoadingFlightSchedule(false);
    }
  };

  // ===============================================================
  const [isTypingAirport, setIsTypingAirport] = useState(false);
  const [userInputAirport, setUserInputAirport] = useState('');
  const [userSelectedAirport, setUserSelectedAirport] = useState<{
    iata: string;
    name: string;
    searchText: string;
  } | null>(null);
  const [filteredAirports, setFilteredAirports] = useState<{ iata: string; name: string; searchText: string }[]>([]);

  useEffect(() => {
    if (userInputAirport?.length > 2) {
      setFilteredAirports(
        jsonAirport.filter((item) => {
          return item?.searchText?.indexOf(userInputAirport.toUpperCase()) >= 0;
        })
      );
    }
  }, [userInputAirport]);

  useEffect(() => {
    if (airport) {
      setUserSelectedAirport({
        iata: airport,
        name: jsonAirportObj[airport],
        searchText: `${airport}/${jsonAirportObj[airport]}`.toUpperCase(),
      });
    }
  }, [airport]);

  // NOTE: 위에서 작성한 Airport도 아래와 같이 useRef를 사용해서 저장시켜놓고 싶지만
  // 현재 작성된 코드에서는 Airport에 대해서는 이와 같이 설정하기가 어렵다.
  // 때문에 추후에는 Airport를 useRef로 설정할 수 있도록 리팩토링이 되면 좋겠다.
  const targetDateRef = useRef(targetDate);

  // ===============================================================
  const chartDataCurrent = chartData?.data?.[colorCriteria] || [];

  const barColorsCurrent = !chartDataCurrent
    ? []
    : String(chartDataCurrent?.length) in BarColors
      ? BarColors[String(chartDataCurrent?.length)]
      : BarColors.DEFAULT;

  return !visible ? null : (
    <div>
      <h2 className="title-sm mt-[25px]">Flight Schedule</h2>

      <TabDefault
        tabCount={SUB_TABS.length}
        currentTab={subTab}
        tabs={SUB_TABS.map((tab) => ({ text: tab.text, number: tab.number || 0 }))}
        className={`tab-secondary mt-[25px]`}
      />

      <div className="mt-[40px] flex items-center justify-between">
        <p className="text-xl font-semibold text-default-800">Load Flight Schedule Data</p>

        {/* =============== 공항 검색 버튼 =============== */}
        <div className="flex items-center gap-[10px]">
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
                      {filteredAirports?.map((item, index) => (
                        <li
                          className={cn(selectBoxStyles.selectOptionItem)}
                          key={index}
                          onClick={() => {
                            setUserSelectedAirport(item);

                            setIsTypingAirport(false);
                            setFilteredAirports([]);
                            setUserInputAirport('');
                          }}
                        >
                          <button className={cn(selectBoxStyles.selectOptionBtn, `text-left`)}>
                            <span>{item.iata}</span>
                            <span className="ml-[10px] text-default-500">{item.name}</span>
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
              text={userSelectedAirport?.iata || ''}
              textSub={userSelectedAirport?.name}
              onClick={() => {
                setIsTypingAirport(true);
                setTimeout(() => document.getElementById('input-airport')?.focus(), 50);
              }}
            />
          )}

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
              {/* FIXME: 클릭 후 닫히게 변경 필요 */}
              <Calendar
                mode="single"
                selected={dayjs(targetDate).toDate()}
                defaultMonth={dayjs(targetDate).toDate()}
                onSelect={(date) => {
                  if (date) setTargetDate(dayjs(date).format('YYYY-MM-DD'));
                }}
              />
            </PopoverContent>
          </Popover>

          {/* <Button
            className="btn-md btn-default"
            icon={<Image width={20} height={20} src="/image/ico-find.svg" alt="" />}
            text="Find Peak Day"
            onClick={() => {}}
          /> */}

          <Button
            className="btn-md btn-primary"
            iconRight={<Image width={20} height={20} src="/image/ico-search-w.svg" alt="" />}
            text="Load"
            onClick={() => {
              setChartData(undefined);
              loadFlightSchedule();
            }}
          />
        </div>
      </div>

      {/* ========== 데이터 필터링 섹션 ========== */}
      <p className="mt-[20px] text-xl font-semibold">Flight Schedule Data Filtering</p>
      <div className="mt-[10px] flex items-center gap-[10px] rounded-md border border-gray-200 bg-gray-50 p-[15px]">
        <Checkbox
          id="add-conditions"
          className="checkbox-toggle"
          label=""
          checked={isConditionFilterEnabled}
          onChange={() => setIsConditionFilterEnabled(!isConditionFilterEnabled)}
        />
        <dl>
          <dt className="font-semibold">Add Conditions</dt>
          <dd className="text-sm font-medium text-default-400">
            Enable the option to set conditions for filtering passenger data.
          </dd>
        </dl>
      </div>

      {isConditionFilterEnabled ? (
        <Conditions
          conditions={selectedConditions}
          className="mt-[30px] rounded-lg border border-gray-200"
          criteriaItems={conditionFilters?.criteriaItems || []}
          logicItems={conditionFilters?.logicItems || []}
          operatorItems={conditionFilters?.operatorItems || {}}
          valueItems={conditionFilters?.valueItems || {}}
          onChange={setSelectedConditions}
        />
      ) : null}

      {loadingFlightSchedule ? (
        <div className="flex min-h-[200px] flex-1 items-center justify-center">
          <OrbitProgress color="#32cd32" size="medium" text="" textColor="" />
        </div>
      ) : chartData.total > 0 ? (
        <>
          <div className="mt-[30px] flex items-center justify-between">
            <p className="text-lg font-semibold">Total: {chartData?.total} Flights</p>
            <div className="flex flex-col">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex h-[30px] flex-row items-center pb-[10px]">
                    <Button
                      className="btn-lg btn-default text-sm"
                      icon={<Image width={20} height={20} src="/image/ico-button-menu.svg" alt="" />}
                      text={`Color by : ${colorCriteria}`}
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
                        onClick={() => setColorCriteria(text)}
                      >
                        <span className="ml-[10px] text-base font-medium text-gray-800">{text}</span>
                      </DropdownMenuItem>
                    </div>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="z-10 mt-[10px] flex items-center justify-center rounded-md bg-white">
            <BarChart
              chartData={chartDataCurrent
                // FIXME: Zustand에서 정렬된 상태로 저장되도록 변경
                // .sort((a, b) => b.order - a.order)
                .map((item, index) => {
                  return {
                    x: chartData?.x,
                    y: item.y,
                    name: item.name,
                    type: 'bar',
                    marker: {
                      color:
                        chartDataCurrent.length - index - 1 < barColorsCurrent.length
                          ? item.name == 'etc'
                            ? BarColors.ETC
                            : barColorsCurrent[chartDataCurrent.length - index - 1]
                          : undefined,
                      opacity: 1,
                      cornerradius: 7,
                    },
                    hovertemplate: item.y?.map((val) => `[%{x}] ${val}`),
                  };
                })}
              chartLayout={{
                margin: { l: 30, r: 10, t: 0, b: 30 },
                barmode: 'stack',
                legend: { x: 1, y: 1.2, xanchor: 'right', yanchor: 'top', orientation: 'h' },
                bargap: 0.4,
              }}
              config={{
                displayModeBar: false,
              }}
            />
          </div>
        </>
      ) : chartData.total < 1 ? (
        <div className="mt-[25px] flex flex-col items-center justify-center rounded-md border border-default-200 bg-default-50 py-[75px] text-center">
          <Image width={16} height={16} src="/image/ico-info.svg" alt="" />

          <p className="title-sm" style={{ color: '#30374F' }}>
            No data available
          </p>

          <p className="text-sm font-medium text-default-600">
            There are no flight schedules available for the selected conditions.
          </p>

          <p className="mt-[50px] flex items-center justify-center gap-[10px]">
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

          <p className="mt-[50px] flex items-center justify-center gap-[10px]">
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

      {/* ========== 탭 이동 버튼 ========== */}
      <div className="mt-[30px] flex justify-between">
        <button
          className="btn-md btn-default btn-rounded w-[210px] justify-between"
          onClick={() => setTabIndex(tabIndex - 1)}
        >
          <FontAwesomeIcon className="nav-icon" size="sm" icon={faAngleLeft} />
          <span className="flex flex-grow items-center justify-center">Scenario Overview</span>
        </button>

        <button
          className="btn-md btn-default btn-rounded w-[210px] justify-between"
          onClick={() => setTabIndex(tabIndex + 1)}
        >
          <span className="flex flex-grow items-center justify-center">Passenger Schedule</span>
          <FontAwesomeIcon className="nav-icon" size="sm" icon={faAngleRight} />
        </button>
      </div>
    </div>
  );
}
