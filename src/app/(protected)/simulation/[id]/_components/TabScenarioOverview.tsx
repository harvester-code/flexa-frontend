'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { faAngleLeft, faAngleRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import dayjs from 'dayjs';
import { useShallow } from 'zustand/react/shallow';
import { updateScenarioMetadata } from '@/services/simulations';
import { useScenarioStore } from '@/stores/useScenarioStore';
import Button from '@/components/Button';
import TheInput from '@/components/TheInput';
import { timeToRelativeTime } from '@/lib/utils';

const PAGE_ROW_AMOUNT = 5;

const OVERVIEW_CARDS = [
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
  const router = useRouter();

  const {
    history,
    scenarioMatrix,
    scenarioTerminal,

    currentScenarioTab,
    setCurrentScenarioTab,
  } = useScenarioStore(
    useShallow((s) => ({
      history: s.scenarioProfile.scenarioHistory,
      scenarioMatrix: s.scenarioOverview.matrix,
      scenarioTerminal: s.scenarioProfile.scenarioTerminal,
      currentScenarioTab: s.scenarioProfile.currentScenarioTab,
      setCurrentScenarioTab: s.scenarioProfile.actions.setCurrentScenarioTab,
      availableScenarioTab: s.scenarioProfile.availableScenarioTab,
      setAvailableScenarioTab: s.scenarioProfile.actions.setAvailableScenarioTab,
    }))
  );

  const [historyPage, setHistoryPage] = useState(0);

  const historyPageData = {
    start: historyPage * PAGE_ROW_AMOUNT,
    end: historyPage * PAGE_ROW_AMOUNT + PAGE_ROW_AMOUNT,
    lastPage: history ? Math.ceil(history.length / PAGE_ROW_AMOUNT) : 1,
  };

  // const handleUpdateMemo = () => updateScenarioMetadata(false);
  // const handleMemoChange = (index: number, newMemo: string) => {
  //   if (history) {
  //     setHistoryItem(
  //       {
  //         ...history[index],
  //         memo: newMemo,
  //       },
  //       index
  //     );
  //   }
  // };

  return !visible ? null : (
    <div>
      <h2 className="title-sm mt-[25px]">Scenario Overview</h2>
      {scenarioMatrix && scenarioMatrix.length > 0 ? (
        <div className="overview-wrap mt-[10px]">
          {scenarioMatrix.map((item, index) => (
            <a key={index} href="#" className="overview-item h-[120px] overflow-hidden">
              <dl>
                <dt className="text-left">{item?.name}</dt>
                <dd className="whitespace-pre text-right !text-lg">
                  {(Array.isArray(item?.value) ? item.value.join('\n') : item?.value) ||
                    (item.name == 'Terminal' ? scenarioTerminal : '')}
                </dd>
              </dl>
            </a>
          ))}
        </div>
      ) : (
        <div className="overview-wrap mt-[10px]">
          {OVERVIEW_CARDS.map((card) => (
            <a key={card.key} href="#" className="overview-item">
              <dl>
                <dt className="text-left">{card.text}</dt>
                <dd className="text-right">{scenarioMatrix[card.key] || '-'}</dd>
              </dl>
            </a>
          ))}
        </div>
      )}

      {/* ---------- 아래 History 관련 UI는 잠시 주석 처리 ---------- */}
      {/* <h2 className="title-sm mt-[40px]">Scenario Modification History</h2>
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
                    <span className={`badge ${item.simulation == 'Done' ? 'green' : 'yellow'}`}>{item.simulation}</span>
                  </td>
                  <td className="">
                    <Input
                      type="text"
                      placeholder=""
                      value={history[index].memo}
                      className="!border-none bg-transparent !text-default-700"
                      onChange={(e) => handleMemoChange(index, e.target.value)}
                      onBlur={() => handleUpdateMemo()}
                      disabled={true}
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
      </div> */}

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
          onClick={() => setCurrentScenarioTab(currentScenarioTab + 1)}
        >
          <span className="flex flex-grow items-center justify-center">Flight Schedule</span>
          <FontAwesomeIcon className="nav-icon" size="sm" icon={faAngleRight} />
        </button>
      </div>
    </div>
  );
}
