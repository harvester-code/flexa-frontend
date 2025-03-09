'use client';

// import { Menu, MenuItem } from '@mui/material';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  faAngleDown,
  faAngleLeft,
  faAngleRight,
  faAngleUp,
  faCheck,
  faPen,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from '@/components/Button';
import Checkbox from '@/components/Checkbox';
import SelectBox from '@/components/SelectBox';
import TabDefault from '@/components/TabDefault';

export default function TabFacilityInformation() {
  const [addConditions, setAddConditions] = useState(false);
  const tabsSecondary: { text: string; number?: number }[] = [
    { text: 'Check-In' },
    { text: 'Boarding Pass', number: 2 },
    { text: 'Security' },
    { text: 'Passport' },
    { text: 'Direct Upload' },
  ];
  const openData = [
    {
      id: 1,
      time: '00:00',
      sc01: '0',
      sc02: '0',
      sc03: '0',
      sc04: '0',
      sc05: '0',
      sc06: '0',
      sc07: '0',
      sc08: '0',
      sc09: '0',
      sc10: '0',
    },
    {
      id: 2,
      time: '01:00',
      sc01: '0',
      sc02: '0',
      sc03: '0',
      sc04: '0',
      sc05: '0',
      sc06: '0',
      sc07: '0',
      sc08: '0',
      sc09: '0',
      sc10: '0',
    },
    {
      id: 3,
      time: '02:00',
      sc01: '0',
      sc02: '0',
      sc03: '0',
      sc04: '0',
      sc05: '0',
      sc06: '0',
      sc07: '0',
      sc08: '0',
      sc09: '0',
      sc10: '0',
    },
    {
      id: 4,
      time: '03:00',
      sc01: '30',
      sc02: '30',
      sc03: '30',
      sc04: '30',
      sc05: '30',
      sc06: '30',
      sc07: '30',
      sc08: '30',
      sc09: '30',
      sc10: '30',
    },
    {
      id: 5,
      time: '04:00',
      sc01: '30',
      sc02: '30',
      sc03: '30',
      sc04: '30',
      sc05: '30',
      sc06: '30',
      sc07: '30',
      sc08: '30',
      sc09: '30',
      sc10: '30',
    },
  ];

  type Row = {
    time: string;
    checkboxes: boolean[];
  };
  const rows: Row[] = [
    { time: '00:00', checkboxes: Array(10).fill(false) },
    { time: '01:00', checkboxes: Array(10).fill(false) },
    { time: '02:00', checkboxes: Array(10).fill(false) },
    { time: '03:00', checkboxes: Array(10).fill(false) },
    { time: '04:00', checkboxes: Array(10).fill(false) },
    { time: '05:00', checkboxes: Array(10).fill(false) },
  ];
  const [checkboxStates, setCheckboxStates] = useState<boolean[][]>([]);
  useEffect(() => {
    const initialCheckboxStates = Array.from({ length: rows.length }, () => Array(10).fill(false));
    setCheckboxStates(initialCheckboxStates);
  }, [rows.length]);

  const handleCheckboxChange = (rowIndex: number, colIndex: number) => {
    setCheckboxStates((prevStates) => {
      const newStates = prevStates.map((row, rIndex) => {
        if (rIndex === rowIndex) {
          return row.map((col, cIndex) => (cIndex === colIndex ? !col : col));
        }
        return row;
      });
      return newStates;
    });
  };
  const [colorAnchorEl, setColorAnchorEl] = useState<HTMLElement | null>(null);
  const handleColorClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setColorAnchorEl(event.currentTarget);
  };
  const handleColorClose = () => {
    setColorAnchorEl(null);
  };
  return (
    <div>
      <h2 className="title-sm mt-[25px]">Facility Information</h2>
      <TabDefault
        tabCount={5}
        currentTab={1}
        tabs={tabsSecondary.map((tab) => ({ text: tab.text, number: tab.number || 0 }))}
        className={`tab-secondary mt-[25px] grid-cols-5`}
      />
      <ul className="gate-list">
        <li>
          <button>Gate 1</button>
        </li>
        <li>
          <button>Gate 2</button>
        </li>
        <li>
          <button>Gate 3</button>
        </li>
        <li>
          <button>Gate 4</button>
        </li>
        <li className="active">
          <button>
            Gate 5 <span>2</span>
          </button>
        </li>
        <li>
          <button>Gate 6</button>
        </li>
      </ul>
      <div className="mt-[30px] flex items-center justify-between">
        <h2 className="title-sm">Facility Default Settings</h2>
        <div className="flex items-center gap-[10px]">
          <Button
            className="btn-md btn-default"
            icon={<FontAwesomeIcon className="nav-icon" size="sm" icon={faPen} />}
            text="Edit Facilities"
            onClick={() => {}}
          />
        </div>
      </div>
      <div className="table-container mt-[20px]">
        <table className="table-tertiary">
          <thead>
            <tr>
              <th className="w-[250px] text-left">Category</th>
              <th className="">DG5_NEW_SC01</th>
              <th className="">DG5_NEW_SC02</th>
              <th className="">DG5_NEW_SC03</th>
              <th className="">DG5_NEW_SC04</th>
              <th className="">DG5_NEW_SC05</th>
              <th className="">DG5_NEW_SC06</th>
              <th className="">DG5_NEW_SC07</th>
              <th className="">DG5_NEW_SC08</th>
              <th className="">DG5_NEW_SC09</th>
              <th className="">DG5_NEW_SC10</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>Processing Time (sec)</th>
              <td className="text-center underline">35</td>
              <td className="text-center underline">35</td>
              <td className="text-center underline">35</td>
              <td className="text-center underline">35</td>
              <td className="text-center underline">35</td>
              <td className="text-center underline">35</td>
              <td className="text-center underline">35</td>
              <td className="text-center underline">35</td>
              <td className="text-center underline">35</td>
              <td className="text-center underline">35</td>
            </tr>
            <tr>
              <th className="">Maximum Allowed Queue (persons)</th>
              <td className="text-center underline">200</td>
              <td className="text-center underline">200</td>
              <td className="text-center underline">200</td>
              <td className="text-center underline">200</td>
              <td className="text-center underline">200</td>
              <td className="text-center underline">200</td>
              <td className="text-center underline">200</td>
              <td className="text-center underline">200</td>
              <td className="text-center underline">200</td>
              <td className="text-center underline">200</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-[20px] flex justify-end">
        <Button
          className="btn-md btn-tertiary"
          text="Applied"
          iconRight={<FontAwesomeIcon className="nav-icon" size="sm" icon={faCheck} />}
          onClick={() => {}}
        />
      </p>
      <div className="mt-[30px] flex items-center justify-between">
        <h2 className="title-sm">Set Opening Hours</h2>
        <div className="flex items-center gap-[20px]">
          <Checkbox
            id="Automatic"
            label="Automatic Input"
            checked={addConditions}
            onChange={() => setAddConditions(!addConditions)}
            className="checkbox-toggle"
          />
          <dl className="flex items-center gap-[10px]">
            <dt>Time Unit</dt>
            <dd>
              <SelectBox
                options={['10 Min', '20 Min', '30 Min', '40 Min', '50 Min', '60 Min']}
                defaultValue=""
                className="select-sm select-square w-[120px]"
              />
            </dd>
          </dl>
        </div>
      </div>
      <div className="table-wrap mt-[10px] overflow-hidden rounded-md border border-default-300">
        <table className="table-secondary">
          <thead>
            <tr className="text-left">
              <th className="w-[100px]">
                Opening <br /> Time
              </th>
              <th className="">
                DG5_ <br />
                NEW_SC01
              </th>
              <th className="">DG5_ NEW_SC02</th>
              <th className="">DG5_ NEW_SC03</th>
              <th className="">DG5_ NEW_SC04</th>
              <th className="">DG5_ NEW_SC05</th>
              <th className="">DG5_ NEW_SC06</th>
              <th className="">DG5_ NEW_SC07</th>
              <th className="">DG5_ NEW_SC08</th>
              <th className="">DG5_ NEW_SC09</th>
              <th className="">DG5_ NEW_SC10</th>
            </tr>
          </thead>
          <tbody>
            {openData.map((open) => (
              <tr key={open.id} className="text-center">
                <td className="">{open.time}</td>
                <td className="underline">{open.sc01}</td>
                <td className="underline">{open.sc02}</td>
                <td className="underline">{open.sc03}</td>
                <td className="underline">{open.sc04}</td>
                <td className="underline">{open.sc05}</td>
                <td className="underline">{open.sc06}</td>
                <td className="underline">{open.sc07}</td>
                <td className="underline">{open.sc08}</td>
                <td className="underline">{open.sc09}</td>
                <td className="underline">{open.sc10}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="table-wrap mt-[10px] overflow-hidden rounded-md border border-default-300">
        <table className="table-secondary">
          <thead>
            <tr className="text-left">
              <th className="w-[100px]">
                Opening <br /> Time
              </th>
              <th className="">
                DG5_ <br />
                NEW_SC01
              </th>
              <th className="">DG5_ NEW_SC02</th>
              <th className="">DG5_ NEW_SC03</th>
              <th className="">DG5_ NEW_SC04</th>
              <th className="">DG5_ NEW_SC05</th>
              <th className="">DG5_ NEW_SC06</th>
              <th className="">DG5_ NEW_SC07</th>
              <th className="">DG5_ NEW_SC08</th>
              <th className="">DG5_ NEW_SC09</th>
              <th className="">DG5_ NEW_SC10</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="text-center">
                <td>{row.time}</td>
                {row.checkboxes.map((_, colIndex) => (
                  <td key={colIndex}>
                    <Checkbox
                      label=""
                      id={`check-${rowIndex}-${colIndex}`}
                      checked={checkboxStates[rowIndex]?.[colIndex] || false}
                      onChange={() => handleCheckboxChange(rowIndex, colIndex)}
                      className="checkbox text-sm"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-[30px] flex h-[360px] items-center justify-center rounded-md bg-white">API AREA</div>
      <p className="mt-[20px] flex justify-end">
        <Button
          className="btn-md btn-tertiary"
          text="Applied"
          iconRight={<FontAwesomeIcon className="nav-icon" size="sm" icon={faCheck} />}
          onClick={() => {}}
        />
      </p>
      <div className="mt-[40px] flex items-center justify-center">
        <button className="flex h-[50px] w-full items-center justify-center gap-[10px] text-lg font-medium text-default-300 hover:text-default-700">
          <FontAwesomeIcon className="nav-icon" size="sm" icon={faAngleUp} />
          Hide Overview Charts
        </button>
      </div>
      <hr />
      <p className="mt-[10px] text-sm text-default-500">Load completed(100%)</p>
      <h3 className="title-sm">Check Generated Passenger Data</h3>
      <div className="mt-[20px] flex items-center justify-between">
        <p className="text-[40px] text-xl font-semibold">Total: 1.001 Pax</p>
        <p>
          <Button
            className="btn-md btn-default"
            icon={<Image src="/image/ico-filter.svg" alt="filter" />}
            text="Color Criteria"
            onClick={handleColorClick}
          />
          {/* <Menu
            anchorEl={colorAnchorEl}
            open={Boolean(colorAnchorEl)}
            onClose={handleColorClose}
            PaperProps={{
              className: 'sub-menu !w-[150px]',
            }}
          >
            <MenuItem onClick={() => {}}>Airline</MenuItem>
            <MenuItem onClick={() => {}}>Age</MenuItem>
            <MenuItem onClick={() => {}}>Sex</MenuItem>
            <MenuItem onClick={() => {}}>Destination</MenuItem>
            <MenuItem onClick={() => {}}>Nationality</MenuItem>
            <MenuItem onClick={() => {}}>Flight Number</MenuItem>
          </Menu> */}
        </p>
      </div>
      <div className="mt-[15px] flex justify-end">
        <ul className="chart-info">
          <li>
            <span className="dot" style={{ backgroundColor: '#6941C6' }}></span>Passenger
          </li>
          <li>
            <span className="dot" style={{ backgroundColor: '#FF0000' }}></span>Capacity
          </li>
        </ul>
      </div>
      <div className="mt-[15px] flex h-[360px] items-center justify-center rounded-md bg-white">API AREA</div>
      <div className="mt-[30px] flex justify-between">
        <button className="btn-md btn-default btn-rounded w-[210px] justify-between">
          <FontAwesomeIcon className="nav-icon" size="sm" icon={faAngleLeft} />
          <span className="flex flex-grow items-center justify-center">Filght Schedule</span>
        </button>
        <button className="btn-md btn-default btn-rounded w-[210px] justify-between" disabled>
          <span className="flex flex-grow items-center justify-center">Simulation</span>
          <FontAwesomeIcon className="nav-icon" size="sm" icon={faAngleRight} />
        </button>
      </div>
    </div>
  );
}
