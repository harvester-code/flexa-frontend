'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { OrbitProgress } from 'react-loading-indicators';
import { Plot } from 'react-plotly.js';
import Image from 'next/image';
import { faAngleDown, faAngleLeft, faAngleRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import dayjs from 'dayjs';
import { IConditionParams, getFlightSchedule } from '@/api/simulations';
import Button from '@/components/Button';
import Checkbox from '@/components/Checkbox';
import Conditions, { IDropdownItem, IOperatorItem } from '@/components/Conditions';
import TabDefault from '@/components/TabDefault';
import { Calendar } from '@/components/ui/Calendar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { useResize } from '@/hooks/useResize';
import { useUser } from '@/hooks/useUser';
import {
  useSimulationFlighScheduleStore,
  useSimulationMetadata,
  useSimulationStore,
} from '@/store/zustand/simulation';

const tabsSecondary: { text: string; number?: number }[] = [
  { text: 'Connect Cirium®' },
  { text: 'Connect OAG®' },
  { text: 'Direct Upload' },
];

const BarColors = {
  DEFAULT: [
    '#B9C0D4',
    '#F4EBFF',
    '#E9D7FE',
    '#D6BBFB',
    '#B692F6',
    '#9E77ED',
    '#7F56D9',
    '#6941C6',
    '#53389E',
    '#42307D',
  ],
  '2': ['#D6BBFB', '#6941C6'],
  '3': ['#D6BBFB', '#9E77ED', '#6941C6'],
  '4': ['#D6BBFB', '#B692F6', '#9E77ED', '#6941C6'],
  '5': ['#D6BBFB', '#B692F6', '#9E77ED', '#7F56D9', '#6941C6'],
};

interface TabFlightScheduleProps {
  simulationId: string;
}

const parseConditions = (conditionData: IConditionParams[]) => {
  const logicItems: IDropdownItem[] = [{ id: 'AND', text: 'AND' }];
  const criteriaItems: IDropdownItem[] = [];
  const operatorItems: { [criteriaId: string]: IOperatorItem[] } = {};
  const valueItems: { [criteriaId: string]: IDropdownItem[] } = {};
  for (const criteriaCur of conditionData) {
    const idCur = criteriaCur.name;
    criteriaItems.push({ id: idCur, text: criteriaCur.name });
    criteriaCur.operator.map((val, index) => {
      if (val === '=') operatorItems[idCur] = [{ id: `O${index + 1}`, text: '=', multiSelect: false }];
      else if (val === 'is in')
        operatorItems[idCur] = [{ id: `O${index + 1}`, text: 'is in', multiSelect: true }];
    });
    valueItems[idCur] = [];
    for (const valueCur of criteriaCur.value) {
      valueItems[idCur].push({ id: valueCur, text: valueCur });
    }
  }
  return { logicItems, criteriaItems, operatorItems, valueItems };
};

export default function TabFlightSchedule({ simulationId }: TabFlightScheduleProps) {
  const refWidth = useRef(null);
  const { flight_sch, setFlightSchedule } = useSimulationMetadata();
  const { tabIndex, setTabIndex } = useSimulationStore();
  const {
    chartData,
    setChartData,
    selColorCriteria,
    setSelColorCriteria,
    addConditionsVisible,
    setAddConditionsVisible,
    selDate,
    setSelDate,
    selAirport,
    setSelAirport,
    selConditions,
    setSelConditions,
  } = useSimulationFlighScheduleStore();
  const [loadingFlightSchedule, setLoadingFlightSchedule] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [tabSecondary, setTabSecondary] = useState(0);

  const { width } = useResize(refWidth);

  const { data: userInfo } = useUser();
  const conditions = flight_sch?.add_conditions;
  const chartDataCurrent = chartData?.data?.[selColorCriteria];
  const barColorsCurrent = !chartDataCurrent
    ? []
    : String(chartDataCurrent?.length) in BarColors
      ? BarColors[String(chartDataCurrent?.length)]
      : BarColors.DEFAULT;
  const loadFlightSchedule = useCallback(
    (first_load: boolean = true) => {
      if (!simulationId) return;
      setLoadingFlightSchedule(true);
      getFlightSchedule(simulationId, {
        first_load,
        date: dayjs(selDate).format('YYYY-MM-DD'),
        airport: selAirport,
        condition: selConditions,
      })
        .then(({ data }) => {
          const flightSchedule = {};
          if (data?.add_conditions) {
            flightSchedule['add_conditions'] = parseConditions(data?.add_conditions);
          }
          if (data?.add_priorities) {
            flightSchedule['add_priorities'] = parseConditions(data?.add_priorities);
          }
          setFlightSchedule(flightSchedule);
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
            setChartData({
              total: data?.total,
              x: data?.chart_x_data,
              data: data?.chart_y_data,
            });
          }
          setLoadingFlightSchedule(false);
        })
        .catch(() => {
          setLoadError(true);
          setLoadingFlightSchedule(false);
        });
    },
    [userInfo?.id, selDate, selAirport, selConditions, simulationId]
  );

  useEffect(() => {
    if (chartData) loadFlightSchedule(false);
  }, [selConditions, selAirport, selDate]);

  return (
    <div ref={refWidth}>
      <h2 className="title-sm mt-[25px]">Flight Schedule</h2>
      <TabDefault
        tabCount={tabsSecondary.length}
        currentTab={tabSecondary}
        tabs={tabsSecondary.map((tab) => ({ text: tab.text, number: tab.number || 0 }))}
        className={`tab-secondary mt-[25px] grid-cols-3`}
        // onTabChange={(tabIndex) => setTabSecondary(tabIndex)}
      />
      <div className="mt-[40px] flex items-center justify-between">
        <p className="text-xl font-semibold text-default-800">Load Flight Schedule Data</p>
        <div className="flex items-center gap-[10px]">
          <Button
            className="btn-md btn-default"
            icon={<Image width={20} height={20} src="/image/ico-search-s.svg" alt="" />}
            text="ICN"
            textSub="Incheon Airport"
            onClick={() => {}}
          />
          <Popover>
            <PopoverTrigger asChild>
              <div>
                <Button
                  className="btn-md btn-default"
                  icon={<Image width={16} height={16} src="/image/ico-calendar.svg" alt="" />}
                  text={dayjs(selDate).format('MMM D, YYYY')}
                  onClick={() => {}}
                />
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                toDate={new Date('2025-03-05')}
                mode="single"
                selected={selDate}
                onSelect={(date) => {
                  if (date) setSelDate(date);
                }}
              />
            </PopoverContent>
          </Popover>
          <Button
            className="btn-md btn-default"
            icon={<Image width={20} height={20} src="/image/ico-find.svg" alt="" />}
            text="Find Peak Day"
            onClick={() => {}}
          />
          <Button
            className="btn-md btn-primary"
            iconRight={<Image width={20} height={20} src="/image/ico-search-w.svg" alt="" />}
            text="Load"
            onClick={() => {
              loadFlightSchedule();
            }}
          />
        </div>
      </div>
      {loadingFlightSchedule ? (
        <div className="flex min-h-[200px] flex-1 items-center justify-center">
          <OrbitProgress color="#32cd32" size="medium" text="" textColor="" />
        </div>
      ) : chartData ? (
        <>
          <p className="mt-[20px] text-xl font-semibold">Flight Schedule Data Filtering</p>
          <div className="mt-[10px] flex items-center gap-[10px] rounded-md border border-gray-200 bg-gray-50 p-[15px]">
            <Checkbox
              id="add-conditions"
              label=""
              checked={addConditionsVisible}
              onChange={() => setAddConditionsVisible(!addConditionsVisible)}
              className="checkbox-toggle"
              disabled={!conditions}
            />
            <dl>
              <dt className="font-semibold">Add Conditions</dt>
              <dd className="text-sm font-medium text-default-400">
                Enable the option to set conditions for filtering passenger data.{' '}
              </dd>
            </dl>
          </div>
          {conditions && addConditionsVisible ? (
            <Conditions
              logicItems={conditions.logicItems}
              criteriaItems={conditions.criteriaItems}
              operatorItems={conditions.operatorItems}
              valueItems={conditions.valueItems}
              onBtnApply={(conditions) => {
                setSelConditions(conditions);
              }}
            />
          ) : null}
          <div className="mt-[30px] flex items-center justify-between">
            <p className="text-lg font-semibold">Total: {chartData?.total} Flights</p>
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
            <Plot
              data={chartDataCurrent
                ?.sort((a, b) => b.order - a.order)
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
              layout={{
                width,
                height: 500,
                margin: {
                  l: 20,
                  r: 10,
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
          <div className="flex items-center justify-center">
            <button className="flex h-[50px] w-full items-center justify-center gap-[10px] border-b border-default-200 text-lg font-medium text-default-300 hover:text-default-700">
              <FontAwesomeIcon className="nav-icon" size="sm" icon={faAngleDown} />
              Show Table
            </button>
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
        <div className="h-[100px]" />
      )}
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
