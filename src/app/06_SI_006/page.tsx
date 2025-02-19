'use client';

import Conditions, { ICondition, IDropdownItem, IOperatorItem } from '@/components/Conditions';
import { IChartData, getFlightSchedule } from '@/api/simulations';
import { useResize } from '@/hooks/use-resize';
import { faAngleDown, faAngleLeft, faAngleRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import moment from 'moment';
import dynamic from 'next/dynamic';
import React, { useCallback, useRef, useState } from 'react';
import Button from '@/components/Button';
import Checkbox from '@/components/Checkbox';
import ContentsHeader from '@/components/ContentsHeader';
import TabDefault from '@/components/TabDefault';
import RootLayoutDefault from '@/components/layoutDefault';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

const tabs: { text: string; number?: number }[] = [
  { text: 'Scenario Overview' },
  { text: 'Flight Schedule' },
  { text: 'Passenger Schedule' },
  { text: 'Processing Procedures' },
  { text: 'Facility Connection', number: 22 },
  { text: 'Facility Information' },
  { text: 'Simulation' },
];
const tabsSecondary: { text: string; number?: number }[] = [
  { text: 'Connect Cirium®' },
  { text: 'Connect OAG®' },
  { text: 'Direct Upload' },
];

const BarColors = {
  "DEFAULT": [
    ...[
      '#F4EBFF',
      '#E9D7FE',
      '#D6BBFB',
      '#B692F6',
      '#9E77ED',
      '#7F56D9',
      '#6941C6',
      '#53389E',
      '#42307D',
    ].reverse(),
    '#B9C0D4',
  ],
  "2": [
    '#E9D7FE',
    '#53389E',
  ].reverse(),
  "3": [
    '#E9D7FE',
    '#9E77ED',
    '#53389E',
  ].reverse(),
  "4": [
    '#E9D7FE',
    '#B692F6',
    '#7F56D9',
    '#53389E',
  ].reverse(),
  "5": [
    '#F4EBFF',
    '#D6BBFB',
    '#9E77ED',
    '#7F56D9',
    '#53389E',
  ].reverse(),
}

const DirectUploadDone: React.FC = () => {
  const [conditions, setConditions] = useState<{
    logicItems: IDropdownItem[];
    criteriaItems: IDropdownItem[];
    operatorItems: { [criteriaId: string]: IOperatorItem[] };
    valueItems: { [criteriaId: string]: IDropdownItem[] };
  }>();
  const [addConditionsVisible, setAddConditionsVisible] = useState(false);
  const [selDate, setSelDate] = useState<Date>(moment().toDate());
  const [selAirport, setSelAirport] = useState<string>('ICN');
  const [selConditions, setSelConditions] = useState<ICondition[]>([]);
  const [selColorCriteria, setSelColorCriteria] = useState<string>('Airline');
  const [tab, setTab] = useState(1);
  const [tabSecondary, setTabSecondary] = useState(0);
  const [chartData, setChartData] = useState<{ x: string[]; data: IChartData }>();
  const refWidth = useRef(null);
  const { width } = useResize(refWidth);
  const userId = 'test';
  const chartDataCurrent = chartData?.data?.[selColorCriteria];
  const barColorsCurrent = !chartDataCurrent ? [] : String(chartDataCurrent?.length) in BarColors ? BarColors[String(chartDataCurrent?.length)] : BarColors.DEFAULT;
  const loadFlightSchedule = useCallback(
    (first_load: boolean = true) => {
      getFlightSchedule({
        first_load,
        user_id: userId,
        date: moment(selDate).format('YYYY-MM-DD'),
        airport: selAirport,
        condition: selConditions,
      }).then(({ data }) => {
        console.log(data);
        if (data?.add_conditions) {
          const logicItems: IDropdownItem[] = [{ id: 'AND', text: 'AND' }];
          const criteriaItems: IDropdownItem[] = [];
          const operatorItems: { [criteriaId: string]: IOperatorItem[] } = {};
          const valueItems: { [criteriaId: string]: IDropdownItem[] } = {};
          for (const criteriaCur of data?.add_conditions) {
            const idCur = criteriaCur.name;
            criteriaItems.push({ id: idCur, text: criteriaCur.name });
            if (criteriaCur.operator === '=')
              operatorItems[idCur] = [{ id: 'O1', text: '=', multiSelect: false }];
            else if (criteriaCur.operator === 'is in')
              operatorItems[idCur] = [{ id: 'O2', text: 'is in', multiSelect: true }];
            valueItems[idCur] = [];
            for (const valueCur of criteriaCur.value) {
              valueItems[idCur].push({ id: valueCur, text: valueCur });
            }
          }
          setConditions({ logicItems, criteriaItems, operatorItems, valueItems });
        }
        if (data?.chart_x_data && data?.chart_y_data) {
          setChartData({
            x: data?.chart_x_data,
            data: data?.chart_y_data,
          });
        }
      });
    },
    [userId, selDate, selAirport, selConditions]
  );
  return (
    <RootLayoutDefault>
      <ContentsHeader text="Simulation" />
      <div ref={refWidth} className="mt-[15px] flex justify-between">
        <dl className="sub-title">
          <dt>Simulation for ICN T1 Peak Day (2025).</dt>
          <dd>
            ICN_T1_Scenario_Rev2.project <span>2hours before</span>
          </dd>
        </dl>
        <div className="mt-[15px] flex items-center gap-[10px]">
          <Button
            className="btn-md btn-default"
            icon={<img src="/image/ico-arrow-left.svg" alt="" />}
            text="Back to Scenario List"
            onClick={() => {}}
          />
          <Button
            className="btn-md btn-primary"
            icon={<img src="/image/ico-save.svg" alt="" />}
            text="Save"
            onClick={() => {}}
          />
        </div>
      </div>
      <TabDefault
        tabCount={tabs.length}
        currentTab={tab}
        tabs={tabs.map((tab) => ({ text: tab.text, number: tab.number || 0 }))}
        className={`mt-[40px] grid-cols-7`}
        onTabChange={(tabIndex) => setTab(tabIndex)}
      />
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
                onSelect={(date) => { if(date) setSelDate(date); }}
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
            <p className="text-lg font-semibold">Total: 287 Flights</p>
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
                ?.sort((a, b) => a.order - b.order)
                .map((item, index) => {
                  return {
                    x: chartData.x,
                    y: item.y,
                    name: item.name,
                    type: 'bar',
                    marker: {
                      color: barColorsCurrent[index],
                      opacity: chartDataCurrent?.length < 5 ? 1 : 0.75,
                    },
                  };
                })}
              layout={{
                width,
                height: 500,
                margin: {
                  l: 10,
                  r: 10,
                },
                barmode: 'overlay',
                legend: {
                  x: 1,
                  y: 1.3,
                  xanchor: 'right',
                  yanchor: 'top',
                  orientation: 'h',
                },
                bargap: 0.4,
                barcornerradius: 7,
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
    </RootLayoutDefault>
  );
};

export default DirectUploadDone;
