'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { faAngleDown, faAngleLeft, faAngleRight, faAngleUp, faCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from '@/components/Button';
import ContentsHeader from '@/components/ContentsHeader';
import CustomSelectBox from '@/components/CustomSelectBox';
import Input from '@/components/Input';
import SelectBox from '@/components/SelectBox';
import TabDefault from '@/components/TabDefault';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip';

const AppliedPassengerAttributes: React.FC = () => {
  const [selColorCriteria, setSelColorCriteria] = useState<string>('Airline');
  const [columValue, setColumValue] = useState('Yes, No');
  const chartData = null;
  const tabs: { text: string; number?: number }[] = [
    { text: 'Scenario Overview' },
    { text: 'Flight Schedule' },
    { text: 'Passenger Schedule' },
    { text: 'Processing Procedures' },
    { text: 'Facility Connection', number: 22 },
    { text: 'Facility Information' },
    { text: 'Simulation' },
  ];
  const attributeData = [
    {
      id: 1,
      category: 'Asiana Airlines',
      yes: '10%',
      no: '90%',
    },
    {
      id: 2,
      category: 'Jeju Airlines',
      yes: '10%',
      no: '90%',
    },
    {
      id: 3,
      category: 'Tway Airlines',
      yes: '10%',
      no: '90%',
    },
    {
      id: 4,
      category: 'Singapore Airlines',
      yes: '10%',
      no: '90%',
    },
  ];
  const flightData = [
    {
      id: 1,
      tml: 'T1',
      aln: 'OZ',
      flt: 'OZ0011',
      date: '2025-01-01',
      depTime: '18:30',
      gate: '12',
      senior: 'O',
      ckOn: '...',
    },
    {
      id: 2,
      tml: '...',
      aln: '...',
      flt: '...',
      date: '...',
      depTime: '...',
      gate: '...',
      senior: '...',
      ckOn: '...',
    },
    {
      id: 3,
      tml: '...',
      aln: '...',
      flt: '...',
      date: '...',
      depTime: '...',
      gate: '...',
      senior: '...',
      ckOn: '...',
    },
    {
      id: 4,
      tml: '...',
      aln: '...',
      flt: '...',
      date: '...',
      depTime: '...',
      gate: '...',
      senior: '...',
      ckOn: '...',
    },
    {
      id: 5,
      tml: '...',
      aln: '...',
      flt: '...',
      date: '...',
      depTime: '...',
      gate: '...',
      senior: '...',
      ckOn: '...',
    },
    {
      id: '...',
      tml: '...',
      aln: '...',
      flt: '...',
      date: '...',
      depTime: '...',
      gate: '...',
      senior: '...',
      ckOn: '...',
    },
    {
      id: '54,201',
      tml: '...',
      aln: '...',
      flt: '...',
      date: '...',
      depTime: '...',
      gate: '...',
      senior: '...',
      ckOn: '...',
    },
  ];
  const [colorAnchorEl, setColorAnchorEl] = useState<HTMLElement | null>(null);
  const handleColorClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setColorAnchorEl(event.currentTarget);
  };
  const handleColorClose = () => {
    setColorAnchorEl(null);
  };
  return (
    <div>
      <h2 className="title-sm mt-[25px]">Passenger Schedule</h2>
      <p className="mt-[30px] text-[40px] text-xl font-semibold text-default-800">Passenger Show-up Patterns</p>
      <div className="schedule-block mt-[10px]">
        <div className="schedule-top">
          <div className="select-grid">
            <div className="select-list first-line">
              <dl>
                <dt>
                  Criteria <span className="text-accent-600">*</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Image width={16} height={16} src="/image/ico-help.svg" alt="tooltip" />
                      </TooltipTrigger>
                      <TooltipContent side="right" align="center">
                        <React.Fragment>
                          <strong>Tool-tip Title</strong>
                          <br />
                          The average or top n% of the total queue count experienced by one passenger across all
                          processes.
                        </React.Fragment>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </dt>
                <dd>
                  <SelectBox
                    options={['Terminal', 'Terminal-1', 'Terminal-2', 'Terminal-3', 'Terminal-4', 'Terminal-5']}
                  />
                </dd>
              </dl>
              <dl>
                <dt>
                  Operator <span className="text-accent-600">*</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Image width={16} height={16} src="/image/ico-help.svg" alt="tooltip" />
                      </TooltipTrigger>
                      <TooltipContent side="right" align="center">
                        <React.Fragment>
                          <strong>Tool-tip Title</strong>
                          <br />
                          The average or top n% of the total queue count experienced by one passenger across all
                          processes.
                        </React.Fragment>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </dt>
                <dd>
                  <SelectBox options={['<', '>', '=']} />
                </dd>
              </dl>
              <dl>
                <dt>
                  Value <span className="text-accent-600">*</span>
                  <button>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Image width={16} height={16} src="/image/ico-help.svg" alt="tooltip" />
                        </TooltipTrigger>
                        <TooltipContent side="right" align="center">
                          <React.Fragment>
                            <strong>Tool-tip Title</strong>
                            <br />
                            The average or top n% of the total queue count experienced by one passenger across
                            all processes.
                          </React.Fragment>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </button>
                </dt>
                <dd>
                  <SelectBox
                    options={[
                      'Terminal 2',
                      'Terminal 2-1',
                      'Terminal 2-2',
                      'Terminal 2-3',
                      'Terminal 2-4',
                      'Terminal 2-5',
                    ]}
                  />
                </dd>
              </dl>
            </div>
            <button>
              <Image width={16} height={16} src="/image/ico-delete-line.svg" alt="" />
            </button>
          </div>
          <div className="select-grid">
            <div className="select-list">
              <dl>
                <dt>
                  Logic <span className="text-accent-600">*</span>
                  <button>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Image width={16} height={16} src="/image/ico-help.svg" alt="tooltip" />
                        </TooltipTrigger>
                        <TooltipContent side="right" align="center">
                          <React.Fragment>
                            <strong>Tool-tip Title</strong>
                            <br />
                            The average or top n% of the total queue count experienced by one passenger across
                            all processes.
                          </React.Fragment>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </button>
                </dt>
                <dd>
                  <SelectBox options={['AND', 'OR']} />
                </dd>
              </dl>
              <dl>
                <dt>
                  Criteria <span className="text-accent-600">*</span>
                  <button>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Image width={16} height={16} src="/image/ico-help.svg" alt="tooltip" />
                        </TooltipTrigger>
                        <TooltipContent side="right" align="center">
                          <React.Fragment>
                            <strong>Tool-tip Title</strong>
                            <br />
                            The average or top n% of the total queue count experienced by one passenger across
                            all processes.
                          </React.Fragment>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </button>
                </dt>
                <dd>
                  <SelectBox options={['option1', 'option2', 'option3']} />
                </dd>
              </dl>
              <dl>
                <dt>
                  Operator <span className="text-accent-600">*</span>
                  <button>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Image width={16} height={16} src="/image/ico-help.svg" alt="tooltip" />
                        </TooltipTrigger>
                        <TooltipContent side="right" align="center">
                          <React.Fragment>
                            <strong>Tool-tip Title</strong>
                            <br />
                            The average or top n% of the total queue count experienced by one passenger across
                            all processes.
                          </React.Fragment>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
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
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Image width={16} height={16} src="/image/ico-help.svg" alt="tooltip" />
                        </TooltipTrigger>
                        <TooltipContent side="right" align="center">
                          <React.Fragment>
                            <strong>Tool-tip Title</strong>
                            <br />
                            The average or top n% of the total queue count experienced by one passenger across
                            all processes.
                          </React.Fragment>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </button>
                </dt>
                <dd>
                  <CustomSelectBox options={['KE', 'OZ', 'Jin Air']} className="select-lg" />
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
          <div className="flex flex-col gap-[10px]">
            <p className="font-semibold text-default-900">
              Passengers with above characteristics arrive at the airport
            </p>
            <div className="flex items-center gap-[10px] text-xl">
              normally distributed with mean
              <div className="w-[100px]">
                <SelectBox options={['115', '120', '125', '130', '135', '140', '145', '150']} />
              </div>
              variance
              <div className="w-[100px]">
                <SelectBox options={['05', '10', '15', '20', '25', '30', '35', '40']} />
              </div>
              minutes
            </div>
            <p className="text-xl">before the flight departure.</p>
          </div>
        </div>
      </div>
      <div className="mt-[20px] flex items-center justify-center rounded-md border border-default-200 bg-default-100">
        <button className="h-[60px] w-full text-lg font-medium text-accent-600 hover:text-accent-700">
          + Add ELSE IF
        </button>
      </div>
      <div className="schedule-block mt-[20px]">
        <div className="schedule-top">
          <div className="select-grid">
            <div className="select-list">
              <dl>
                <dt>
                  Logic <span className="text-accent-600">*</span>
                  <button>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Image width={16} height={16} src="/image/ico-help.svg" alt="tooltip" />
                        </TooltipTrigger>
                        <TooltipContent side="right" align="center">
                          <React.Fragment>
                            <strong>Tool-tip Title</strong>
                            <br />
                            The average or top n% of the total queue count experienced by one passenger across
                            all processes.
                          </React.Fragment>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </button>
                </dt>
                <dd>
                  <SelectBox options={['ELSE', 'OR']} />
                </dd>
              </dl>
            </div>
          </div>
        </div>
        <div className="schedule-bottom">
          <div className="flex flex-col gap-[10px]">
            <p className="font-semibold text-default-900">Other passengers arrive at the airport</p>
            <div className="flex items-center gap-[10px] text-xl">
              normally distributed with mean
              <div className="w-[100px]">
                <SelectBox options={['115', '120', '125', '130', '135', '140', '145', '150']} />
              </div>
              variance
              <div className="w-[100px]">
                <SelectBox options={['05', '10', '15', '20', '25', '30', '35', '40']} />
              </div>
              minutes
            </div>
            <p className="text-xl">before the flight departure.</p>
          </div>
        </div>
      </div>
      <p className="mt-[20px] flex justify-end px-[20px]">
        <Button
          className="btn-md btn-tertiary"
          iconRight={<FontAwesomeIcon className="nav-icon" size="sm" icon={faCheck} />}
          text="Applied"
          onClick={() => {}}
        />
      </p>
      <div className="mt-[20px] flex items-center justify-end">
        <Button
          className="btn-md btn-primary"
          icon={<Image width={16} height={16} src="/image/ico-write-w.svg" alt="" />}
          text="Input Passenger Attributes"
          onClick={() => {}}
        />
      </div>
      <h2 className="title-sm mt-[25px]">Input Passenger Attributes</h2>
      <div className="attribute-wrap">
        <div className="attribute-item">
          <h3 className="title-sm gap-[15px]">
            <span>PRM Status</span>
            <button>
              <Image width={16} height={16} src="/image/ico-write.svg" alt="edit title" />
            </button>
          </h3>
          <div className="mt-[20px] flex items-end justify-between gap-[15px]">
            <div className="grid flex-grow grid-cols-2 gap-[25px]">
              <dl className="select-block">
                <dt>
                  Rows <span className="text-accent-600">*</span>
                  <button>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Image width={16} height={16} src="/image/ico-help.svg" alt="tooltip" />
                        </TooltipTrigger>
                        <TooltipContent side="right" align="center">
                          <React.Fragment>
                            <strong>Tool-tip Title</strong>
                            <br />
                            The average or top n% of the total queue count experienced by one passenger across
                            all processes.
                          </React.Fragment>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </button>
                </dt>
                <dd>
                  <SelectBox options={['Operating_Carrier_Name', 'Operating_Carrier_Code']} />
                </dd>
              </dl>
              <dl className="select-block">
                <dt>
                  Coulmns <span className="text-accent-600">*</span>
                  <button>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Image width={16} height={16} src="/image/ico-help.svg" alt="tooltip" />
                        </TooltipTrigger>
                        <TooltipContent side="right" align="center">
                          <React.Fragment>
                            <strong>Tool-tip Title</strong>
                            <br />
                            The average or top n% of the total queue count experienced by one passenger across
                            all processes.
                          </React.Fragment>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </button>
                </dt>
                <dd>
                  <Input
                    type="text"
                    placeholder=""
                    value={columValue}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setColumValue(e.target.value)}
                    className="input-rounded"
                  />
                </dd>
              </dl>
            </div>
            <Button className="btn-md btn-tertiary" text="Apply" onClick={() => {}} />
          </div>
          <div className="table-wrap mt-[10px] overflow-hidden rounded-md border border-default-300">
            <table className="table-secondary">
              <thead>
                <tr>
                  <th className="text-left">Category</th>
                  <th className="">Yes</th>
                  <th className="">No</th>
                </tr>
              </thead>
              <tbody>
                {attributeData.map((attributeData, index) => (
                  <tr key={index}>
                    <td className="text-left">{attributeData.category}</td>
                    <td className="text-center underline">{attributeData.yes}</td>
                    <td className="text-center underline">{attributeData.no}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="attribute-item">
          <h3 className="title-sm gap-[15px]">
            <span>Attribute 2</span>
            <button>
              <Image width={16} height={16} src="/image/ico-write.svg" alt="edit title" />
            </button>
          </h3>
          <div className="mt-[20px] flex items-end justify-between gap-[15px]">
            <div className="grid flex-grow grid-cols-2 gap-[25px]">
              <dl className="select-block">
                <dt>
                  Rows <span className="text-accent-600">*</span>
                  <button>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Image width={16} height={16} src="/image/ico-help.svg" alt="tooltip" />
                        </TooltipTrigger>
                        <TooltipContent side="right" align="center">
                          <React.Fragment>
                            <strong>Tool-tip Title</strong>
                            <br />
                            The average or top n% of the total queue count experienced by one passenger across
                            all processes.
                          </React.Fragment>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </button>
                </dt>
                <dd>
                  <SelectBox options={['Operating_Carrier_Name', 'Operating_Carrier_Code']} />
                </dd>
              </dl>
              <dl className="select-block">
                <dt>
                  Coulmns <span className="text-accent-600">*</span>
                  <button>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Image width={16} height={16} src="/image/ico-help.svg" alt="tooltip" />
                        </TooltipTrigger>
                        <TooltipContent side="right" align="center">
                          <React.Fragment>
                            <strong>Tool-tip Title</strong>
                            <br />
                            The average or top n% of the total queue count experienced by one passenger across
                            all processes.
                          </React.Fragment>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </button>
                </dt>
                <dd>
                  <Input
                    type="text"
                    placeholder=""
                    value={columValue}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setColumValue(e.target.value)}
                    className="input-rounded"
                  />
                </dd>
              </dl>
            </div>
            <Button className="btn-md btn-tertiary" text="Apply" onClick={() => {}} />
          </div>
          <div className="table-wrap mt-[10px] overflow-hidden rounded-md border border-default-300">
            <table className="table-secondary">
              <thead>
                <tr>
                  <th className="text-left">Category</th>
                  <th className="">Yes</th>
                  <th className="">No</th>
                </tr>
              </thead>
              <tbody>
                {attributeData.map((attributeData, index) => (
                  <tr key={index}>
                    <td className="text-left">{attributeData.category}</td>
                    <td className="text-center underline">{attributeData.yes}</td>
                    <td className="text-center underline">{attributeData.no}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <p className="relative mt-[25px] flex justify-center after:absolute after:top-1/2 after:block after:h-1 after:w-full after:-translate-y-1/2 after:bg-default-200 after:content-['']">
        <button className="relative z-10">
          <Image width={16} height={16} src="/image/ico-add-item.svg" alt="" />
        </button>
      </p>
      <div className="mt-[40px] flex items-center justify-end gap-[10px]">
        <Button className="btn-md btn-default" text="Cancel" onClick={() => {}} />
        <Button className="btn-md btn-primary w-[120px]" text="Save" onClick={() => {}} />
      </div>
      <p className="mt-[20px] text-[40px] text-xl font-semibold text-default-800">
        Check Generated Passenger Data
      </p>
      <dl className="mt-[25px]">
        <dt className="text-[40px] text-xl font-semibold">Total: 287 Flights</dt>
        <dd className="text-sm">Flight(360) x Average_seats(223) x Load_factor(85.0%)</dd>
      </dl>
      <div className="mt-[10px] flex justify-end">
        <ul className="chart-info">
          <li>
            <span className="dot" style={{ backgroundColor: '#6941C6' }}></span>IF
          </li>
          <li>
            <span className="dot" style={{ backgroundColor: '#B692F6' }}></span>ELSE
          </li>
        </ul>
      </div>
      <div className="mt-[10px] flex h-[360px] items-center justify-center rounded-md bg-white">API AREA</div>
      <div className="mt-[50px]">
        <div className="flex items-center justify-between pl-[35px]">
          <ul className="chart-info">
            <li>
              <span className="dot" style={{ backgroundColor: '#B692F6' }}></span>Korean Air
            </li>
            <li>
              <span className="dot" style={{ backgroundColor: '#B692F6' }}></span>Asiana Airline
            </li>
            <li>
              <span className="dot" style={{ backgroundColor: '#6941C6' }}></span>Jin Air
            </li>
          </ul>
          <div className="flex flex-col">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex h-[30px] flex-row items-center pb-[10px]">
                  <Button
                    className="btn-lg btn-default text-sm"
                    icon={<Image width={16} height={16} src="/image/ico-button-menu.svg" alt="" />}
                    text="Color Criteria"
                    onClick={() => {}}
                  />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="cursor-pointer bg-white">
                {/* {chartData && Object.keys(chartData?.data).map((text, index) => (
                    <div key={index} className="flex flex-col">
                      <DropdownMenuItem
                        className="flex cursor-pointer flex-row px-[14px] py-[10px] pl-[14px]"
                        style={{ width: 143 }}
                        onClick={() => setSelColorCriteria(text)}
                      >
                        <span className="ml-[10px] text-md font-medium text-gray-800">{text}</span>
                      </DropdownMenuItem>
                    </div>
                  ))} */}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="mt-[30px] flex h-[360px] flex-grow items-center justify-center rounded-md bg-white">
          API AREA
        </div>
      </div>
      <div className="mt-[25px] flex items-center justify-center">
        <button className="flex h-[50px] w-full items-center justify-center gap-[10px] text-lg font-medium text-default-300 hover:text-default-700">
          <FontAwesomeIcon className="nav-icon" size="sm" icon={faAngleUp} />
          Hide Table
        </button>
      </div>
      <div className="table-wrap mt-[10px] overflow-hidden rounded-md border border-default-300">
        <table className="table-secondary">
          <thead>
            <tr>
              <th className="w-[165px] text-left">#</th>
              <th className="">TML</th>
              <th className="">ALN</th>
              <th className="">FLT</th>
              <th className="">DATE</th>
              <th className="">DEP_TIME</th>
              <th className="">GATE</th>
              <th className="">SENIOR</th>
              <th className="">...</th>
              <th className="">CK_ON</th>
            </tr>
          </thead>
          <tbody>
            {flightData.map((flight) => (
              <tr key={flight.id}>
                <td className="text-left">{flight.id}</td>
                <td className="text-center underline">{flight.tml}</td>
                <td className="text-center underline">{flight.aln}</td>
                <td className="text-center underline">{flight.flt}</td>
                <td className="text-center underline">{flight.date}</td>
                <td className="text-center underline">{flight.depTime}</td>
                <td className="text-center underline">{flight.gate}</td>
                <td className="text-center underline">{flight.senior}</td>
                <td className="text-center underline">...</td>
                <td className="text-center underline">{flight.ckOn}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-[30px] flex justify-between">
        <button className="btn-md btn-default btn-rounded w-[210px] justify-between">
          <FontAwesomeIcon className="nav-icon" size="sm" icon={faAngleLeft} />
          <span className="flex flex-grow items-center justify-center">Filght Schedule</span>
        </button>
        <button className="btn-md btn-default btn-rounded w-[210px] justify-between">
          <span className="flex flex-grow items-center justify-center">Processing Procedures</span>
          <FontAwesomeIcon className="nav-icon" size="sm" icon={faAngleRight} />
        </button>
      </div>
    </div>
  );
};

export default AppliedPassengerAttributes;
