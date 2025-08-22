'use client';

import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { Button } from '@/components/ui/Button';
import { useScenarioStore } from '../../_store/useScenarioStore';

interface NextButtonProps {
  className?: string;
  disabled?: boolean; // 추가적인 비활성화 조건
  onClick?: () => void; // 커스텀 클릭 핸들러 (선택사항)
}

export default function NextButton({ className = '', disabled = false, onClick }: NextButtonProps) {
  const {
    currentScenarioTab,
    setCurrentScenarioTab,
    flightScheduleCompleted,
    passengerScheduleCompleted,
    airportProcessingCompleted,
    facilityConnectionCompleted,
    facilityCapacityCompleted,
  } = useScenarioStore(
    useShallow((s) => ({
      currentScenarioTab: s.scenarioProfile.currentScenarioTab,
      setCurrentScenarioTab: s.scenarioProfile.actions.setCurrentScenarioTab,
      flightScheduleCompleted: s.flightSchedule.isCompleted,
      passengerScheduleCompleted: s.passengerSchedule.isCompleted,
      airportProcessingCompleted: s.airportProcessing.isCompleted,
      facilityConnectionCompleted: s.facilityConnection.isCompleted,
      facilityCapacityCompleted: s.facilityCapacity.isCompleted,
    }))
  );

  // 각 탭의 완료 상태에 따라 Next 버튼 활성화 제어
  const getCanGoNext = () => {
    if (currentScenarioTab >= 5) return false; // 마지막 탭에서는 Next 버튼 비활성화

    switch (currentScenarioTab) {
      case 0: // Scenario Overview - 항상 활성화
        return true;
      case 1: // Flight Schedule
        return flightScheduleCompleted;
      case 2: // Passenger Schedule
        return passengerScheduleCompleted;
      case 3: // Airport Processing (Processing Procedures)
        return airportProcessingCompleted;
      case 4: // Facility Connection
        return facilityConnectionCompleted;
      case 5: // Facility Capacity
        return facilityCapacityCompleted;
      default:
        return false;
    }
  };

  const canGoNext = getCanGoNext() && !disabled;

  const handleNext = () => {
    if (onClick) {
      onClick(); // 커스텀 핸들러가 있으면 실행
    } else if (canGoNext) {
      setCurrentScenarioTab(currentScenarioTab + 1); // 기본 동작: 다음 탭으로 이동
    }
  };

  return (
    <Button onClick={handleNext} disabled={!canGoNext} className={`flex items-center gap-2 ${className}`}>
      Next
      <ChevronRight className="h-4 w-4" />
    </Button>
  );
}
