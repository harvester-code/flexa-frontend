'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Building2, ChevronRight, Clock, Filter, MapPin, Plane, Plus, Save, Tag, Trash2, Users, X } from 'lucide-react';
import { ProcessStep } from '@/types/simulationTypes';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { formatProcessName } from '@/lib/utils';
import { useSimulationStore } from '../_stores';
import SearchCriteriaSelector from './SearchCriteriaSelector';

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

// Parquet Metadata 타입 정의
interface ParquetMetadataItem {
  column: string;
  values: Record<
    string,
    {
      flights: string[];
      indices: number[];
    }
  >;
}

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
  parquetMetadata?: ParquetMetadataItem[]; // 🆕 동적 데이터
}

export default function ProcessConfigurationModal({
  isOpen,
  onClose,
  processData,
  onSave,
  mode,
  processFlow = [], // 🆕 현재 프로세스 플로우
  parquetMetadata = [], // 🆕 동적 데이터
}: ProcessConfigurationModalProps) {
  // 🎯 zustand에서 pax_demographics 가져오기
  const paxDemographics = useSimulationStore((s) => s.passenger.pax_demographics);
  const [processName, setProcessName] = useState('');
  const [facilitiesInput, setFacilitiesInput] = useState('');
  const [facilities, setFacilities] = useState<FacilityItem[]>([]);
  const [travelTime, setTravelTime] = useState(5);
  // 🆕 Zone별 시설 개수 관리
  const [zoneFacilityCounts, setZoneFacilityCounts] = useState<Record<string, number>>({});
  const [defaultFacilityCount, setDefaultFacilityCount] = useState<number>(10);
  const [editingZone, setEditingZone] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');

  // 🆕 Entry Conditions 관리 (SearchCriteriaSelector 연동)
  const [entryConditions, setEntryConditions] = useState<EntryCondition[]>([]);
  const [selectedCriteriaItems, setSelectedCriteriaItems] = useState<Record<string, boolean>>({});

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

  // 🆕 SearchCriteriaSelector 연동 핸들러
  const handleCriteriaSelectionChange = useCallback((selectedItems: Record<string, boolean>) => {
    setSelectedCriteriaItems(selectedItems);

    // selectedItems를 EntryCondition[] 형태로 변환
    const conditionsMap: Record<string, string[]> = {};

    Object.entries(selectedItems).forEach(([itemKey, isSelected]) => {
      if (isSelected) {
        const [columnKey, value] = itemKey.split(':');
        if (!conditionsMap[columnKey]) {
          conditionsMap[columnKey] = [];
        }
        conditionsMap[columnKey].push(value);
      }
    });

    const newEntryConditions: EntryCondition[] = Object.entries(conditionsMap).map(([field, values]) => ({
      field,
      values,
    }));

    setEntryConditions(newEntryConditions);
  }, []);

  const handleCriteriaClearAll = useCallback(() => {
    setSelectedCriteriaItems({});
    setEntryConditions([]);
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

        // 🆕 기존 entryConditions를 selectedCriteriaItems 형태로 변환
        const initialSelectedItems: Record<string, boolean> = {};
        if (processData.entryConditions) {
          processData.entryConditions.forEach((condition) => {
            condition.values.forEach((value) => {
              const itemKey = `${condition.field}:${value}`;
              initialSelectedItems[itemKey] = true;
            });
          });
        }
        setSelectedCriteriaItems(initialSelectedItems);

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
        setSelectedCriteriaItems({});
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
            {parquetMetadata.length > 0 ? (
              <SearchCriteriaSelector
                title="Entry Conditions"
                icon={<Filter className="h-4 w-4" />}
                parquetMetadata={parquetMetadata}
                additionalMetadata={paxDemographics}
                onSelectionChange={handleCriteriaSelectionChange}
                onClearAll={handleCriteriaClearAll}
                initialSelectedItems={selectedCriteriaItems}
              />
            ) : (
              <div>
                <label className="mb-3 block text-sm font-medium text-default-900">
                  <Filter className="mr-2 inline h-4 w-4" />
                  Entry Conditions
                </label>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm text-amber-700">
                    Parquet metadata is required to configure entry conditions. Please provide flight data to enable
                    this feature.
                  </p>
                </div>
              </div>
            )}
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
                  onClick={(e) => (e.target as HTMLInputElement).select()}
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
                  onClick={(e) => (e.target as HTMLInputElement).select()}
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
