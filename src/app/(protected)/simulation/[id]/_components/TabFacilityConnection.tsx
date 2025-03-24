'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  faAngleLeft,
  faAngleRight,
  faAngleUp,
  faArrowRight,
  faMinus,
  faPlus,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import ProcedureTable, {
  ProcedureTableRow,
} from '@/app/(protected)/simulation/[id]/_components/ProcedureTable';
import { useSimulationMetadata, useSimulationStore } from '@/stores/simulation';
import Button from '@/components/Button';
import Checkbox from '@/components/Checkbox';
import ContentsHeader from '@/components/ContentsHeader';
import CustomSelectBox from '@/components/CustomSelectBox';
import Input from '@/components/Input';
import SelectBox from '@/components/SelectBox';
import TabDefault from '@/components/TabDefault';
import Tooltip from '@/components/Tooltip';

interface NodeInfo {
  text: string;
  number?: number;
}

const TableTypes = ['Check-box', 'Probability (%)']; // ['Check-box', 'Distance (m)', 'Ratio (n:n)', 'Probability (%)', 'File Upload'];

const tableDataTmp = [
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

const attributeData = [
  {
    id: 1,
    category: 'Zone A',
    dg1: '10%',
    dg2: '35%',
    dg3: '55%',
    dg4: '10%',
    dg5: '10%',
    dg6: '10%',
  },
  {
    id: 2,
    category: 'Zone B',
    dg1: '10%',
    dg2: '35%',
    dg3: '55%',
    dg4: '10%',
    dg5: '10%',
    dg6: '10%',
  },
  {
    id: 3,
    category: 'Zone C',
    dg1: '10%',
    dg2: '35%',
    dg3: '55%',
    dg4: '10%',
    dg5: '10%',
    dg6: '10%',
  },
  {
    id: 4,
    category: 'Zone D',
    dg1: '10%',
    dg2: '35%',
    dg3: '55%',
    dg4: '10%',
    dg5: '10%',
    dg6: '10%',
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

type Row = {
  airline: string;
  checkboxes: boolean[];
};

interface FacilityConnectionProps {
  visible: boolean;
}

export default function FacilityConnection({ visible }: FacilityConnectionProps) {
  const { setPassengerAttr, passenger_attr } = useSimulationMetadata();
  const { tabIndex, setTabIndex } = useSimulationStore();

  const [procedureIndex, setProcedureIndex] = useState(0);
  const [addConditionsVisible, setAddConditionsVisible] = useState(false);

  const [tableType, setTableType] = useState(TableTypes[0]);
  const [tableData, setTableData] =
    useState<Array<{ title?: string; header: string[]; data: ProcedureTableRow[]; waitTime: string; }>>();

  useEffect(() => {
    if (passenger_attr?.procedures) {
      setTableData(
        passenger_attr?.procedures?.map((procedure, index) => {
          return {
            title: procedure.name,
            header: procedure.nodes,
            data:
              index > 0
                ? (passenger_attr?.procedures?.[index - 1].nodes.map((name) => {
                    return { name, values: Array(procedure.nodes.length).fill(0) };
                  }) as ProcedureTableRow[])
                : [],
            waitTime: '0',
          };
        })
      );
    }
  }, [passenger_attr]);
  console.log(tableData);

  const [loadingProcessingProcedures, setLoadingProcessingProcedures] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const procedures = [
    ...(passenger_attr?.procedures?.map((item, index) => {
      return {
        text: item.name,
      };
    }) || []),
    { text: 'Passenger Flow Check' },
  ] as NodeInfo[];

  console.log(passenger_attr);

  return !visible ? null : (
    <div>
      <h2 className="title-sm mt-[25px]">Allocate Passenger Attributes to Processing Facilities</h2>
      <TabDefault
        tabCount={procedures.length}
        currentTab={procedureIndex}
        tabs={procedures.map((tab) => ({ text: tab.text, number: tab.number || 0 }))}
        onTabChange={(index) => setProcedureIndex(index)}
        className={`tab-secondary mt-[25px] grid-cols-5`}
      />
      <div className="mt-[30px] flex items-center justify-center gap-[100px]">
        <p className="text-[40px] text-xl font-semibold text-default-800">
          {procedureIndex == 0 ? passenger_attr?.data_connection_criteria : procedures[procedureIndex - 1].text}
        </p>
        <p className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-default-100">
          <FontAwesomeIcon className="nav-icon" size="sm" icon={faArrowRight} />
        </p>
        <p className="text-[40px] text-xl font-semibold text-default-800">{procedures[procedureIndex].text}</p>
      </div>
      {
        !tableData?.[procedureIndex] || procedureIndex < 1 ? null : (
          <div className="add-time mt-[30px]">
            <p className="flex items-center gap-[10px]">
              <span>Add a wait time after completing the previous step *</span>
              <button>
                <Tooltip text={'test'} />
              </button>
            </p>
            <div className="relative mt-[10px]">
              <Input
                type="number"
                placeholder=""
                value={tableData[procedureIndex].waitTime || '0'}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTableData(tableData.map((val, idx) => (idx == procedureIndex ? { ...val, waitTime: Math.max(Number(e.target.value), 0).toString() } : val)))}
                className="input-rounded"
              />
              {/* <p className="absolute right-[0px] top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-[20px]">
                <button className="text-default-500">
                  <FontAwesomeIcon className="nav-icon" size="sm" icon={faMinus} />
                </button>
                <button className="text-default-500">
                  <FontAwesomeIcon className="nav-icon" size="sm" icon={faPlus} />
                </button>
              </p> */}
            </div>
          </div>  
        )
      }
      <div className="mt-[30px] flex items-center gap-[10px] rounded-md border border-gray-200 bg-gray-50 p-[15px]">
        <Checkbox
          id="add-conditions"
          label=""
          checked={addConditionsVisible}
          onChange={() => setAddConditionsVisible(!addConditionsVisible)}
          className="checkbox-toggle"
        />
        <dl>
          <dt className="font-semibold">Add Conditions</dt>
          <dd className="text-sm font-medium text-default-400">
            Enable the option to set conditions for filtering passenger data.{' '}
          </dd>
        </dl>
      </div>
      {addConditionsVisible ? (
        <>
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
                          <Tooltip text={'test'} />
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
                          <Tooltip text={'test'} />
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
                          <Tooltip text={'test'} />
                        </button>
                      </dt>
                      <dd>
                        <SelectBox options={['KE', 'OZ', 'Jin Air']} />
                      </dd>
                    </dl>
                  </div>
                  <button>
                    <Image width={16} height={16} src="/image/ico-delete-line.svg" alt="" />
                  </button>
                </div>
                <div className="select-grid">
                  <div className="select-list">
                    <p className="mt-[40px] text-xl font-medium text-default-800">AND</p>
                    <dl>
                      <dt>
                        Criteria <span className="text-accent-600">*</span>
                        <button>
                          <Tooltip text={'test'} />
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
                          <Tooltip text={'test'} />
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
                          <Tooltip text={'test'} />
                        </button>
                      </dt>
                      <dd>
                        <CustomSelectBox options={['First', 'Business', 'Economy']} className="select-lg" />
                      </dd>
                    </dl>
                  </div>
                  <button>
                    <Image width={16} height={16} src="/image/ico-delete-line.svg" alt="" />
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
                          <Tooltip text={'test'} />
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
                          <Tooltip text={'test'} />
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
                          <Tooltip text={'test'} />
                        </button>
                      </dt>
                      <dd>
                        <SelectBox options={['KE', 'OZ', 'Jin Air']} />
                      </dd>
                    </dl>
                  </div>
                  <button>
                    <Image width={16} height={16} src="/image/ico-delete-line.svg" alt="" />
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
                        {tableDataTmp.map((flight) => (
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
                          <Tooltip text={'test'} />
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
                          <Tooltip text={'test'} />
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
                          <Tooltip text={'test'} />
                        </button>
                      </dt>
                      <dd>
                        <SelectBox options={['KE', 'OZ', 'Jin Air']} />
                      </dd>
                    </dl>
                  </div>
                  <button>
                    <Image width={16} height={16} src="/image/ico-delete-line.svg" alt="" />
                  </button>
                </div>
                <div className="select-grid">
                  <div className="select-list">
                    <p className="mt-[40px] text-xl font-medium text-default-800">AND</p>
                    <dl>
                      <dt>
                        Criteria <span className="text-accent-600">*</span>
                        <button>
                          <Tooltip text={'test'} />
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
                          <Tooltip text={'test'} />
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
                          <Tooltip text={'test'} />
                        </button>
                      </dt>
                      <dd>
                        <CustomSelectBox options={['First', 'Business', 'Economy']} className="select-lg" />
                      </dd>
                    </dl>
                  </div>
                  <button>
                    <Image width={16} height={16} src="/image/ico-delete-line.svg" alt="" />
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
                          <Tooltip text={'test'} />
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
                          <Tooltip text={'test'} />
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
                          <Tooltip text={'test'} />
                        </button>
                      </dt>
                      <dd>
                        <SelectBox options={['KE', 'OZ', 'Jin Air']} />
                      </dd>
                    </dl>
                  </div>
                  <button>
                    <Image width={16} height={16} src="/image/ico-delete-line.svg" alt="" />
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
                        {tableDataTmp.map((flight) => (
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
        </>
      ) : null}
      <div className="mt-[20px] flex items-center justify-between">
        <p className="tex-[40px] pl-[30px] text-xl font-medium text-default-800">
          {addConditionsVisible ? 'ELSE' : ''}
        </p>
        <div className="w-[340px]">
          <SelectBox
            options={TableTypes}
            selectedOption={tableType}
            onSelectedOption={(val) => setTableType(val)}
          />
        </div>
      </div>
      {/* <div className="mt-[30px] flex items-center justify-center">
        <button className="flex h-[50px] w-full items-center justify-center gap-[10px] text-lg font-medium text-default-300 hover:text-default-700">
          <FontAwesomeIcon className="nav-icon" size="sm" icon={faAngleUp} />
          Hide Table
        </button>
      </div> */}
      <div className="table-wrap mt-[10px] overflow-hidden rounded-md border border-default-300">
        {!tableData?.[procedureIndex] ? null : (
          <ProcedureTable
            type={tableType == TableTypes[0] ? 'checkbox' : tableType == TableTypes[1] ? 'probability' : 'text'}
            title={tableData[procedureIndex].title}
            header={tableData[procedureIndex].header}
            data={tableData[procedureIndex].data}
            onDataChange={(data) => {
              setTableData(tableData.map((val, idx) => (idx == procedureIndex ? { ...val, data } : val)));
            }}
          />
        )}
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
}
