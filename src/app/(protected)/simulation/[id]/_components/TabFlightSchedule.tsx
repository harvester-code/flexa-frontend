'use client';

import React, { useCallback, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { faAngleLeft, faAngleRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import dayjs from 'dayjs';
import { OrbitProgress } from 'react-loading-indicators';
import { useShallow } from 'zustand/react/shallow';
import { ConditionData, ConditionParams, ConditionState, DropdownItem, OperatorItem } from '@/types/conditions';
import { FlightSchedule } from '@/types/simulations';
import { getFlightSchedules } from '@/services/simulations';
import { BarColors } from '@/stores/simulation';
import { useScenarioStore } from '@/stores/useScenarioStore';
import { useUser } from '@/queries/userQueries';
import Button from '@/components/Button';
import Checkbox from '@/components/Checkbox';
import Conditions from '@/components/Conditions';
import selectBoxStyles from '@/components/SelectBox.module.css';
import TabDefault from '@/components/TabDefault';
import { Calendar } from '@/components/ui/Calendar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/DropdownMenu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { deepCompare } from '@/lib/utils';
import { cn } from '@/lib/utils';
import _jsonAirport from '../_json/airport_constants.json';

// TODO
// - Load 눌렀을 때, 기존에 있던 Conditions, ChartData 등등 초기화하고 데이터 읽어오기

const jsonAirportObj = {};
const jsonAirport = _jsonAirport.map((item) => {
  jsonAirportObj[item.iata] = item.name;
  return {
    iata: item.iata,
    name: item.name,
    searchText: `${item.iata}/${item.name}`.toUpperCase(),
  };
});

const BarChart = dynamic(() => import('@/components/charts/BarChart'), { ssr: false });

const SUB_TABS: { text: string; number?: number }[] = [
  { text: 'Connect Cirium®' },
  { text: 'Connect OAG®' },
  { text: 'Direct Upload' },
];

interface TabFlightScheduleProps {
  simulationId: string;
  visible: boolean;
}

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

export default function TabFlightSchedule({ simulationId, visible }: TabFlightScheduleProps) {
  const refWidth = useRef(null);

  const { data: userInfo } = useUser();
  const {
    tabIndex,
    setTabIndex,
    setAvailableTabIndex,
    subTab,
    setTargetDate,
    targetDate,
    selDate,
    airport,
    flightSchedule,
    setFlightSchedule,
    setFlightScheduleTime,
    resetMetadata,
    chartData,
    colorCriteria,
    setColorCriteria,
    conditions,
    setConditions,
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
      selDate: state.flight_sch?.snapshot?.selDate || dayjs().toDate(),
      airport: state.flight_sch?.params?.airport || 'ICN',
      flightSchedule: state.flight_sch?.snapshot || {},
      setFlightSchedule: state.setFlightSchedule,
      setFlightScheduleTime: state.setFlightScheduleTime,
      resetMetadata: state.resetMetadata,
      chartData: state.flight_sch?.snapshot?.chartData,
      colorCriteria: state.flight_sch?.snapshot?.selColorCriteria || 'Airline',
      setColorCriteria: state.setColorCriteria,
      conditions: state.conditions,
      setConditions: state.setConditions,
      priorities: state.priorities,
      setPriorities: state.setPriorities,
    }))
  );

  const [selConditions, setSelConditions] = useState<ConditionState[]>();

  const [applied, setApplied] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [loadingFlightSchedule, setLoadingFlightSchedule] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const chartDataCurrent = chartData?.data?.[colorCriteria] || [];

  const barColorsCurrent = !chartDataCurrent
    ? []
    : String(chartDataCurrent?.length) in BarColors
      ? BarColors[String(chartDataCurrent?.length)]
      : BarColors.DEFAULT;

  // ‼️ 시리움에서 데이터를 불러온다.
  const loadFlightSchedule = useCallback(
    (first_load: boolean, useCondition: boolean) => {
      if (!simulationId) return;

      setLoadingFlightSchedule(true);
      setAvailableTabIndex(tabIndex);

      const params = {
        first_load,
        date: dayjs(selDate).format('YYYY-MM-DD'),
        airport: airport,
        condition: first_load ? [] : useCondition ? selConditions || [] : [],
      };

      getFlightSchedules(simulationId, params)
        .then(({ data }) => {
          const flightSchedule: Partial<FlightSchedule> = { params };
          const snapshotData: any = { applied: true };

          // ========================================================
          if (first_load && data?.add_conditions) {
            const conditions = parseConditions(data?.add_conditions);
            for (const keyCur in conditions) {
              if (Array.isArray(conditions[keyCur]))
                for (const rowCur of conditions[keyCur]) {
                  rowCur.tooltip = { title: 'title', text: 'test' };
                }
            }
            setConditions(conditions);
            snapshotData.conditions = conditions;
          }

          // ========================================================
          if (first_load && data?.add_priorities) {
            const priorities = parseConditions(data?.add_priorities);
            for (const keyCur in priorities) {
              if (Array.isArray(priorities[keyCur]))
                for (const rowCur of priorities[keyCur]) {
                  rowCur.tooltip = { title: 'title', text: 'test' };
                }
            }
            setPriorities(priorities);
            snapshotData.priorities = priorities;
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

            // setChartData(newChartData);
            snapshotData.chartData = newChartData;
          }

          // ========================================================
          resetMetadata();
          setFlightScheduleTime(Date.now());
          setApplied(true);
          setLoadingFlightSchedule(false);
          // saveSnapshot(flightSchedule, snapshotData);
        })
        .catch(() => {
          setLoadError(true);
          setLoadingFlightSchedule(false);
        });
    },
    [userInfo?.id, selDate, airport, selConditions, simulationId]
  );

  // useEffect(() => {
  //   if (prevStates.current.selAirport != selAirport || prevStates.current.selDate != selDate) {
  //     setAddConditionsVisible(false);
  //     setSelConditions(undefined);
  // setChartData(undefined);
  //   } else {
  //     if (chartData) loadFlightSchedule(false, addConditionsVisible);
  //   }
  //   prevStates.current = { selConditions, selAirport, selDate };
  // }, [selConditions, selAirport, selDate]);

  // const conditionChanged = !applied || flightSchedule?.addConditionsVisible != addConditionsVisible;

  const [inputAirport, setInputAirport] = useState(false);

  const [inputAirportText, setInputAirportText] = useState('');

  const airportList =
    inputAirportText?.length > 2
      ? jsonAirport.filter((item) => item?.searchText?.indexOf(inputAirportText.toUpperCase()) >= 0)
      : [];

  const airportFullName = jsonAirportObj[airport] || '';

  return !visible ? null : (
    <div ref={refWidth}>
      <h2 className="title-sm mt-[25px]">Flight Schedule</h2>

      <TabDefault
        tabCount={SUB_TABS.length}
        currentTab={subTab}
        tabs={SUB_TABS.map((tab) => ({ text: tab.text, number: tab.number || 0 }))}
        className={`tab-secondary mt-[25px]`}
        // onTabChange={(tabIndex) => setTabSecondary(tabIndex)}
      />

      <div className="mt-[40px] flex items-center justify-between">
        <p className="text-xl font-semibold text-default-800">Load Flight Schedule Data</p>

        {/* ========== 공항 검색 버튼 ========== */}
        <div className="flex items-center gap-[10px]">
          {inputAirport ? (
            <div className="relative">
              <div className="relative">
                <input
                  id="input-airport"
                  type="text"
                  placeholder=""
                  value={inputAirportText}
                  className="btn-md btn-default !w-[314px] !pl-[40px]"
                  onChange={(e) => setInputAirportText(e.target.value)}
                  onBlur={() => {
                    if (inputAirportText.length < 3) {
                      setInputAirport(false);
                    }
                  }}
                />
                <div className="absolute bottom-0 left-[14px] top-0 flex flex-col justify-center">
                  <Image width={20} height={20} src="/image/ico-search-s.svg" alt="" />
                </div>
              </div>

              {airportList.length > 0 ? (
                <div
                  className={cn(
                    selectBoxStyles.selectBox,
                    airportList.length > 0 && selectBoxStyles['active'],
                    `top-[-40px] !h-0 !rounded-none !border-none !py-0`
                  )}
                >
                  <div className={cn(selectBoxStyles.selectItem, `max-h-[400px]`)}>
                    <ul className={cn(selectBoxStyles.selectOptionCont)}>
                      {airportList?.map((item, index) => (
                        <li
                          className={cn(selectBoxStyles.selectOptionItem)}
                          key={index}
                          onClick={() => {
                            // setAddConditionsVisible(false);
                            // setSelAirport(item.iata);
                            setSelConditions(undefined);
                            setInputAirportText('');
                            setInputAirport(false);
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
              text={airport}
              textSub={airportFullName}
              onClick={() => {
                setInputAirport(true);
                setTimeout(() => {
                  document.getElementById('input-airport')?.focus();
                }, 50);
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
                  if (date) {
                    setTargetDate(dayjs(date).format('YYYY-MM-DD'));
                    // setSelConditions(undefined);
                    // setChartData(undefined);
                  }
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
              // setSelConditions(undefined);
              // setAddConditionsVisible(false);
              // setChartData(undefined);
              // loadFlightSchedule(true, addConditionsVisible);
            }}
          />
        </div>
      </div>

      {/* ========== 데이터 필터링 섹션 ========== */}
      {chartData ? (
        <>
          <p className="mt-[20px] text-xl font-semibold">Flight Schedule Data Filtering</p>
          <div className="mt-[10px] flex items-center gap-[10px] rounded-md border border-gray-200 bg-gray-50 p-[15px]">
            <Checkbox
              id="add-conditions"
              className="checkbox-toggle"
              label=""
              checked={Object.keys(conditions || {}).length > 0}
              onChange={() => {}}
              // onChange={() => {
              //   const nextState = !addConditionsVisible;
              //   setAddConditionsVisible(nextState);
              //   if (!nextState) loadFlightSchedule(false, false);
              // }}
              // disabled={!conditions}
            />
            <dl>
              <dt className="font-semibold">Add Conditions</dt>
              <dd className="text-sm font-medium text-default-400">
                Enable the option to set conditions for filtering passenger data.
              </dd>
            </dl>
          </div>

          {Object.keys(conditions || {}).length > 0 ? (
            <Conditions
              className="mt-[30px] rounded-lg border border-gray-200"
              logicItems={conditions?.logicItems || []}
              criteriaItems={conditions?.criteriaItems || []}
              operatorItems={conditions?.operatorItems || {}}
              valueItems={conditions?.valueItems || {}}
              initialValue={selConditions}
              onBtnApply={(conditions) => setSelConditions(conditions)}
              onChange={(conitions) => {
                if (deepCompare(flightSchedule.selConditions, conitions)) {
                  if (!applied) setApplied(true);
                } else {
                  if (applied) setApplied(false);
                }
              }}
            />
          ) : null}
        </>
      ) : null}

      {loadingFlightSchedule ? (
        <div className="flex min-h-[200px] flex-1 items-center justify-center">
          <OrbitProgress color="#32cd32" size="medium" text="" textColor="" />
        </div>
      ) : chartData ? (
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
                .sort((a, b) => b.order - a.order)
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
                      // TODO 겹쳐지는 모든 Bar 들에 radius 줄 수 있는 방법 찾아보기.
                    },
                    hovertemplate: item.y?.map((val) => `[%{x}] ${val}`),
                  };
                })}
              chartLayout={{
                height: 390,
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
      ) : (
        <div className="h-[50px]" />
      )}

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
          // disabled={conditionChanged || !chartData}
          onClick={() => setTabIndex(tabIndex + 1)}
        >
          <span className="flex flex-grow items-center justify-center">Passenger Schedule</span>
          <FontAwesomeIcon className="nav-icon" size="sm" icon={faAngleRight} />
        </button>
      </div>
    </div>
  );
}
