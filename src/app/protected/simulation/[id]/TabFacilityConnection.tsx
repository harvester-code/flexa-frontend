'use client';

import React, { useEffect, useState } from 'react';
import { faAngleLeft, faAngleRight, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from '@/components/Button';
import Checkbox from '@/components/Checkbox';
import ContentsHeader from '@/components/ContentsHeader';
import SelectBox from '@/components/SelectBox';
import TabDefault from '@/components/TabDefault';

type Row = {
  airline: string;
  checkboxes: boolean[];
};

export default function TabFacilityConnection() {
  const [addConditions, setAddConditions] = useState(false);
  const tabsSecondary: { text: string; number?: number }[] = [
    { text: 'Check-In' },
    { text: 'Boarding Pass', number: 2 },
    { text: 'Security' },
    { text: 'Passport' },
    { text: 'Passenger Flow Check' },
  ];

  const rows: Row[] = [
    { airline: 'OZ', checkboxes: [] },
    { airline: '7C', checkboxes: [] },
    { airline: 'JL', checkboxes: [] },
    { airline: 'BX', checkboxes: [] },
    { airline: 'RS', checkboxes: [] },
    { airline: 'SQ', checkboxes: [] },
    { airline: 'TG', checkboxes: [] },
    { airline: 'VN', checkboxes: [] },
  ];

  const [checkboxStates, setCheckboxStates] = useState<boolean[][]>([]);

  useEffect(() => {
    const initialCheckboxStates = Array.from({ length: rows.length }, () => Array(19).fill(false));
    setCheckboxStates(initialCheckboxStates);
  }, [rows.length]);

  const handleCheckboxChange = (rowIndex: number, colIndex: number) => {
    setCheckboxStates((prevStates) => {
      const newStates = prevStates.map((row, rIndex) => {
        if (rIndex === rowIndex) {
          if (colIndex === 0) {
            // Airline 체크박스를 클릭한 경우, 해당 행의 모든 체크박스를 선택/해제
            const isChecked = !row[0];
            return row.map(() => isChecked);
          } else {
            // 개별 체크박스를 클릭한 경우, 해당 체크박스만 선택/해제
            return row.map((col, cIndex) => (cIndex === colIndex ? !col : col));
          }
        }
        return row;
      });
      return newStates;
    });
  };

  // rows 배열의 각 항목에 초기 체크박스 상태를 할당
  rows.forEach((row, index) => {
    row.checkboxes = checkboxStates[index]?.slice(1) || [];
  });

  return (
    <div>
      <h2 className="title-sm mt-[25px]">Allocate Passenger Attributes to Processing Facilities</h2>
      <TabDefault
        tabCount={5}
        currentTab={1}
        tabs={tabsSecondary.map((tab) => ({ text: tab.text, number: tab.number || 0 }))}
        className={`tab-secondary mt-[25px] grid-cols-5`}
      />
      <div className="mt-[30px] flex items-center justify-center gap-[100px]">
        <p className="text-[40px] text-xl font-semibold text-default-800">Airline</p>
        <p className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-default-100">
          <FontAwesomeIcon className="nav-icon" size="sm" icon={faArrowRight} />
        </p>
        <p className="text-[40px] text-xl font-semibold text-default-800">Check-In</p>
      </div>

      <div className="mt-[30px] flex items-center gap-[10px] rounded-md border border-gray-200 bg-gray-50 p-[15px]">
        <Checkbox
          id="add-conditions"
          label=""
          checked={addConditions}
          onChange={() => setAddConditions(!addConditions)}
          className="checkbox-toggle"
        />
        <dl>
          <dt className="font-semibold">Add Conditions</dt>
          <dd className="text-sm font-medium text-default-400">
            Enable the option to set conditions for filtering passenger data.{' '}
          </dd>
        </dl>
      </div>
      <div className="mt-[20px] flex justify-end">
        <div className="w-[340px]">
          <SelectBox options={['Check-box', 'Distance (m)', 'Ratio (n:n)', 'Probability (%)', 'File Upload']} />
        </div>
      </div>
      <div className="table-wrap mt-[20px] overflow-hidden rounded-md border border-default-300">
        <table className="table-secondary">
          <thead>
            <tr>
              <th className="w-[90px] text-left">Airline</th>
              <th className="">A</th>
              <th className="">B</th>
              <th className="">C</th>
              <th className="">D</th>
              <th className="">E</th>
              <th className="">F</th>
              <th className="">G</th>
              <th className="">H</th>
              <th className="">I</th>
              <th className="">J</th>
              <th className="">K</th>
              <th className="">L</th>
              <th className="">M</th>
              <th className="">N</th>
              <th className="">Mobile</th>
              <th className="">Self</th>
              <th className="">CAT</th>
              <th className="">Port</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="text-center">
                <td>
                  <div className="flex items-center justify-center gap-[10px]">
                    <Checkbox
                      label={row.airline}
                      id={`check-all-${rowIndex}`}
                      checked={checkboxStates[rowIndex]?.[0] || false}
                      onChange={() => handleCheckboxChange(rowIndex, 0)}
                      className="checkbox text-sm"
                    />
                  </div>
                </td>
                {row.checkboxes.map((_, colIndex) => (
                  <td key={colIndex + 1}>
                    <div className="flex items-center justify-center gap-[10px]">
                      <Checkbox
                        label=""
                        id={`check-${rowIndex}-${colIndex + 1}`}
                        checked={checkboxStates[rowIndex]?.[colIndex + 1] || false}
                        onChange={() => handleCheckboxChange(rowIndex, colIndex + 1)}
                        className="checkbox text-sm"
                      />
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-[20px] flex items-center justify-between pr-[20px]">
        <p className="font-medium text-warning">
          ● Please make sure to fill in all fields without leaving any blank rows!
        </p>
        <Button className="btn-md btn-tertiary" text="Apply" onClick={() => {}} />
      </div>
      <div className="mt-[30px] flex justify-between">
        <button className="btn-md btn-default btn-rounded w-[210px] justify-between">
          <FontAwesomeIcon className="nav-icon" size="sm" icon={faAngleLeft} />
          <span className="flex flex-grow items-center justify-center">Filght Schedule</span>
        </button>
        <button className="btn-md btn-default btn-rounded w-[210px] justify-between" disabled>
          <span className="flex flex-grow items-center justify-center">Processing Procedures</span>
          <FontAwesomeIcon className="nav-icon" size="sm" icon={faAngleRight} />
        </button>
      </div>
    </div>
  );
}
