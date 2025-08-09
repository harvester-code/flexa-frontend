'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useScenarioStore } from '@/stores/useScenarioStore';
import { Button } from '@/components/ui/Button';

interface TabNavigationProps {
  className?: string;
}

export default function TabNavigation({ className = '' }: TabNavigationProps) {
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

  const canGoPrev = currentScenarioTab > 0;

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

  const canGoNext = getCanGoNext();

  const handlePrev = () => {
    if (canGoPrev) {
      setCurrentScenarioTab(currentScenarioTab - 1);
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      setCurrentScenarioTab(currentScenarioTab + 1);
    }
  };

  return (
    <div className={`mt-8 flex justify-between ${className}`}>
      <Button variant="outline" onClick={handlePrev} disabled={!canGoPrev} className="flex items-center gap-2">
        <ChevronLeft className="h-4 w-4" />
        Prev
      </Button>

      <Button onClick={handleNext} disabled={!canGoNext} className="flex items-center gap-2">
        Next
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
