'use client';

import React, { useEffect, useState } from 'react';
import { faAngleLeft, faAngleRight, faAngleUp, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from '@/components/Button';
import Checkbox from '@/components/Checkbox';
import ContentsHeader from '@/components/ContentsHeader';
import CustomSelectBox from '@/components/CustomSelectBox';
import SelectBox from '@/components/SelectBox';
import TabDefault from '@/components/TabDefault';

const Tooltip = (props: any) => {
  return <div></div>;
};

type Row = {
  airline: string;
  checkboxes: boolean[];
};

const FacilityConnection: React.FC = () => {
  const [addConditions, setAddConditions] = useState(true);
  const tabs: { text: string; number?: number }[] = [
    { text: 'Scenario Overview' },
    { text: 'Flight Schedule' },
    { text: 'Passenger Schedule' },
    { text: 'Processing Procedures' },
    { text: 'Facility Connection', number: 2 },
    { text: 'Facility Information' },
    { text: 'Simulation' },
  ];
  const tabsSecondary: { text: string; number?: number }[] = [
    { text: 'Check-In' },
    { text: 'Boarding Pass', number: 2 },
    { text: 'Security' },
    { text: 'Passport' },
    { text: 'Passenger Flow Check' },
  ];
  const tableData = [
    {
      id: 1,
      Airline: 'RS',
      Method: 'RS',
      e: 'RS',
      f: 'RS',
    },
    {
      id: 2,
      Airline: 'TW',
      Method: 'TW',
      e: 'TW',
      f: 'TW',
    },
    {
      id: 3,
      Airline: 'BX',
      Method: 'BX',
      e: 'BX',
      f: 'BX',
    },
    {
      id: 4,
      Airline: 'ZE',
      Method: 'ZE',
      e: 'ZE',
      f: 'ZE',
    },
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
      {/* 컨디션 블럭 */}
      <div className="conditions-block mt-[20px] flex flex-col gap-[20px] pb-[30px]">
        <div className="schedule-block">
          <div className="schedule-top">
            <div className="select-grid">
              <div className="select-list">
                <p className="mt-[40px] text-xl font-medium text-default-800">IF</p>
                <dl>
                  <dt>
                    Criteria <span className="text-accent-600">*</span>
                    <button>
                      <Tooltip
                        title={
                          <React.Fragment>
                            <strong>Tool-tip Title</strong>
                            <br />
                            The average or top n% of the total queue count experienced by one passenger across
                            all processes.
                          </React.Fragment>
                        }
                        placement="right"
                        arrow
                      >
                        <img src="/image/ico-help.svg" alt="tooltip" />
                      </Tooltip>
                    </button>
                  </dt>
                  <dd>
                    <SelectBox options={['Airline_Code', 'Airline_Name']} />
                  </dd>
                </dl>
                <dl>
                  <dt>
                    Operator <span className="text-accent-600">*</span>
                    <button>
                      <Tooltip
                        title={
                          <React.Fragment>
                            <strong>Tool-tip Title</strong>
                            <br />
                            The average or top n% of the total queue count experienced by one passenger across
                            all processes.
                          </React.Fragment>
                        }
                        placement="right"
                        arrow
                      >
                        <img src="/image/ico-help.svg" alt="tooltip" />
                      </Tooltip>
                    </button>
                  </dt>
                  <dd>
                    <SelectBox options={['<', '>', '=']} />
                  </dd>
                </dl>
                <dl>
                  <dt>
                    Value <span className="text-accent-600">*</span>
                    <button>
                      <Tooltip
                        title={
                          <React.Fragment>
                            <strong>Tool-tip Title</strong>
                            <br />
                            The average or top n% of the total queue count experienced by one passenger across
                            all processes.
                          </React.Fragment>
                        }
                        placement="right"
                        arrow
                      >
                        <img src="/image/ico-help.svg" alt="tooltip" />
                      </Tooltip>
                    </button>
                  </dt>
                  <dd>
                    <SelectBox options={['KE', 'OZ', 'Jin Air']} />
                  </dd>
                </dl>
              </div>
              <button>
                <img src="/image/ico-delete-line.svg" alt="" />
              </button>
            </div>
            <div className="select-grid">
              <div className="select-list">
                <p className="mt-[40px] text-xl font-medium text-default-800">AND</p>
                <dl>
                  <dt>
                    Criteria <span className="text-accent-600">*</span>
                    <button>
                      <Tooltip
                        title={
                          <React.Fragment>
                            <strong>Tool-tip Title</strong>
                            <br />
                            The average or top n% of the total queue count experienced by one passenger across
                            all processes.
                          </React.Fragment>
                        }
                        placement="right"
                        arrow
                      >
                        <img src="/image/ico-help.svg" alt="tooltip" />
                      </Tooltip>
                    </button>
                  </dt>
                  <dd>
                    <SelectBox options={['Seat Class', 'option2', 'option3']} />
                  </dd>
                </dl>
                <dl>
                  <dt>
                    Operator <span className="text-accent-600">*</span>
                    <button>
                      <Tooltip
                        title={
                          <React.Fragment>
                            <strong>Tool-tip Title</strong>
                            <br />
                            The average or top n% of the total queue count experienced by one passenger across
                            all processes.
                          </React.Fragment>
                        }
                        placement="right"
                        arrow
                      >
                        <img src="/image/ico-help.svg" alt="tooltip" />
                      </Tooltip>
                    </button>
                  </dt>
                  <dd>
                    <SelectBox options={['is in']} />
                  </dd>
                </dl>
                <dl>
                  <dt>
                    Value <span className="text-accent-600">*</span>
                    <button>
                      <Tooltip
                        title={
                          <React.Fragment>
                            <strong>Tool-tip Title</strong>
                            <br />
                            The average or top n% of the total queue count experienced by one passenger across
                            all processes.
                          </React.Fragment>
                        }
                        placement="right"
                        arrow
                      >
                        <img src="/image/ico-help.svg" alt="tooltip" />
                      </Tooltip>
                    </button>
                  </dt>
                  <dd>
                    <CustomSelectBox options={['First', 'Business', 'Economy']} className="select-lg" />
                  </dd>
                </dl>
              </div>
              <button>
                <img src="/image/ico-delete-line.svg" alt="" />
              </button>
            </div>
            <div className="flex items-center justify-center">
              <button className="text-lg font-medium text-accent-600 hover:text-accent-700">
                + Add Condition
              </button>
            </div>
          </div>
          <div className="schedule-bottom">
            <div className="select-grid">
              <div className="select-list">
                <p className="mt-[40px] text-xl font-medium text-default-800">THEN</p>
                <dl>
                  <dt>
                    Criteria <span className="text-accent-600">*</span>
                    <button>
                      <Tooltip
                        title={
                          <React.Fragment>
                            <strong>Tool-tip Title</strong>
                            <br />
                            The average or top n% of the total queue count experienced by one passenger across
                            all processes.
                          </React.Fragment>
                        }
                        placement="right"
                        arrow
                      >
                        <img src="/image/ico-help.svg" alt="tooltip" />
                      </Tooltip>
                    </button>
                  </dt>
                  <dd>
                    <SelectBox options={['Airline_Code', 'Airline_Name']} />
                  </dd>
                </dl>
                <dl>
                  <dt>
                    Operator <span className="text-accent-600">*</span>
                    <button>
                      <Tooltip
                        title={
                          <React.Fragment>
                            <strong>Tool-tip Title</strong>
                            <br />
                            The average or top n% of the total queue count experienced by one passenger across
                            all processes.
                          </React.Fragment>
                        }
                        placement="right"
                        arrow
                      >
                        <img src="/image/ico-help.svg" alt="tooltip" />
                      </Tooltip>
                    </button>
                  </dt>
                  <dd>
                    <SelectBox options={['<', '>', '=']} />
                  </dd>
                </dl>
                <dl>
                  <dt>
                    Value <span className="text-accent-600">*</span>
                    <button>
                      <Tooltip
                        title={
                          <React.Fragment>
                            <strong>Tool-tip Title</strong>
                            <br />
                            The average or top n% of the total queue count experienced by one passenger across
                            all processes.
                          </React.Fragment>
                        }
                        placement="right"
                        arrow
                      >
                        <img src="/image/ico-help.svg" alt="tooltip" />
                      </Tooltip>
                    </button>
                  </dt>
                  <dd>
                    <SelectBox options={['KE', 'OZ', 'Jin Air']} />
                  </dd>
                </dl>
              </div>
              <button>
                <img src="/image/ico-delete-line.svg" alt="" />
              </button>
            </div>
            <div className="table-import hidden">
              <div className="mt-[30px] flex items-center justify-center">
                <button className="flex h-[50px] w-full items-center justify-center gap-[10px] text-lg font-medium text-default-300 hover:text-default-700">
                  <FontAwesomeIcon className="nav-icon" size="sm" icon={faAngleUp} />
                  Hide Table
                </button>
              </div>
              <div className="table-wrap mt-[10px] overflow-hidden rounded-md border border-default-300">
                <table className="table-secondary">
                  <thead>
                    <tr>
                      <th className="w-[100px]">Airline</th>
                      <th className="">Check-In Method</th>
                      <th className="">E</th>
                      <th className="">F</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.map((flight) => (
                      <tr key={flight.id}>
                        <td className="text-left">{flight.Airline}</td>
                        <td className="text-center">{flight.Method}</td>
                        <td className="text-center">{flight.e}</td>
                        <td className="text-center">{flight.f}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <div className="schedule-block">
          <div className="schedule-top">
            <div className="select-grid">
              <div className="select-list">
                <p className="mt-[40px] text-xl font-medium text-default-800">IF</p>
                <dl>
                  <dt>
                    Criteria <span className="text-accent-600">*</span>
                    <button>
                      <Tooltip
                        title={
                          <React.Fragment>
                            <strong>Tool-tip Title</strong>
                            <br />
                            The average or top n% of the total queue count experienced by one passenger across
                            all processes.
                          </React.Fragment>
                        }
                        placement="right"
                        arrow
                      >
                        <img src="/image/ico-help.svg" alt="tooltip" />
                      </Tooltip>
                    </button>
                  </dt>
                  <dd>
                    <SelectBox options={['Airline_Code', 'Airline_Name']} />
                  </dd>
                </dl>
                <dl>
                  <dt>
                    Operator <span className="text-accent-600">*</span>
                    <button>
                      <Tooltip
                        title={
                          <React.Fragment>
                            <strong>Tool-tip Title</strong>
                            <br />
                            The average or top n% of the total queue count experienced by one passenger across
                            all processes.
                          </React.Fragment>
                        }
                        placement="right"
                        arrow
                      >
                        <img src="/image/ico-help.svg" alt="tooltip" />
                      </Tooltip>
                    </button>
                  </dt>
                  <dd>
                    <SelectBox options={['<', '>', '=']} />
                  </dd>
                </dl>
                <dl>
                  <dt>
                    Value <span className="text-accent-600">*</span>
                    <button>
                      <Tooltip
                        title={
                          <React.Fragment>
                            <strong>Tool-tip Title</strong>
                            <br />
                            The average or top n% of the total queue count experienced by one passenger across
                            all processes.
                          </React.Fragment>
                        }
                        placement="right"
                        arrow
                      >
                        <img src="/image/ico-help.svg" alt="tooltip" />
                      </Tooltip>
                    </button>
                  </dt>
                  <dd>
                    <SelectBox options={['KE', 'OZ', 'Jin Air']} />
                  </dd>
                </dl>
              </div>
              <button>
                <img src="/image/ico-delete-line.svg" alt="" />
              </button>
            </div>
            <div className="select-grid">
              <div className="select-list">
                <p className="mt-[40px] text-xl font-medium text-default-800">AND</p>
                <dl>
                  <dt>
                    Criteria <span className="text-accent-600">*</span>
                    <button>
                      <Tooltip
                        title={
                          <React.Fragment>
                            <strong>Tool-tip Title</strong>
                            <br />
                            The average or top n% of the total queue count experienced by one passenger across
                            all processes.
                          </React.Fragment>
                        }
                        placement="right"
                        arrow
                      >
                        <img src="/image/ico-help.svg" alt="tooltip" />
                      </Tooltip>
                    </button>
                  </dt>
                  <dd>
                    <SelectBox options={['Seat Class', 'option2', 'option3']} />
                  </dd>
                </dl>
                <dl>
                  <dt>
                    Operator <span className="text-accent-600">*</span>
                    <button>
                      <Tooltip
                        title={
                          <React.Fragment>
                            <strong>Tool-tip Title</strong>
                            <br />
                            The average or top n% of the total queue count experienced by one passenger across
                            all processes.
                          </React.Fragment>
                        }
                        placement="right"
                        arrow
                      >
                        <img src="/image/ico-help.svg" alt="tooltip" />
                      </Tooltip>
                    </button>
                  </dt>
                  <dd>
                    <SelectBox options={['is in']} />
                  </dd>
                </dl>
                <dl>
                  <dt>
                    Value <span className="text-accent-600">*</span>
                    <button>
                      <Tooltip
                        title={
                          <React.Fragment>
                            <strong>Tool-tip Title</strong>
                            <br />
                            The average or top n% of the total queue count experienced by one passenger across
                            all processes.
                          </React.Fragment>
                        }
                        placement="right"
                        arrow
                      >
                        <img src="/image/ico-help.svg" alt="tooltip" />
                      </Tooltip>
                    </button>
                  </dt>
                  <dd>
                    <CustomSelectBox options={['First', 'Business', 'Economy']} className="select-lg" />
                  </dd>
                </dl>
              </div>
              <button>
                <img src="/image/ico-delete-line.svg" alt="" />
              </button>
            </div>
            <div className="flex items-center justify-center">
              <button className="text-lg font-medium text-accent-600 hover:text-accent-700">
                + Add Condition
              </button>
            </div>
          </div>
          <div className="schedule-bottom">
            <div className="select-grid">
              <div className="select-list">
                <p className="mt-[40px] text-xl font-medium text-default-800">THEN</p>
                <dl>
                  <dt>
                    Criteria <span className="text-accent-600">*</span>
                    <button>
                      <Tooltip
                        title={
                          <React.Fragment>
                            <strong>Tool-tip Title</strong>
                            <br />
                            The average or top n% of the total queue count experienced by one passenger across
                            all processes.
                          </React.Fragment>
                        }
                        placement="right"
                        arrow
                      >
                        <img src="/image/ico-help.svg" alt="tooltip" />
                      </Tooltip>
                    </button>
                  </dt>
                  <dd>
                    <SelectBox options={['Airline_Code', 'Airline_Name']} />
                  </dd>
                </dl>
                <dl>
                  <dt>
                    Operator <span className="text-accent-600">*</span>
                    <button>
                      <Tooltip
                        title={
                          <React.Fragment>
                            <strong>Tool-tip Title</strong>
                            <br />
                            The average or top n% of the total queue count experienced by one passenger across
                            all processes.
                          </React.Fragment>
                        }
                        placement="right"
                        arrow
                      >
                        <img src="/image/ico-help.svg" alt="tooltip" />
                      </Tooltip>
                    </button>
                  </dt>
                  <dd>
                    <SelectBox options={['<', '>', '=']} />
                  </dd>
                </dl>
                <dl>
                  <dt>
                    Value <span className="text-accent-600">*</span>
                    <button>
                      <Tooltip
                        title={
                          <React.Fragment>
                            <strong>Tool-tip Title</strong>
                            <br />
                            The average or top n% of the total queue count experienced by one passenger across
                            all processes.
                          </React.Fragment>
                        }
                        placement="right"
                        arrow
                      >
                        <img src="/image/ico-help.svg" alt="tooltip" />
                      </Tooltip>
                    </button>
                  </dt>
                  <dd>
                    <SelectBox options={['KE', 'OZ', 'Jin Air']} />
                  </dd>
                </dl>
              </div>
              <button>
                <img src="/image/ico-delete-line.svg" alt="" />
              </button>
            </div>
            <div className="table-import">
              <div className="mt-[30px] flex items-center justify-center">
                <button className="flex h-[50px] w-full items-center justify-center gap-[10px] text-lg font-medium text-default-300 hover:text-default-700">
                  <FontAwesomeIcon className="nav-icon" size="sm" icon={faAngleUp} />
                  Hide Table
                </button>
              </div>
              <div className="table-wrap mt-[10px] overflow-hidden rounded-md border border-default-300">
                <table className="table-secondary">
                  <thead>
                    <tr>
                      <th className="w-[100px]">Airline</th>
                      <th className="">Check-In Method</th>
                      <th className="">E</th>
                      <th className="">F</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.map((flight) => (
                      <tr key={flight.id}>
                        <td className="text-left">{flight.Airline}</td>
                        <td className="text-center">{flight.Method}</td>
                        <td className="text-center">{flight.e}</td>
                        <td className="text-center">{flight.f}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center rounded-md border border-default-200 bg-default-100">
          <button className="h-[60px] w-full text-lg font-medium text-accent-600 hover:text-accent-700">
            + Add Logic
          </button>
        </div>
      </div>

      <div className="mt-[20px] flex items-center justify-between">
        <p className="tex-[40px] pl-[30px] text-xl font-medium text-default-800">ELSE</p>
        <div className="w-[340px]">
          <SelectBox options={['Check-box', 'Distance (m)', 'Ratio (n:n)', 'Probability (%)', 'File Upload']} />
        </div>
      </div>
      <div className="mt-[30px] flex items-center justify-center">
        <button className="flex h-[50px] w-full items-center justify-center gap-[10px] text-lg font-medium text-default-300 hover:text-default-700">
          <FontAwesomeIcon className="nav-icon" size="sm" icon={faAngleUp} />
          Hide Table
        </button>
      </div>
      <div className="table-wrap mt-[10px] overflow-hidden rounded-md border border-default-300">
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
          {/* ● Please make sure to fill in all fields without leaving any blank rows! */}
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
};

export default FacilityConnection;
