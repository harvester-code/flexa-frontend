'use client';

import React from 'react';
import { APIRequestLog } from '@/types/simulationTypes';
import { useSimulationStore } from '../../_stores';
import PassengerFilterConditions from './PassengerFilterConditions';
import PassengerResultChart from './PassengerResultChart';

interface TabPassengerScheduleProps {
  simulationId: string;
  visible: boolean;
  apiRequestLog: APIRequestLog | null;
  setApiRequestLog: (log: APIRequestLog | null) => void;
}

interface AirlineShowUpTime {
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
  const passengerData = useSimulationStore((s) => s.passenger);

  // 탭이 보이지 않으면 렌더링하지 않음
  if (!visible) return null;

  return (
    <div className="pt-8">
      <div className="space-y-6">
        {/* 🎯 Configure Passenger Data - 독립적인 첫 번째 컴포넌트 */}
        {(appliedFilterResult as any)?.parquet_metadata && (
          <PassengerFilterConditions
            parquetMetadata={(appliedFilterResult as any).parquet_metadata}
            simulationId={simulationId}
            apiRequestLog={apiRequestLog}
            setApiRequestLog={setApiRequestLog}
          />
        )}

        {/* 🎯 Passenger Schedule Chart - 독립적인 두 번째 컴포넌트 */}
        {passengerData.chartResult && <PassengerResultChart />}
      </div>
    </div>
  );
}
