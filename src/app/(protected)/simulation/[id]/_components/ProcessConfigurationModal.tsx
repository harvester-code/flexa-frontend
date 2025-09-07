'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Building2, ChevronRight, Clock, Filter, MapPin, Plane, Plus, Save, Tag, Trash2, Users, X } from 'lucide-react';
import { ProcessStep } from '@/types/simulationTypes';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { formatProcessName } from '@/lib/utils';

// 시설 타입 정의
type FacilityItem = {
  name: string;
  isActive: boolean;
};

// Entry Condition 타입 정의
type EntryCondition = {
  field: string;
  values: string[];
};

// 조건 필드 옵션들
const CONDITION_FIELDS = [
  { id: 'nationality', label: 'Nationality', values: ['domestic', 'international', 'schengen', 'non_schengen'] },
  { id: 'operating_carrier_iata', label: 'Operating Carrier', values: ['KE', 'OZ', 'LJ', 'TW', '7C', 'BX'] },
  { id: 'profile', label: 'Profile', values: ['general', 'business', 'wheelchair', 'crew', 'infant'] },
  { id: 'aircraft_type', label: 'Aircraft Type', values: ['A380', 'B777', 'A330', 'B737', 'A320'] },
  { id: 'flight_type', label: 'Flight Type', values: ['departure', 'arrival', 'domestic', 'international'] },
];

interface ProcessConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  processData?: {
    index: number;
    name: string;
    facilities: string[];
    travelTime: number;
    entryConditions?: EntryCondition[];
  } | null;
  onSave: (data: {
    name: string;
    facilities: FacilityItem[];
    travelTime: number;
    entryConditions: EntryCondition[];
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
  const [travelTime, setTravelTime] = useState(5);
  // 🆕 Zone별 시설 개수 관리
  const [zoneFacilityCounts, setZoneFacilityCounts] = useState<Record<string, number>>({});
  const [defaultFacilityCount, setDefaultFacilityCount] = useState<number>(10);
  const [editingZone, setEditingZone] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');

  // 🆕 Entry Conditions 관리
  const [entryConditions, setEntryConditions] = useState<EntryCondition[]>([]);
  const [selectedField, setSelectedField] = useState<string>('');
  const [selectedValues, setSelectedValues] = useState<string[]>([]);

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
      [zoneName]: Math.max(0, Math.min(50, count)), // 0~50 사이로 제한
    }));
  }, []);

  // 🆕 인라인 편집 관련 함수들
  const startEditing = useCallback(
    (zoneName: string) => {
      const currentCount = zoneFacilityCounts[zoneName] || defaultFacilityCount;
      setEditingZone(zoneName);
      setEditingValue(currentCount.toString());
    },
    [zoneFacilityCounts, defaultFacilityCount]
  );

  const finishEditing = useCallback(() => {
    if (editingZone) {
      const newCount = editingValue === '' ? 0 : parseInt(editingValue);
      const count = Math.max(0, Math.min(50, newCount));
      handleZoneCountChange(editingZone, count);
    }
    setEditingZone(null);
    setEditingValue('');
  }, [editingZone, editingValue, handleZoneCountChange]);

  const cancelEditing = useCallback(() => {
    setEditingZone(null);
    setEditingValue('');
  }, []);

  const handleEditKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        finishEditing();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelEditing();
      }
    },
    [finishEditing, cancelEditing]
  );

  // 🆕 Entry Condition 관련 핸들러들
  const addEntryCondition = useCallback(() => {
    if (selectedField && selectedValues.length > 0) {
      // 기존 조건이 있으면 업데이트, 없으면 추가
      const existingIndex = entryConditions.findIndex((cond) => cond.field === selectedField);

      if (existingIndex >= 0) {
        const updated = [...entryConditions];
        updated[existingIndex] = { field: selectedField, values: [...selectedValues] };
        setEntryConditions(updated);
      } else {
        setEntryConditions((prev) => [...prev, { field: selectedField, values: [...selectedValues] }]);
      }

      // 입력 초기화
      setSelectedField('');
      setSelectedValues([]);
    }
  }, [selectedField, selectedValues, entryConditions]);

  const removeEntryCondition = useCallback((index: number) => {
    setEntryConditions((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const toggleValue = useCallback((value: string) => {
    setSelectedValues((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  }, []);

  // Modal 열릴 때 데이터 초기화
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && processData) {
        setProcessName(processData.name);
        setFacilitiesInput(processData.facilities.join(','));
        setTravelTime(processData.travelTime);
        setFacilities(processData.facilities.map((name) => ({ name, isActive: true })));
        setEntryConditions(processData.entryConditions || []);
        // 🆕 편집 모드에서는 기본값 10개로 초기화
        const editZoneCounts: Record<string, number> = {};
        processData.facilities.forEach((name) => {
          editZoneCounts[name] = 10;
        });
        setZoneFacilityCounts(editZoneCounts);
      } else {
        // 새로 생성하는 경우 초기화
        setProcessName('');
        setFacilitiesInput('');
        setTravelTime(5);
        setFacilities([]);
        setEntryConditions([]);
        setSelectedField('');
        setSelectedValues([]);
        setZoneFacilityCounts({});
        setDefaultFacilityCount(10); // 기본값으로 초기화
        setEditingZone(null);
        setEditingValue('');
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
        // 🆕 Zone Names가 입력되면 바로 기본값을 각 Zone에 적용
        const newCounts: Record<string, number> = {};
        expandedFacilities.forEach((facility) => {
          newCounts[facility.name] = defaultFacilityCount;
        });
        setZoneFacilityCounts(newCounts);
      } else {
        setFacilities([]);
        setZoneFacilityCounts({});
      }
    },
    [expandFacilityNames, defaultFacilityCount]
  );

  // 저장 처리
  const handleSave = useCallback(() => {
    if (!processName.trim() || !facilitiesInput.trim()) return;

    onSave({
      name: processName,
      facilities: facilities,
      travelTime: travelTime,
      entryConditions: entryConditions,
      zoneFacilityCounts, // 🆕 Zone별 시설 개수 정보도 함께 전달
    });

    onClose();
  }, [processName, facilities, travelTime, entryConditions, zoneFacilityCounts, onSave, onClose]);

  // 엔터키 처리
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && processName.trim() && facilitiesInput.trim()) {
        e.preventDefault();
        handleSave();
      }
    },
    [handleSave, processName, facilitiesInput]
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
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
              <Tag className="mr-2 inline h-4 w-4" />
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

          {/* Entry Conditions */}
          <div>
            <label className="mb-3 block text-sm font-medium text-default-900">
              <Filter className="mr-2 inline h-4 w-4" />
              Entry Conditions
            </label>
            <div className="rounded-lg border bg-gray-50 p-4">
              {/* Condition Builder */}
              <div className="flex gap-6">
                {/* Left: Field Selection */}
                <div className="flex-1">
                  <label className="mb-2 block text-xs font-medium text-gray-600">Search Criteria</label>
                  <div className="grid grid-cols-1 gap-2">
                    {CONDITION_FIELDS.map((field) => (
                      <button
                        key={field.id}
                        type="button"
                        onClick={() => setSelectedField(field.id)}
                        className={`rounded border p-2 text-left text-sm transition-colors ${
                          selectedField === field.id
                            ? 'border-primary bg-primary text-white'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        {field.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right: Value Selection */}
                <div className="flex-1">
                  <label className="mb-2 block text-xs font-medium text-gray-600">Values</label>
                  {selectedField ? (
                    <div className="space-y-2">
                      <div className="min-h-[200px] space-y-1">
                        {CONDITION_FIELDS.find((f) => f.id === selectedField)?.values.map((value) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => toggleValue(value)}
                            className={`block w-full rounded border p-2 text-left text-sm transition-colors ${
                              selectedValues.includes(value)
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                          >
                            {value}
                          </button>
                        ))}
                      </div>

                      {selectedValues.length > 0 && (
                        <Button type="button" onClick={addEntryCondition} className="w-full" size="sm">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Condition
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="flex min-h-[200px] items-center justify-center rounded-lg border-2 border-dashed border-gray-200">
                      <p className="text-sm text-gray-500">Select a criteria to see values</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Added Conditions */}
              {entryConditions.length > 0 && (
                <div className="mt-4 border-t pt-4">
                  <label className="mb-2 block text-xs font-medium text-gray-600">Added Conditions</label>
                  <div className="space-y-2">
                    {entryConditions.map((condition, index) => (
                      <div key={index} className="flex items-center justify-between rounded border bg-white p-3">
                        <div>
                          <span className="text-sm font-medium text-gray-900">
                            {CONDITION_FIELDS.find((f) => f.id === condition.field)?.label}
                          </span>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {condition.values.map((value) => (
                              <Badge key={value} variant="secondary" className="text-xs">
                                {value}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeEntryCondition(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Zone Configuration Setup */}
          <div className="grid grid-cols-10 gap-3">
            {/* Zone Names - 6/10 */}
            <div className="col-span-6">
              <label className="mb-2 block text-sm font-medium text-default-900">
                <MapPin className="mr-2 inline h-4 w-4" />
                Zone Names
              </label>
              <Input
                type="text"
                placeholder="e.g., A~E, Gate1~5"
                value={facilitiesInput}
                onChange={(e) => handleFacilityInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                required
              />
            </div>

            {/* Walking Time to Zone - 2/10 */}
            <div className="col-span-2">
              <label className="mb-2 block text-sm font-medium text-default-900">
                <Clock className="mr-2 inline h-4 w-4" />
                Walking time
              </label>
              <div className="relative">
                <Input
                  type="text"
                  value={travelTime}
                  onChange={(e) => {
                    const numericValue = e.target.value.replace(/[^0-9]/g, '');
                    if (numericValue === '') {
                      setTravelTime(0);
                    } else {
                      const time = parseInt(numericValue);
                      const clampedTime = Math.min(60, Math.max(0, time));
                      setTravelTime(clampedTime);
                    }
                  }}
                  onClick={(e) => e.target.select()}
                  placeholder="5"
                  className="pr-8 text-center"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-500">min</span>
              </div>
            </div>

            {/* Facilities per zone - 2/10 */}
            <div className="col-span-2">
              <label className="mb-2 block text-sm font-medium text-default-900">
                <Building2 className="mr-2 inline h-4 w-4" />
                Facilities
              </label>
              <div className="relative">
                <Input
                  type="text"
                  value={defaultFacilityCount}
                  onChange={(e) => {
                    const numericValue = e.target.value.replace(/[^0-9]/g, '');
                    let clampedCount = 0;
                    if (numericValue === '') {
                      clampedCount = 0;
                    } else {
                      const count = parseInt(numericValue);
                      clampedCount = Math.min(50, Math.max(0, count));
                    }
                    setDefaultFacilityCount(clampedCount);

                    // 🆕 모든 기존 Zone들의 count를 새로운 기본값으로 업데이트
                    if (facilities.length > 0) {
                      const updatedCounts: Record<string, number> = {};
                      facilities.forEach((facility) => {
                        updatedCounts[facility.name] = clampedCount;
                      });
                      setZoneFacilityCounts(updatedCounts);
                    }
                  }}
                  onClick={(e) => e.target.select()}
                  className="pr-8 text-center"
                  placeholder="10"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-500">EA</span>
              </div>
            </div>
          </div>

          {/* Zone Grid Configuration - 항상 표시되는 컨테이너 */}
          <div className="min-h-[120px] rounded-xl border border-gray-100 bg-gradient-to-br from-white to-gray-50/50 p-6 shadow-sm">
            {facilities.length > 0 ? (
              <div className="grid grid-cols-6 gap-3 md:grid-cols-8 lg:grid-cols-10">
                {facilities.map((facility, index) => {
                  const count = zoneFacilityCounts[facility.name] || defaultFacilityCount;
                  const isEditing = editingZone === facility.name;
                  // 색상 변화를 위한 인덱스 기반 색상 선택
                  const colorClasses = [
                    'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
                    'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
                    'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
                    'from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700',
                    'from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700',
                    'from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700',
                  ];
                  const colorClass = colorClasses[index % colorClasses.length];

                  return (
                    <div
                      key={facility.name}
                      className={`group relative flex h-16 w-16 flex-col items-center justify-center rounded-md bg-gradient-to-br ${colorClass} p-2 text-white shadow-sm transition-all duration-200 ${isEditing ? 'ring-2 ring-white ring-offset-2' : 'hover:scale-105 hover:shadow-md'}`}
                      onDoubleClick={() => !isEditing && startEditing(facility.name)}
                    >
                      {/* Zone Name */}
                      <div className="mb-1 text-xs font-semibold">{facility.name}</div>

                      {/* Facility Count */}
                      <div className="flex items-center justify-center">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingValue}
                            onChange={(e) => {
                              const numericValue = e.target.value.replace(/[^0-9]/g, '');
                              if (
                                numericValue === '' ||
                                (parseInt(numericValue) >= 0 && parseInt(numericValue) <= 50)
                              ) {
                                setEditingValue(numericValue);
                              }
                            }}
                            onKeyDown={handleEditKeyDown}
                            onBlur={finishEditing}
                            onFocus={(e) => e.target.select()}
                            className="w-6 rounded border-2 border-white bg-white/90 text-center text-xs font-bold text-gray-800 outline-none"
                            autoFocus
                          />
                        ) : (
                          <span className="text-sm font-bold">{count}</span>
                        )}
                      </div>

                      {/* Hover Effect Overlay */}
                      {!isEditing && (
                        <div className="absolute inset-0 rounded-lg bg-white/0 transition-all duration-200 group-hover:bg-white/10"></div>
                      )}

                      {/* Double-click Indicator */}
                      {!isEditing && (
                        <div className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-white/30 opacity-0 transition-opacity group-hover:opacity-100"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">
                Enter zone names to see configuration options
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
          <Button onClick={handleSave} disabled={!processName.trim() || !facilitiesInput.trim()}>
            <Save className="mr-2 h-4 w-4" />
            {mode === 'create' ? 'Create Process' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
