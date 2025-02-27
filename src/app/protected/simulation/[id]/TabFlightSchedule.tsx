'use client';

import { IChartData, getFlightSchedule } from '@/api/simulations';
import { useResize } from '@/hooks/use-resize';
import { getRecoil } from '@/store/recoil';
import { TUserInfo } from '@/store/recoil/memory-atoms';
import { faAngleDown, faAngleLeft, faAngleRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import moment from 'moment';
import dynamic from 'next/dynamic';
import React, { useCallback, useRef, useState } from 'react';
import { OrbitProgress } from 'react-loading-indicators';
import Button from '@/components/Button';
import Checkbox from '@/components/Checkbox';
import Conditions, { ICondition, IDropdownItem, IOperatorItem } from '@/components/Conditions';
import TabDefault from '@/components/TabDefault';
import { Calendar } from '@/components/ui/calendar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

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

export default function TabFlightSchedule() {
  const refWidth = useRef(null);
  const [loadingFlightSchedule, setLoadingFlightSchedule] = useState(false);
  const [tabSecondary, setTabSecondary] = useState(0);
  const [conditions, setConditions] = useState<{
    logicItems: IDropdownItem[];
    criteriaItems: IDropdownItem[];
    operatorItems: { [criteriaId: string]: IOperatorItem[] };
    valueItems: { [criteriaId: string]: IDropdownItem[] };
  }>();
  const [selColorCriteria, setSelColorCriteria] = useState<string>('Airline');
  const [addConditionsVisible, setAddConditionsVisible] = useState(false);
  const [selDate, setSelDate] = useState<Date>(moment().toDate());
  const [selAirport, setSelAirport] = useState<string>('ICN');
  const [selConditions, setSelConditions] = useState<ICondition[]>([]);
  const [chartData, setChartData] = useState<{ total: number; x: string[]; data: IChartData }>();

  const { width } = useResize(refWidth);

  const userInfo = getRecoil<TUserInfo>('userInfo');
  const chartDataCurrent = chartData?.data?.[selColorCriteria];
  const barColorsCurrent = !chartDataCurrent
    ? []
    : String(chartDataCurrent?.length) in BarColors
      ? BarColors[String(chartDataCurrent?.length)]
      : BarColors.DEFAULT;
  const loadFlightSchedule = useCallback(
    (first_load: boolean = true) => {
      setLoadingFlightSchedule(true);
      getFlightSchedule({
        first_load,
        user_id: userInfo.id,
        date: moment(selDate).format('YYYY-MM-DD'),
        airport: selAirport,
        condition: selConditions,
      }).then(({ data }) => {
        if (data?.add_conditions) {
          const logicItems: IDropdownItem[] = [{ id: 'AND', text: 'AND' }];
          const criteriaItems: IDropdownItem[] = [];
          const operatorItems: { [criteriaId: string]: IOperatorItem[] } = {};
          const valueItems: { [criteriaId: string]: IDropdownItem[] } = {};
          for (const criteriaCur of data?.add_conditions) {
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
          setConditions({ logicItems, criteriaItems, operatorItems, valueItems });
        }
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
      });
    },
    [userInfo?.id, selDate, selAirport, selConditions]
  );
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
            icon={<img src="/image/ico-search-s.svg" alt="" />}
            text="ICN"
            textSub="Incheon Airport"
            onClick={() => {}}
          />
          <Popover>
            <PopoverTrigger asChild>
              <div>
                <Button
                  className="btn-md btn-default"
                  icon={<img src="/image/ico-calendar.svg" alt="" />}
                  text={moment(selDate).format('MMM D, YYYY')}
                  onClick={() => {}}
                />
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
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
            icon={<img src="/image/ico-find.svg" alt="" />}
            text="Find Peak Day"
            onClick={() => {}}
          />
          <Button
            className="btn-md btn-primary"
            iconRight={<img src="/image/ico-search-w.svg" alt="" />}
            text="Load"
            onClick={() => {
              loadFlightSchedule();
            }}
          />
        </div>
      </div>
      {chartData ? (
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
                      icon={<img src="/image/ico-button-menu.svg" alt="" />}
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
                        <span className="ml-[10px] text-md font-medium text-gray-800">{text}</span>
                      </DropdownMenuItem>
                    </div>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="mt-[10px] flex items-center justify-center rounded-md bg-white">
            <Plot
              // @ts-expect-error ...
              data={chartDataCurrent
                ?.sort((a, b) => b.order - a.order)
                .map((item, index) => {
                  return {
                    x: chartData.x,
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
      ) : loadingFlightSchedule ? (
        <div className="flex min-h-[200px] flex-1 items-center justify-center">
          <OrbitProgress color="#32cd32" size="medium" text="" textColor="" />
        </div>
      ) : (
        <div className="h-[100px]" />
      )}
      <div className="mt-[30px] flex justify-between">
        <button className="btn-md btn-default btn-rounded w-[210px] justify-between">
          <FontAwesomeIcon className="nav-icon" size="sm" icon={faAngleLeft} />
          <span className="flex flex-grow items-center justify-center">Scenario Overview</span>
        </button>
        <button className="btn-md btn-default btn-rounded w-[210px] justify-between" disabled>
          <span className="flex flex-grow items-center justify-center">Passenger Schedule</span>
          <FontAwesomeIcon className="nav-icon" size="sm" icon={faAngleRight} />
        </button>
      </div>
    </div>
  );
}
