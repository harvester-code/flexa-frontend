'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { faAngleLeft, faAngleRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import dayjs from 'dayjs';
import { updateScenarioMetadata } from '@/services/simulations';
import { useSimulationMetadata, useSimulationStore } from '@/stores/simulation';
import Input from '@/components/Input';
import { timeToRelativeTime } from '@/lib/utils';

const PageRowAmount = 5;

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
  const { tabIndex, setTabIndex, scenarioInfo, setConditions, setPriorities, availableTabIndex, setAvailableTabIndex } =
    useSimulationStore();
  const overview = metadata?.overview;
  const flight_sch = metadata?.flight_sch;
  const history = [...(metadata?.history || [])].reverse();
  const router = useRouter();
  const [historyPage, setHistoryPage] = useState(0);
  const historyPageData = {
    start: historyPage * PageRowAmount,
    end: historyPage * PageRowAmount + PageRowAmount,
    lastPage: history ? Math.ceil(history.length / PageRowAmount) : 1,
  };

  const [loaded, setLoaded] = useState(false);
  const restoreSnapshot = () => {
    if (overview?.snapshot) {
      const snapshot = overview?.snapshot;
      if (snapshot?.availableTabIndex) setAvailableTabIndex(snapshot?.availableTabIndex);
    }
    if (flight_sch?.snapshot) {
      const snapshot = flight_sch?.snapshot;
      if (snapshot?.conditions) setConditions(snapshot?.conditions);
      if (snapshot?.priorities) setPriorities(snapshot?.priorities);
    }
  };

  useEffect(() => {
    if (visible && !loaded && (overview?.snapshot || flight_sch?.snapshot)) {
      restoreSnapshot();
      setLoaded(true);
    }
  }, [visible, overview?.snapshot, flight_sch?.snapshot]);

  useEffect(() => {
    if (!visible && loaded) {
      metadata?.setOverview({ snapshot: { ...(overview?.snapshot || {}), availableTabIndex } });
    }
  }, [availableTabIndex]);

  const handleMemoChange = (index: number, newMemo: string) => {
    if (!history) return;
    metadata.setHistoryItem({ ...history[index], memo: newMemo }, index);
  };
  const handleUpdateMemo = () => {
    updateScenarioMetadata(false);
  };
  return !visible ? null : (
    <div>
      <h2 className="title-sm mt-[25px]">Scenario Overview</h2>
      {overview?.matric && overview?.matric?.length > 0 ? (
        <div className="overview-wrap mt-[10px]">
          {overview?.matric?.map((item, index) => (
            <a key={index} href="#" className="overview-item h-[120px] overflow-hidden">
              <dl>
                <dt className="text-left">{item?.name}</dt>
                <dd className="whitespace-pre text-right">
                  {(Array.isArray(item?.value) ? item.value.join('\n') : item?.value) || (item.name == 'Terminal' ? scenarioInfo?.terminal : '')}
                </dd>
              </dl>
            </a>
          ))}
        </div>
      ) : (
        <div className="overview-wrap mt-[10px]">
          {OverviewTable.map((item) => (
            <a key={item.key} href="#" className="overview-item">
              <dl>
                <dt className="text-left">{item.text}</dt>
                <dd className="text-right">{overview?.[item.key] || '-'}</dd>
              </dl>
            </a>
          ))}
        </div>
      )}
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
              const relTime = timeToRelativeTime(item.checkpoint);
              return index >= historyPageData.start && index < historyPageData.end ? (
                <tr key={index} className="border-b">
                  <td className="">
                    <span className="font-semibold">{checkpoint.format('YYYY-MM-DD')}</span>
                    <span className="ml-[5px] font-normal">{checkpoint.format('hh:mm:ss')}</span>
                  </td>
                  <td className="">{relTime} ago</td>
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
                      onBlur={() => handleUpdateMemo()}
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
          Page {historyPageData.lastPage > 0 ? historyPage + 1 : 0} of {historyPageData.lastPage}
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
