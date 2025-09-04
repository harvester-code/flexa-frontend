'use client';

import React from 'react';
import { APIRequestLog } from '@/types/simulationTypes';
import { useSimulationStore } from '../_stores';
import NextButton from './NextButton';
import TabPassengerScheduleParquetFilter from './TabPassengerScheduleParquetFilter';
import TabPassengerScheduleResult from './TabPassengerScheduleResult';

interface TabPassengerScheduleProps {
  simulationId: string;
  visible: boolean;
  apiRequestLog: APIRequestLog | null;
  setApiRequestLog: (log: APIRequestLog | null) => void;
}

export interface AirlineShowUpTime {
  iata: string;
  name: string;
  meanMinutes: number;
  stdDevMinutes: number;
}

export default function TabPassengerSchedule({
  simulationId,
  visible,
  apiRequestLog,
  setApiRequestLog,
}: TabPassengerScheduleProps) {
  const appliedFilterResult = useSimulationStore((s) => s.flight.appliedFilterResult);

  // 탭이 보이지 않으면 렌더링하지 않음
  if (!visible) return null;

  return (
    <div className="pt-8">
      <div className="space-y-6">
        {/* 🆕 새로운 Parquet Filter - 임시 테스트용 */}
        {(appliedFilterResult as any)?.parquet_metadata && (
          <TabPassengerScheduleParquetFilter parquetMetadata={(appliedFilterResult as any).parquet_metadata} />
        )}

        {/* Passenger Show-up Result Chart */}
        {false && (
          <div className="mt-6">
            <TabPassengerScheduleResult />
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-8">
        <NextButton showPrevious={true} />
      </div>
    </div>
  );
}
