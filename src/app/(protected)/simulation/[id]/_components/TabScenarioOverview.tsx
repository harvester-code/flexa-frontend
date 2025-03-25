'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { faAngleLeft, faAngleRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import dayjs from 'dayjs';
import { useSimulationMetadata, useSimulationStore } from '@/stores/simulation';
import Input from '@/components/Input';

const PageRowAmount = 10;

const OverviewTable = [
  { key: 'date', text: 'Date' },
  { key: 'terminal', text: 'Terminal' },
  { key: 'analysis_type', text: 'Analysis Type' },
  { key: 'data_source', text: 'Data Source' },
  { key: 'flights', text: 'Flights' },
  { key: 'passengers', text: 'Passengers' },
  { key: 'passengers_pattern', text: 'Passengers Pattern' },
  { key: 'generation_method', text: 'Generation Method' },
  { key: 'check_in', text: 'Check-In' },
  { key: 'boarding_pass', text: 'Boarding Pass' },
  { key: 'security', text: 'Security' },
  { key: 'passport', text: 'Passport' },
];

interface TabScenarioOverviewProps {
  visible: boolean;
}

export default function TabScenarioOverview({ visible }: TabScenarioOverviewProps) {
  // 메모 상태 관리
  const metadata = useSimulationMetadata();
  const { tabIndex, setTabIndex } = useSimulationStore();
  const overview = metadata?.overview;
  const history = metadata?.history;
  const router = useRouter();
  const [historyPage, setHistoryPage] = useState(0);
  const historyPageData = {
    start: historyPage * PageRowAmount,
    end: historyPage * PageRowAmount + PageRowAmount,
    lastPage: history ? Math.ceil(history.length / PageRowAmount) : 1,
  };
  const handleMemoChange = (index: number, newMemo: string) => {
    if (!history) return;
    metadata.setHistoryItem({ ...history[index], memo: newMemo }, index);
  };
  return !visible ? null : (
    <div>
      <h2 className="title-sm mt-[25px]">Scenario Overview</h2>
      <div className="overview-wrap mt-[10px]">
        {OverviewTable.map((item) => (
          <a key={item.key} href="#" className="overview-item">
            <dl>
              <dt>{item.text}</dt>
              <dd>{overview?.[item.key] || '-'}</dd>
            </dl>
          </a>
        ))}
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
            {history?.map((item, index) => {
              const checkpoint = dayjs(item.checkpoint);
              const updatedAt = dayjs(item.updated_at);
              const minutes = dayjs().diff(updatedAt, 'minute');
              const hours = minutes / 60;
              const days = hours / 24;
              const months = days / 30;
              const years = days / 365;
              const selDiff = [
                [Math.floor(years), 'year'],
                [Math.floor(months), 'month'],
                [Math.floor(days), 'day'],
                [Math.floor(hours), 'hour'],
                [Math.floor(minutes), 'minute'],
              ].find((val) => Number(val[0]) >= 1);

              return index >= historyPageData.start && index < historyPageData.end ? (
                <tr key={index} className="border-b">
                  <td className="">
                    <span className="font-semibold">{checkpoint.format('YYYY-MM-DD')}</span>
                    <span className="ml-[5px] font-normal">{checkpoint.format('hh:mm:ss')}</span>
                  </td>
                  <td className="">
                    {selDiff ? `${selDiff[0]}${selDiff[1]}${selDiff[0] == 1 ? '' : 's'}` : 'a few minutes'} ago
                  </td>
                  <td className="text-center">
                    <span className={`badge ${item.simulation == 'Done' ? 'green' : 'yellow'}`}>
                      {item.simulation}
                    </span>
                  </td>
                  <td className="">
                    <Input
                      type="text"
                      placeholder=""
                      value={history[index].memo}
                      className="!border-none bg-transparent !text-default-700"
                      onChange={(e) => handleMemoChange(index, e.target.value)}
                      // disabled={true}
                    />
                  </td>
                  <td className="text-center">
                    <span className={`badge error ${item.error_count > 0 ? 'yellow' : 'green'}`}>
                      {item.error_count || 'None'}
                    </span>
                  </td>
                </tr>
              ) : null;
            })}
          </tbody>
        </table>
      </div>
      <div className="pagingFraction mt-[20px] flex items-center justify-end gap-[20px]">
        <p className="text-sm font-medium">
          Page {historyPage + 1} of {historyPageData.lastPage}
        </p>
        <p className="flex gap-[10px]">
          <button
            className="flex h-[40px] w-[40px] items-center justify-center rounded-md border border-default-200"
            onClick={() => {
              if (historyPage - 1 >= 0) setHistoryPage(historyPage - 1);
            }}
          >
            <FontAwesomeIcon className="nav-icon" size="sm" icon={faAngleLeft} />
          </button>
          <button
            className="flex h-[40px] w-[40px] items-center justify-center rounded-md border border-default-200"
            onClick={() => {
              if (historyPage + 1 < historyPageData.lastPage) setHistoryPage(historyPage + 1);
            }}
          >
            <FontAwesomeIcon className="nav-icon" size="sm" icon={faAngleRight} />
          </button>
        </p>
      </div>
      <div className="mt-[30px] flex justify-between">
        <button
          className="btn-md btn-default btn-rounded w-[210px] justify-between"
          onClick={() => {
            router.replace(`/simulation`);
          }}
        >
          <FontAwesomeIcon className="nav-icon" size="sm" icon={faAngleLeft} />
          <span className="flex flex-grow items-center justify-center">Scenario List</span>
        </button>
        <button
          className="btn-md btn-default btn-rounded w-[210px] justify-between"
          onClick={() => setTabIndex(tabIndex + 1)}
        >
          <span className="flex flex-grow items-center justify-center">Flight Schedule</span>
          <FontAwesomeIcon className="nav-icon" size="sm" icon={faAngleRight} />
        </button>
      </div>
    </div>
  );
}
