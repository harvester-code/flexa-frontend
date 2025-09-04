'use client';

import React, { useMemo, useState } from 'react';
import { APIRequestLog } from '@/types/simulationTypes';
import { Card, CardContent } from '@/components/ui/Card';
import { useSimulationStore } from '../_stores';
import NextButton from './NextButton';
import TabPassengerScheduleAirlineSelector, { Airline } from './TabPassengerScheduleAirlineSelector';
import TabPassengerScheduleGroupConfiguration from './TabPassengerScheduleGroupConfiguration';
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
  const [loading, setLoading] = useState(false);

  // 🆕 통합 Store에서 직접 데이터 가져오기
  const selectedConditions = useSimulationStore((s) => s.flight.selectedConditions);
  const appliedFilterResult = useSimulationStore((s) => s.flight.appliedFilterResult);
  const pax_arrival_patterns = useSimulationStore((s) => s.passenger.pax_arrival_patterns);

  // 🆕 통합 Store에서 직접 액션들 가져오기
  const setPaxArrivalPatternRules = useSimulationStore((s) => s.setPaxArrivalPatternRules);
  const passengerData = useSimulationStore((state) => state.passenger);
  const addPaxArrivalPatternRule = useSimulationStore((s) => s.addPaxArrivalPatternRule);
  const updatePaxArrivalPatternRule = useSimulationStore((s) => s.updatePaxArrivalPatternRule);
  const removePaxArrivalPatternRule = useSimulationStore((s) => s.removePaxArrivalPatternRule);

  // UI 로딩 상태만 로컬로 관리

  // 예쁜 색상 팔레트 (10개)
  const colorPalette = [
    '#3b82f6', // blue
    '#10b981', // emerald
    '#8b5cf6', // violet
    '#f59e0b', // amber
    '#ef4444', // red
    '#06b6d4', // cyan
    '#ec4899', // pink
    '#6366f1', // indigo
    '#84cc16', // lime
    '#f97316', // orange
  ];

  // 사용된 항공사 목록 (zustand pax_arrival_patterns.rules 기반)
  const usedAirlineIatas = useMemo(() => {
    const used = new Set<string>();
    const rules = pax_arrival_patterns?.rules || [];
    rules.forEach((rule) => {
      const airlineIatas = rule?.conditions?.operating_carrier_iata || [];
      airlineIatas.forEach((iata) => used.add(iata));
    });
    return used;
  }, [pax_arrival_patterns?.rules]);

  // 다음 사용 가능한 그룹 번호 찾기 (pax_arrival_patterns.rules 기반)
  const getNextAvailableGroupNumber = useMemo(() => {
    const rules = pax_arrival_patterns?.rules || [];
    return rules.length + 1;
  }, [pax_arrival_patterns?.rules?.length]);

  // 다음 사용 가능한 색상 찾기 (인덱스 기반)
  const getNextAvailableColor = useMemo(() => {
    const rules = pax_arrival_patterns?.rules || [];
    return colorPalette[rules.length % colorPalette.length];
  }, [pax_arrival_patterns?.rules?.length, colorPalette]);

  // Make Group 핸들러 (zustand 사용)
  const handleMakeGroup = (selectedAirlines: Airline[]) => {
    if (selectedAirlines.length === 0) return;

    const newRule = {
      conditions: {
        operating_carrier_iata: selectedAirlines.map((airline) => airline.iata),
      },
      value: {
        mean: 150, // 기본값: 2시간 30분 전
        std: 30, // 기본값: ±30분
      },
    };

    addPaxArrivalPatternRule(newRule);
  };

  // 설정된 그룹 업데이트 (zustand 사용) - 인덱스 기반
  const handleUpdateConfiguredGroup = (ruleIndex: number, updates: any) => {
    const rules = passengerData.pax_arrival_patterns?.rules || [];
    const currentRule = rules[ruleIndex];
    if (!currentRule) return;

    // Updates 객체를 pax_arrival_patterns.rules 형태로 변환
    const ruleUpdates: { conditions: Record<string, string[]>; value: { mean: number; std: number } } = {
      conditions: { ...currentRule.conditions },
      value: { ...currentRule.value },
    };

    if (updates.airline_group) {
      ruleUpdates.conditions = {
        operating_carrier_iata: updates.airline_group.map((airline: Airline) => airline.iata),
      };
    }
    if (updates.mean_minutes !== undefined || updates.std_dev_minutes !== undefined) {
      ruleUpdates.value = {
        mean: updates.mean_minutes !== undefined ? updates.mean_minutes : currentRule.value.mean,
        std: updates.std_dev_minutes !== undefined ? updates.std_dev_minutes : currentRule.value.std,
      };
    }

    updatePaxArrivalPatternRule(ruleIndex, ruleUpdates);
  };

  // 설정된 그룹 삭제 (zustand 사용) - 인덱스 기반
  const handleDeleteConfiguredGroup = (ruleIndex: number) => {
    removePaxArrivalPatternRule(ruleIndex);
  };

  // Complete Setup 핸들러 (GroupConfiguration에서 처리됨)
  const handleCompleteSetup = () => {
    // Complete setup logic handled in GroupConfiguration
  };

  // Setup 완료 가능 여부 (pax_arrival_patterns.rules 기반)
  const canCompleteSetup = (pax_arrival_patterns?.rules || []).length > 0;

  // 탭이 보이지 않으면 렌더링하지 않음
  if (!visible) return null;

  // 🚧 임시 비활성화: 새로운 ParquetFilter 개발을 위해 항공사 선택 조건 제거
  // 선택된 항공사가 없는 경우
  // if ((selectedConditions?.selectedAirlines || []).length === 0) {
  //   return (
  //     <div>
  //       <Card>
  //         <CardContent className="py-12 text-center">
  //           <div className="mb-4">
  //             <svg
  //               className="mx-auto h-12 w-12 text-muted-foreground"
  //               fill="none"
  //               viewBox="0 0 24 24"
  //               stroke="currentColor"
  //             >
  //               <path
  //                 strokeLinecap="round"
  //                 strokeLinejoin="round"
  //                 strokeWidth={2}
  //                 d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
  //               />
  //             </svg>
  //           </div>
  //           <p className="text-lg text-default-500">Please select airlines from Flight Schedule first.</p>
  //           <p className="mt-2 text-sm text-muted-foreground">
  //             Selected airlines will appear here for passenger timing configuration.
  //           </p>
  //         </CardContent>
  //       </Card>
  //       <div className="mt-8">
  //         <NextButton showPrevious={true} />
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="pt-8">
      <div className="space-y-6">
        {/* 🆕 새로운 Parquet Filter - 임시 테스트용 */}
        {(appliedFilterResult as any)?.parquet_metadata && (
          <TabPassengerScheduleParquetFilter parquetMetadata={(appliedFilterResult as any).parquet_metadata} />
        )}

        {/* Airline Selector */}
        <TabPassengerScheduleAirlineSelector
          availableAirlines={[]} // 🚧 임시로 빈 배열 - 나중에 parquet_metadata에서 추출 예정
          usedAirlineIatas={usedAirlineIatas}
          onMakeGroup={handleMakeGroup}
        />

        {/* Group Configuration with Chart */}
        <TabPassengerScheduleGroupConfiguration
          simulationId={simulationId}
          destributionConditions={(pax_arrival_patterns?.rules || []).map((rule, index) => ({
            id: `rule-${index}`,
            name: `Group ${index + 1}`,
            airline_group: (rule?.conditions?.operating_carrier_iata || []).map((iata) => ({
              iata,
              name: iata, // 임시로 IATA를 이름으로 사용
            })),
            mean_minutes: rule?.value?.mean || 0,
            std_dev_minutes: rule?.value?.std || 0,
            color: colorPalette[index % colorPalette.length],
          }))}
          onUpdateConfiguredGroup={(groupId, updates) => {
            // groupId에서 인덱스 추출 (rule-0 → 0)
            const index = parseInt(groupId.replace('rule-', ''));
            handleUpdateConfiguredGroup(index, updates);
          }}
          onDeleteConfiguredGroup={(groupId) => {
            // groupId에서 인덱스 추출 (rule-0 → 0)
            const index = parseInt(groupId.replace('rule-', ''));
            handleDeleteConfiguredGroup(index);
          }}
          onCompleteSetup={handleCompleteSetup}
          canCompleteSetup={canCompleteSetup}
          apiRequestLog={apiRequestLog}
          setApiRequestLog={setApiRequestLog}
        />

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
