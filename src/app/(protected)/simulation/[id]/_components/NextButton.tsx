'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  useFacilityConnectionStore,
  useFlightScheduleStore,
  usePassengerScheduleStore,
  useProcessingProceduresStore,
  useScenarioProfileStore,
} from '../_stores';

interface NextButtonProps {
  className?: string;
  disabled?: boolean; // 추가적인 비활성화 조건
  onClick?: () => void; // 커스텀 클릭 핸들러 (선택사항)
  showPrevious?: boolean; // Previous 버튼 표시 여부
  previousDisabled?: boolean; // Previous 버튼 비활성화
  onPreviousClick?: () => void; // Previous 클릭 핸들러
}

export default function NextButton({
  className = '',
  disabled = false,
  onClick,
  showPrevious = false,
  previousDisabled = false,
  onPreviousClick,
}: NextButtonProps) {
  // 개별 store에서 필요한 데이터만 직접 가져오기
  const currentScenarioTab = useScenarioProfileStore((s) => s.currentScenarioTab);
  const setCurrentScenarioTab = useScenarioProfileStore((s) => s.setCurrentScenarioTab);

  const flightScheduleCompleted = useFlightScheduleStore((s) => s.isCompleted);
  const passengerScheduleCompleted = usePassengerScheduleStore((s) => s.isCompleted);
  const processingProceduresCompleted = useProcessingProceduresStore((s) => s.isCompleted);
  const facilityConnectionCompleted = useFacilityConnectionStore((s) => s.isCompleted);

  // 각 탭의 완료 상태에 따라 Next 버튼 활성화 제어
  const getCanGoNext = () => {
    if (currentScenarioTab >= 3) return false; // 마지막 탭에서는 Next 버튼 비활성화

    switch (currentScenarioTab) {
      case 0: // Flight Schedule
        return flightScheduleCompleted;
      case 1: // Passenger Schedule
        return passengerScheduleCompleted;
      case 2: // Processing Procedures
        return processingProceduresCompleted;
      case 3: // Facility Connection
        return facilityConnectionCompleted;
      default:
        return false;
    }
  };

  const canGoNext = getCanGoNext() && !disabled;
  const canGoPrev = currentScenarioTab > 0 && !previousDisabled;

  const handleNext = () => {
    if (onClick) {
      onClick(); // 커스텀 핸들러가 있으면 실행
    } else if (canGoNext) {
      setCurrentScenarioTab(currentScenarioTab + 1); // 기본 동작: 다음 탭으로 이동
    }
  };

  const handlePrev = () => {
    if (onPreviousClick) {
      onPreviousClick(); // 커스텀 핸들러가 있으면 실행
    } else if (canGoPrev) {
      setCurrentScenarioTab(currentScenarioTab - 1); // 기본 동작: 이전 탭으로 이동
    }
  };

  if (showPrevious) {
    return (
      <div className={`flex justify-between ${className}`}>
        <Button variant="outline" onClick={handlePrev} disabled={!canGoPrev}>
          <ChevronLeft className="h-4 w-4" />
          Prev
        </Button>

        <Button onClick={handleNext} disabled={!canGoNext}>
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className={`flex justify-end ${className}`}>
      <Button onClick={handleNext} disabled={!canGoNext}>
        Next
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
