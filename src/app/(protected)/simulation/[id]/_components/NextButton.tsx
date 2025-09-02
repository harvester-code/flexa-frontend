'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  useFlightScheduleStore,
  usePassengerScheduleStore,
  useProcessingProceduresStore,
  useScenarioProfileStore,
  useSimulationStore,
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
  // 🆕 통합 store에서 workflow 정보 가져오기
  const currentStep = useSimulationStore((s) => s.workflow.currentStep);
  const step1Completed = useSimulationStore((s) => s.workflow.step1Completed);
  const step2Completed = useSimulationStore((s) => s.workflow.step2Completed);
  const step3Completed = useSimulationStore((s) => s.workflow.step3Completed);
  const setCurrentStep = useSimulationStore((s) => s.setCurrentStep);

  // 🚧 기존 scenario profile store도 유지 (다른 탭에서 사용 중일 수 있음)
  const currentScenarioTab = useScenarioProfileStore((s) => s.currentScenarioTab);
  const setCurrentScenarioTab = useScenarioProfileStore((s) => s.setCurrentScenarioTab);

  // 각 탭의 완료 상태에 따라 Next 버튼 활성화 제어
  const getCanGoNext = () => {
    if (currentScenarioTab >= 2) return false; // 마지막 탭에서는 Next 버튼 비활성화

    switch (currentScenarioTab) {
      case 0: // Flight Schedule
        return step1Completed; // ✅ appliedFilterResult 존재 여부로 판단
      case 1: // Passenger Schedule
        return step2Completed;
      case 2: // Processing Procedures
        return step3Completed;
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
      const nextTab = currentScenarioTab + 1;
      setCurrentScenarioTab(nextTab); // 기본 동작: 다음 탭으로 이동
      setCurrentStep(nextTab + 1); // ✅ workflow currentStep도 동기화 (tab 0 = step 1)
    }
  };

  const handlePrev = () => {
    if (onPreviousClick) {
      onPreviousClick(); // 커스텀 핸들러가 있으면 실행
    } else if (canGoPrev) {
      const prevTab = currentScenarioTab - 1;
      setCurrentScenarioTab(prevTab); // 기본 동작: 이전 탭으로 이동
      setCurrentStep(prevTab + 1); // ✅ workflow currentStep도 동기화 (tab 0 = step 1)
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
