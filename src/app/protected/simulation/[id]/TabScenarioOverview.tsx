'use client';

import React, { useState } from 'react';
import { faAngleLeft, faAngleRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Input from '@/components/Input';

const data = [
  {
    checkpoint: '2024-10-14',
    time: '17:30:02',
    date: '2hours before',
    simType: 'green',
    simulation: 'Done',
    memo: 'Optimized security che',
    errorType: 'green',
    error: 'None',
  },
  {
    checkpoint: '2024-10-14',
    time: '17:30:02',
    date: '2hours before',
    simType: 'green',
    simulation: 'Done',
    memo: 'Optimized security check workload and opening times',
    errorType: 'yellow',
    error: '2',
  },
  {
    checkpoint: '2024-10-14',
    time: '17:30:02',
    date: '2hours before',
    simType: 'yellow',
    simulation: 'Yet',
    memo: 'Optimized security check workload and opening times',
    errorType: 'yellow',
    error: '4',
  },
];
export default function TabScenarioOverview() {
  // 메모 상태 관리
  const [memos, setMemos] = useState(data.map((item) => item.memo));
  const handleMemoChange = (index: number, newMemo: string) => {
    setMemos((prevMemos) => {
      const updatedMemos = [...prevMemos];
      updatedMemos[index] = newMemo;
      return updatedMemos;
    });
  };

  return (
    <div>
      <h2 className="title-sm mt-[25px]">Scenario Overview</h2>
      <div className="overview-wrap mt-[10px]">
        <a href="#" className="overview-item">
          <dl>
            <dt>Date</dt>
            <dd>2025-01-01</dd>
          </dl>
        </a>
        <a href="#" className="overview-item">
          <dl>
            <dt>Terminal</dt>
            <dd>-</dd>
          </dl>
        </a>
        <a href="#" className="overview-item">
          <dl>
            <dt>Analysis Type</dt>
            <dd>-</dd>
          </dl>
        </a>
        <a href="#" className="overview-item">
          <dl>
            <dt>Source</dt>
            <dd>-</dd>
          </dl>
        </a>
        <a href="#" className="overview-item">
          <dl>
            <dt>Flights</dt>
            <dd>-</dd>
          </dl>
        </a>
        <a href="#" className="overview-item">
          <dl>
            <dt>Passengers</dt>
            <dd>-</dd>
          </dl>
        </a>
        <a href="#" className="overview-item">
          <dl>
            <dt>Passengers Pattern</dt>
            <dd>-</dd>
          </dl>
        </a>
        <a href="#" className="overview-item">
          <dl>
            <dt>Generation Method</dt>
            <dd>-</dd>
          </dl>
        </a>
        <a href="#" className="overview-item">
          <dl>
            <dt>Check-In</dt>
            <dd>13 nodes with 494 facilities Average processing time: 183 seconds</dd>
          </dl>
        </a>
        <a href="#" className="overview-item">
          <dl>
            <dt>Boarding Pass</dt>
            <dd>-</dd>
          </dl>
        </a>
        <a href="#" className="overview-item">
          <dl>
            <dt>Security</dt>
            <dd></dd>
          </dl>
        </a>
        <a href="#" className="overview-item">
          <dl>
            <dt>Passport</dt>
            <dd>
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Ex eum aliquid consequatur minus
              doloremque natus minima enim
            </dd>
          </dl>
        </a>
      </div>
      <h2 className="title-sm mt-[40px]">Scenario Modification History</h2>
      <div className="table-wrap mt-[10px]">
        <table className="table-default">
          <thead>
            <tr className="border-b">
              <th className="w-[210px] text-left">Checkpoint</th>
              <th className="w-[180px] text-left">Modification Date</th>
              <th className="w-[120px] text-center">Simulation</th>
              <th className="!pl-[20px] text-left">Memo</th>
              <th className="w-[120px] text-center">Error</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index} className="border-b">
                <td className="">
                  <span className="font-semibold">{item.checkpoint}</span>
                  <span className="ml-[5px] font-normal">{item.time}</span>
                </td>
                <td className="">{item.date}</td>
                <td className="text-center">
                  <span className={`badge ${item.simType}`}>{item.simulation}</span>
                </td>
                <td className="">
                  <Input
                    type="text"
                    placeholder=""
                    value={memos[index]}
                    className="!border-none bg-transparent !text-default-700"
                    onChange={(e) => handleMemoChange(index, e.target.value)}
                    // disabled={true}
                  />
                </td>
                <td className="text-center">
                  <span className={`badge error ${item.errorType}`}>{item.error}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="pagingFraction mt-[20px] flex items-center justify-end gap-[20px]">
        <p className="text-sm font-medium">Page 1 of 2</p>
        <p className="flex gap-[10px]">
          <button className="flex h-[40px] w-[40px] items-center justify-center rounded-md border border-default-200">
            <FontAwesomeIcon className="nav-icon" size="sm" icon={faAngleLeft} />
          </button>
          <button className="flex h-[40px] w-[40px] items-center justify-center rounded-md border border-default-200">
            <FontAwesomeIcon className="nav-icon" size="sm" icon={faAngleRight} />
          </button>
        </p>
      </div>
      <div className="mt-[30px] flex justify-between">
        <button className="btn-md btn-default btn-rounded w-[210px] justify-between">
          <FontAwesomeIcon className="nav-icon" size="sm" icon={faAngleLeft} />
          <span className="flex flex-grow items-center justify-center">Scenario List</span>
        </button>
        <button className="btn-md btn-default btn-rounded w-[210px] justify-between">
          <span className="flex flex-grow items-center justify-center">Flight Schedule</span>
          <FontAwesomeIcon className="nav-icon" size="sm" icon={faAngleRight} />
        </button>
      </div>
    </div>
  );
}
