'use client';

import React, { useState } from 'react';
import { faAngleLeft, faAngleRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface TabSimulationProps {
  visible: boolean;
}

export default function TabSimulation({ visible }: TabSimulationProps) {
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

  return !visible ? null : (
    <div>
      <h2 className="title-sm mt-[25px]">Overview</h2>
      {/* 오버뷰 영역 */}
      <div className="overview-wrap mt-[10px]">
        <a href="#" className="overview-item">
          <dl>
            <dt>Date</dt>
            <dd>2025-01-01 ~ 2025-01-02</dd>
          </dl>
        </a>
        <a href="#" className="overview-item">
          <dl>
            <dt>Airport</dt>
            <dd>ICN⏐Incheon Int’l Airport</dd>
          </dl>
        </a>
        <a href="#" className="overview-item">
          <dl>
            <dt>Terminal</dt>
            <dd>Termianl 1</dd>
          </dl>
        </a>
        <a href="#" className="overview-item">
          <dl>
            <dt>Flights</dt>
            <dd>
              Departure: 693 flights <br /> Arrivals: 688 flights{' '}
            </dd>
          </dl>
        </a>
        <a href="#" className="overview-item">
          <dl>
            <dt>Passengers</dt>
            <dd>
              Departures: 693 flights <br /> Arrivals: 688 flights
            </dd>
          </dl>
        </a>
        <a href="#" className="overview-item">
          <dl>
            <dt>Process</dt>
            <dd>
              Check-In <br /> Boarding Pass <br /> Security <br /> Passport
            </dd>
          </dl>
        </a>
        <a href="#" className="overview-item">
          <dl>
            <dt>Passengers Pattern</dt>
            <dd>
              Average 132 minutes before departure <br /> 40-minute distribution
            </dd>
          </dl>
        </a>
        <a href="#" className="overview-item">
          <dl>
            <dt>Generation Method</dt>
            <dd>Regular Distribution</dd>
          </dl>
        </a>
      </div>
      <h2 className="title-sm mt-[70px]">Passenger Schedule Information</h2>
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
      {/* 하단버튼 */}
      <div className="mt-[30px] flex justify-between">
        <button className="btn-md btn-default btn-rounded w-[210px] justify-between">
          <FontAwesomeIcon className="nav-icon" size="sm" icon={faAngleLeft} />
          <span className="flex flex-grow items-center justify-center">Previous</span>
        </button>
        <button className="btn-md btn-tertiary btn-rounded w-[210px] justify-between">
          <span className="flex flex-grow items-center justify-center">Simulation Run</span>
          <FontAwesomeIcon className="nav-icon" size="sm" icon={faAngleRight} />
        </button>
      </div>
    </div>
  );
}
