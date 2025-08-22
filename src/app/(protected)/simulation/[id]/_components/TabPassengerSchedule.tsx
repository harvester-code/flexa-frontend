'use client';

import React, { useMemo, useState } from 'react';
import { APIRequestLog } from '@/types/simulationTypes';
import { Card, CardContent } from '@/components/ui/Card';
import { useFlightScheduleData, usePassengerScheduleData } from '../../_hooks/useTabData';
import NextButton from './NextButton';
import TabPassengerScheduleAirlineSelector, { Airline } from './TabPassengerScheduleAirlineSelector';
import TabPassengerScheduleGroupConfiguration from './TabPassengerScheduleGroupConfiguration';
import TabPassengerScheduleResult from './TabPassengerScheduleResult';
import TabPassengerScheduleVirtualProfiles from './TabPassengerScheduleVirtualProfiles';

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

  // Flight Schedule 데이터에서 선택된 항공사 가져오기
  const { selectedConditions } = useFlightScheduleData();

  // Passenger Schedule 데이터
  const {
    destribution_conditions,
    apiResponseData,
    actions: { setDestributionConditions, setApiResponseData },
  } = usePassengerScheduleData();

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

  // 사용된 항공사 목록 (zustand destribution_conditions 기반)
  const usedAirlineIatas = useMemo(() => {
    const used = new Set<string>();
    destribution_conditions.forEach((condition) => {
      condition.airline_group.forEach((airline) => used.add(airline.iata));
    });
    return used;
  }, [destribution_conditions]);

  // 다음 사용 가능한 그룹 번호 찾기 (zustand 기반)
  const getNextAvailableGroupNumber = useMemo(() => {
    const usedNumbers = new Set(
      destribution_conditions.map((condition) => {
        const match = condition.name?.match(/Group (\d+)/);
        return match ? parseInt(match[1]) : 0;
      })
    );

    for (let i = 1; i <= destribution_conditions.length + 1; i++) {
      if (!usedNumbers.has(i)) {
        return i;
      }
    }
    return destribution_conditions.length + 1;
  }, [destribution_conditions]);

  // 다음 사용 가능한 색상 찾기 (zustand 기반)
  const getNextAvailableColor = useMemo(() => {
    const usedColors = new Set(destribution_conditions.map((condition) => condition.color));
    return colorPalette.find((color) => !usedColors.has(color)) || colorPalette[0];
  }, [destribution_conditions]);

  // Make Group 핸들러 (zustand 사용)
  const handleMakeGroup = (selectedAirlines: Airline[]) => {
    if (selectedAirlines.length === 0) return;

    const newCondition = {
      id: `group-${Date.now()}`,
      name: `Group ${getNextAvailableGroupNumber}`,
      airline_group: selectedAirlines,
      mean_minutes: 150, // 기본값: 2시간 30분 전
      std_dev_minutes: 30, // 기본값: ±30분
      color: getNextAvailableColor,
    };

    setDestributionConditions([...destribution_conditions, newCondition]);
  };

  // 설정된 그룹 업데이트 (zustand 사용)
  const handleUpdateConfiguredGroup = (groupId: string, updates: any) => {
    setDestributionConditions(
      destribution_conditions.map((condition) => (condition.id === groupId ? { ...condition, ...updates } : condition))
    );
  };

  // 설정된 그룹 삭제 (zustand 사용)
  const handleDeleteConfiguredGroup = (groupId: string) => {
    setDestributionConditions(destribution_conditions.filter((condition) => condition.id !== groupId));
  };

  // Complete Setup 핸들러 (GroupConfiguration에서 처리됨)
  const handleCompleteSetup = () => {
    // Complete setup logic handled in GroupConfiguration
  };

  // Setup 완료 가능 여부 (zustand 기반)
  const canCompleteSetup = destribution_conditions.length > 0;

  // 탭이 보이지 않으면 렌더링하지 않음
  if (!visible) return null;

  // 선택된 항공사가 없는 경우
  if ((selectedConditions.selectedAirlines || []).length === 0) {
    return (
      <div className="font-pretendard">
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </div>
            <p className="text-lg text-gray-500">Please select airlines from Flight Schedule first.</p>
            <p className="mt-2 text-sm text-gray-400">
              Selected airlines will appear here for passenger timing configuration.
            </p>
          </CardContent>
        </Card>
        <div className="mt-8 flex justify-end">
          <NextButton />
        </div>
      </div>
    );
  }

  return (
    <div className="font-pretendard pt-8">
      <div className="space-y-6">
        <TabPassengerScheduleVirtualProfiles />

        {/* Airline Selector */}
        <TabPassengerScheduleAirlineSelector
          availableAirlines={selectedConditions.selectedAirlines || []}
          usedAirlineIatas={usedAirlineIatas}
          onMakeGroup={handleMakeGroup}
        />

        {/* Group Configuration with Chart */}
        <TabPassengerScheduleGroupConfiguration
          simulationId={simulationId}
          destributionConditions={destribution_conditions}
          onUpdateConfiguredGroup={handleUpdateConfiguredGroup}
          onDeleteConfiguredGroup={handleDeleteConfiguredGroup}
          onCompleteSetup={handleCompleteSetup}
          canCompleteSetup={canCompleteSetup}
          apiRequestLog={apiRequestLog}
          setApiRequestLog={setApiRequestLog}
        />

        {/* Passenger Show-up Result Chart */}
        {apiResponseData && (
          <div className="mt-6">
            <TabPassengerScheduleResult />
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-8 flex justify-end">
        <NextButton />
      </div>
    </div>
  );
}
