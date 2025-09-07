'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { ChevronRight, Plane, Plus, Save, Users, X } from 'lucide-react';
import { ProcessStep } from '@/types/simulationTypes';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { formatProcessName } from '@/lib/utils';

// 시설 타입 정의
type FacilityItem = {
  name: string;
  isActive: boolean;
};

interface ProcessConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  processData?: {
    index: number;
    name: string;
    facilities: string[];
    travelTime: number;
  } | null;
  onSave: (data: {
    name: string;
    facilities: FacilityItem[];
    travelTime: number;
    zoneFacilityCounts?: Record<string, number>;
  }) => void;
  mode: 'create' | 'edit';
  processFlow?: ProcessStep[]; // 🆕 현재 프로세스 플로우
}

export default function ProcessConfigurationModal({
  isOpen,
  onClose,
  processData,
  onSave,
  mode,
  processFlow = [], // 🆕 현재 프로세스 플로우
}: ProcessConfigurationModalProps) {
  const [processName, setProcessName] = useState('');
  const [facilitiesInput, setFacilitiesInput] = useState('');
  const [facilities, setFacilities] = useState<FacilityItem[]>([]);
  const [travelTime, setTravelTime] = useState(0);
  // 🆕 Zone별 시설 개수 관리
  const [zoneFacilityCounts, setZoneFacilityCounts] = useState<Record<string, number>>({});

  // 시설명 확장 함수 (기존 로직과 동일)
  const expandFacilityNames = useCallback((input: string): FacilityItem[] => {
    let expanded = input.toUpperCase(); // 모든 입력을 대문자로 변환

    // 범용적 숫자 범위 패턴 처리
    expanded = expanded.replace(/(.*?)(\d+)~(\d+)/g, (match, beforeLastNum, startNum, endNum) => {
      const start = parseInt(startNum);
      const end = parseInt(endNum);

      if (start > end) return '';

      const items: string[] = [];
      for (let i = start; i <= end; i++) {
        items.push(beforeLastNum + i);
      }
      return items.join(',');
    });

    // 알파벳 패턴 처리
    expanded = expanded.replace(/([A-Za-z]*)([A-Z])~([A-Z])/g, (match, prefix, start, end) => {
      const startCode = start.charCodeAt(0);
      const endCode = end.charCodeAt(0);

      if (startCode > endCode) return match;

      const items: string[] = [];
      for (let i = startCode; i <= endCode; i++) {
        items.push(prefix + String.fromCharCode(i));
      }
      return items.join(',');
    });

    // 최종 시설 목록 생성
    const facilityList = expanded
      .split(',')
      .map((f) => f.trim())
      .filter((f) => f.length > 0)
      .map((name) => ({
        name,
        isActive: true,
      }));

    return facilityList;
  }, []);

  // 🆕 Zone별 시설 개수 변경 함수
  const handleZoneCountChange = useCallback((zoneName: string, count: number) => {
    setZoneFacilityCounts((prev) => ({
      ...prev,
      [zoneName]: Math.max(1, Math.min(50, count)), // 1~50 사이로 제한
    }));
  }, []);

  // Modal 열릴 때 데이터 초기화
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && processData) {
        setProcessName(processData.name);
        setFacilitiesInput(processData.facilities.join(','));
        setTravelTime(processData.travelTime);
        setFacilities(processData.facilities.map((name) => ({ name, isActive: true })));
        // 🆕 편집 모드에서는 기본값 1개로 초기화
        const editZoneCounts: Record<string, number> = {};
        processData.facilities.forEach((name) => {
          editZoneCounts[name] = 1;
        });
        setZoneFacilityCounts(editZoneCounts);
      } else {
        // 새로 생성하는 경우 초기화
        setProcessName('');
        setFacilitiesInput('');
        setTravelTime(0);
        setFacilities([]);
        setZoneFacilityCounts({}); // 🆕 Zone 개수도 초기화
      }
    }
  }, [isOpen, mode, processData]);

  // 시설 입력 변경 처리
  const handleFacilityInputChange = useCallback(
    (value: string) => {
      setFacilitiesInput(value);
      if (value.trim()) {
        const expandedFacilities = expandFacilityNames(value);
        setFacilities(expandedFacilities);
      } else {
        setFacilities([]);
      }
    },
    [expandFacilityNames]
  );

  // 시설 토글
  const toggleFacility = useCallback((facilityName: string) => {
    setFacilities((prev) =>
      prev.map((facility) =>
        facility.name === facilityName ? { ...facility, isActive: !facility.isActive } : facility
      )
    );
  }, []);

  // 저장 처리
  const handleSave = useCallback(() => {
    if (!processName.trim() || facilities.length === 0) return;

    onSave({
      name: processName,
      facilities: facilities,
      travelTime: travelTime,
      zoneFacilityCounts, // 🆕 Zone별 시설 개수 정보도 함께 전달
    });

    onClose();
  }, [processName, facilities, travelTime, zoneFacilityCounts, onSave, onClose]);

  // 엔터키 처리
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && processName.trim() && facilities.length > 0) {
        e.preventDefault();
        handleSave();
      }
    },
    [handleSave, processName, facilities]
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            {mode === 'create' ? 'Create New Process' : 'Edit Process'}
          </DialogTitle>
        </DialogHeader>

        {/* 🆕 Current Process Flow Display */}
        {processFlow.length > 0 && (
          <div className="rounded-lg border bg-gray-50 p-4">
            <div className="mb-3 text-sm font-medium text-gray-700">Current Process Flow:</div>
            <div className="flex items-center gap-2 overflow-x-auto">
              {/* Entry */}
              <div className="flex flex-shrink-0 items-center gap-2 rounded-md border border-primary/20 bg-primary/10 px-2 py-1">
                <Users className="h-3 w-3 text-primary" />
                <span className="text-xs font-medium text-gray-800">Entry</span>
              </div>

              {/* Process Cards */}
              {processFlow.map((step, index) => (
                <React.Fragment key={`${step.name}-${step.step}`}>
                  {/* Travel Time + Arrow */}
                  <div className="flex flex-shrink-0 items-center gap-1">
                    {step.travel_time_minutes != null && step.travel_time_minutes > 0 && (
                      <span className="text-xs text-primary">{step.travel_time_minutes}min</span>
                    )}
                    <ChevronRight className="h-3 w-3 text-primary" />
                  </div>

                  {/* Process Card */}
                  <div className="flex flex-shrink-0 items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-2 py-1">
                    <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                    <span className="text-xs font-medium text-gray-800">{formatProcessName(step.name)}</span>
                  </div>
                </React.Fragment>
              ))}

              {/* Arrow to Gate */}
              <ChevronRight className="h-3 w-3 flex-shrink-0 text-primary" />

              {/* Gate */}
              <div className="flex flex-shrink-0 items-center gap-2 rounded-md border border-primary/20 bg-primary/10 px-2 py-1">
                <Plane className="h-3 w-3 text-primary" />
                <span className="text-xs font-medium text-gray-800">Gate</span>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Process Name */}
          <div>
            <label className="mb-2 block text-sm font-medium text-default-900">Process Name</label>
            <Input
              type="text"
              placeholder="e.g., Check In, Security, Immigration"
              value={processName}
              onChange={(e) => setProcessName(e.target.value)}
              onKeyDown={handleKeyDown}
              required
            />
          </div>

          {/* Travel Time */}
          <div>
            <label className="mb-2 block text-sm font-medium text-default-900">Travel Time (minutes)</label>
            <Input
              type="text"
              value={travelTime}
              onChange={(e) => {
                const numericValue = e.target.value.replace(/[^0-9]/g, '');
                const time = parseInt(numericValue) || 0;
                const clampedTime = Math.min(60, Math.max(0, time));
                setTravelTime(clampedTime);
              }}
              onClick={(e) => e.target.select()}
              placeholder="0"
            />
          </div>

          {/* Facilities */}
          <div>
            <label className="mb-2 block text-sm font-medium text-default-900">Facility Names</label>
            <Input
              type="text"
              placeholder="e.g., A~E, Gate1~5, DG12_3-4-6-2~5, Counter1,Counter2"
              value={facilitiesInput}
              onChange={(e) => handleFacilityInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              required
            />

            {/* Facility Badges */}
            {facilities.length > 0 && (
              <div className="mt-3">
                <p className="mb-2 text-sm font-medium text-default-900">Facilities (click to toggle):</p>
                <div className="flex flex-wrap gap-2">
                  {facilities.map((facility) => (
                    <Button
                      key={facility.name}
                      variant="ghost"
                      type="button"
                      onClick={() => toggleFacility(facility.name)}
                      className={`inline-flex items-center rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors ${
                        facility.isActive
                          ? 'bg-primary text-white hover:bg-primary/80'
                          : 'bg-gray-200 text-default-500 hover:bg-gray-300'
                      }`}
                    >
                      {facility.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 🆕 Zone별 시설 개수 설정 */}
          {facilities.length > 0 && (
            <div>
              <label className="mb-3 block text-sm font-medium text-default-900">Facility Configuration</label>
              <div className="space-y-3">
                {facilities.map((facility) => (
                  <div
                    key={facility.name}
                    className="flex items-center justify-between rounded-lg border bg-gray-50 px-4 py-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">Zone {facility.name}</span>
                      <span className="text-xs text-gray-500">facilities</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="1"
                        max="50"
                        value={zoneFacilityCounts[facility.name] || 1}
                        onChange={(e) => {
                          const count = parseInt(e.target.value) || 1;
                          handleZoneCountChange(facility.name, count);
                        }}
                        className="w-16 text-center"
                      />
                      <span className="text-sm text-gray-500">ea</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onClose}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!processName.trim() || facilities.length === 0}>
            <Save className="mr-2 h-4 w-4" />
            {mode === 'create' ? 'Create Process' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
