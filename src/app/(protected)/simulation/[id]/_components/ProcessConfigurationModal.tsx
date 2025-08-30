'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';

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
  }) => void;
  mode: 'create' | 'edit';
}

export default function ProcessConfigurationModal({
  isOpen,
  onClose,
  processData,
  onSave,
  mode,
}: ProcessConfigurationModalProps) {
  const [processName, setProcessName] = useState('');
  const [facilitiesInput, setFacilitiesInput] = useState('');
  const [facilities, setFacilities] = useState<FacilityItem[]>([]);
  const [travelTime, setTravelTime] = useState(0);

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

  // Modal 열릴 때 데이터 초기화
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && processData) {
        setProcessName(processData.name);
        setFacilitiesInput(processData.facilities.join(','));
        setTravelTime(processData.travelTime);
        setFacilities(processData.facilities.map(name => ({ name, isActive: true })));
      } else {
        // 새로 생성하는 경우 초기화
        setProcessName('');
        setFacilitiesInput('');
        setTravelTime(0);
        setFacilities([]);
      }
    }
  }, [isOpen, mode, processData]);

  // 시설 입력 변경 처리
  const handleFacilityInputChange = useCallback((value: string) => {
    setFacilitiesInput(value);
    if (value.trim()) {
      const expandedFacilities = expandFacilityNames(value);
      setFacilities(expandedFacilities);
    } else {
      setFacilities([]);
    }
  }, [expandFacilityNames]);

  // 시설 토글
  const toggleFacility = useCallback((facilityName: string) => {
    setFacilities(prev => 
      prev.map(facility =>
        facility.name === facilityName 
          ? { ...facility, isActive: !facility.isActive }
          : facility
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
    });

    onClose();
  }, [processName, facilities, travelTime, onSave, onClose]);

  // 엔터키 처리
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && processName.trim() && facilities.length > 0) {
      e.preventDefault();
      handleSave();
    }
  }, [handleSave, processName, facilities]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            {mode === 'create' ? 'Create New Process' : 'Edit Process'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Process Name */}
          <div>
            <label className="mb-2 block text-sm font-medium text-default-900">
              Process Name
            </label>
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
            <label className="mb-2 block text-sm font-medium text-default-900">
              Travel Time (minutes)
            </label>
            <Input
              type="number"
              min="0"
              max="60"
              value={travelTime}
              onChange={(e) => setTravelTime(parseInt(e.target.value) || 0)}
              placeholder="0"
            />
          </div>

          {/* Facilities */}
          <div>
            <label className="mb-2 block text-sm font-medium text-default-900">
              Facility Names
            </label>
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
                <p className="mb-2 text-sm font-medium text-default-900">
                  Facilities (click to toggle):
                </p>
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
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onClose}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!processName.trim() || facilities.length === 0}
          >
            <Save className="mr-2 h-4 w-4" />
            {mode === 'create' ? 'Create Process' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
