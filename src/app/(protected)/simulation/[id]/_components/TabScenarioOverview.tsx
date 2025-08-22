'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { faAngleLeft, faAngleRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import dayjs from 'dayjs';
import { useShallow } from 'zustand/react/shallow';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { timeToRelativeTime } from '@/lib/utils';
import { useScenarioStore } from '../../_store/useScenarioStore';
import NextButton from './NextButton';

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
    <div className="pt-8">
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

      {/* Navigation */}
      <div className="mt-8 flex justify-end">
        <NextButton />
      </div>
    </div>
  );
}
