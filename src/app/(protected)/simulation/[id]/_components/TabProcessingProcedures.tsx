'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ArrowUpDown, CheckSquare, ChevronDown, Plane, Plus, Route, Settings2, Trash2, Users } from 'lucide-react';
import { runSimulation } from '@/services/simulationService';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { useToast } from '@/hooks/useToast';
import { formatProcessName } from '@/lib/utils';
import { useFacilityConnectionStore, useProcessingProceduresStore } from '../_stores';
// useTabReset 제거 - 직접 리셋 로직으로 단순화
import NextButton from './NextButton';
import OperatingScheduleEditor from './OperatingScheduleEditor';

// 시설 타입 정의
type FacilityItem = {
  name: string;
  isActive: boolean;
};

interface TabProcessingProceduresProps {
  simulationId: string;
  visible: boolean;
}

export default function TabProcessingProcedures({ simulationId, visible }: TabProcessingProceduresProps) {
  // 개별 store에서 필요한 데이터만 직접 가져오기
  const processFlow = useProcessingProceduresStore((s) => s.process_flow);
  const isCompleted = useProcessingProceduresStore((s) => s.isCompleted);
  const setProcessFlow = useProcessingProceduresStore((s) => s.setProcessFlow);
  const setIsCompleted = useProcessingProceduresStore((s) => s.setCompleted);
  const setFacilitiesForZone = useProcessingProceduresStore((s) => s.setFacilitiesForZone);
  const updateTravelTime = useProcessingProceduresStore((s) => s.updateTravelTime);
  const generateProcesses = useFacilityConnectionStore((s) => s.generateProcessesFromProcedures);
  const { toast } = useToast();

  // 더 이상 변환 함수가 필요없음 - zustand의 process_flow를 직접 사용

  // 더 이상 필요없음 - zustand의 process_flow를 직접 조작

  // zustand의 process_flow를 직접 사용
  const [entryType, setEntryType] = useState('Airline'); // 사용자가 선택 가능하도록 변경

  const [isCreatingProcess, setIsCreatingProcess] = useState(false);
  const [newProcessName, setNewProcessName] = useState('');
  const [newProcessFacilities, setNewProcessFacilities] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [selectedProcessIndex, setSelectedProcessIndex] = useState<number | null>(null);
  const [editProcessName, setEditProcessName] = useState('');
  const [editProcessFacilities, setEditProcessFacilities] = useState('');
  const [currentFacilities, setCurrentFacilities] = useState<FacilityItem[]>([]);
  const [editingFacilities, setEditingFacilities] = useState<FacilityItem[]>([]);

  // Zone별 facility 개수 상태
  const [facilityCountPerZone, setFacilityCountPerZone] = useState<{ [zoneName: string]: number }>({});

  // 시뮬레이션 실행 상태
  const [isRunningSimulation, setIsRunningSimulation] = useState(false);

  // Complete 조건 체크: 모든 시설에 operating_schedule이 설정되고 travel_time_minutes가 설정되어야 함
  const canComplete = useMemo(() => {
    if (processFlow.length === 0) return false;

    // 모든 프로세스의 travel_time_minutes가 설정되고, 모든 시설이 operating_schedule을 가져야 함
    return processFlow.every((process) => {
      // travel_time_minutes 체크 (0 이상이어야 함)
      const hasTravelTime = process.travel_time_minutes >= 0;

      // operating_schedule 체크
      const hasOperatingSchedule = Object.values(process.zones).every(
        (zone: any) =>
          zone.facilities &&
          zone.facilities.length > 0 &&
          zone.facilities.every(
            (facility: any) =>
              facility.operating_schedule &&
              facility.operating_schedule.today &&
              facility.operating_schedule.today.time_blocks &&
              facility.operating_schedule.today.time_blocks.length > 0
          )
      );

      return hasTravelTime && hasOperatingSchedule;
    });
  }, [processFlow]);

  // Facility가 설정된 프로세스가 있는지 체크
  const hasFacilitiesConfigured = useMemo(() => {
    return processFlow.some((process) =>
      Object.values(process.zones).some((zone: any) => zone.facilities && zone.facilities.length > 0)
    );
  }, [processFlow]);

  // processFlow가 변경될 때마다 facilityCountPerZone 자동 계산
  useEffect(() => {
    const calculatedCounts: { [key: string]: number } = {};

    processFlow.forEach((process, processIndex) => {
      Object.entries(process.zones).forEach(([zoneName, zone]: [string, any]) => {
        const count = zone.facilities?.length || 0;
        calculatedCounts[`${processIndex}-${zoneName}`] = count;
      });
    });

    setFacilityCountPerZone(calculatedCounts);
  }, [processFlow]);

  // 시설명 확장 함수 (범용적 처리: DG12_3-4-6-2~5 → DG12_3-4-6-2,DG12_3-4-6-3,DG12_3-4-6-4,DG12_3-4-6-5)
  const expandFacilityNames = (input: string): FacilityItem[] => {
    let expanded = input.toUpperCase(); // 모든 입력을 대문자로 변환

    // 범용적 숫자 범위 패턴 처리 - ~ 앞의 모든 부분을 prefix로 인식
    // 예: DG12_3-4-6-2~5 → DG12_3-4-6-2, DG12_3-4-6-3, DG12_3-4-6-4, DG12_3-4-6-5
    expanded = expanded.replace(/(.*?)(\d+)~(\d+)/g, (match, beforeLastNum, startNum, endNum) => {
      const start = parseInt(startNum);
      const end = parseInt(endNum);

      // 유효하지 않은 범위 (시작이 끝보다 큼)는 제거
      if (start > end) return '';

      const items: string[] = [];
      for (let i = start; i <= end; i++) {
        items.push(beforeLastNum + i);
      }
      return items.join(',');
    });

    // 알파벳 패턴 처리 (예: A~E, Counter_A~Counter_E)
    expanded = expanded.replace(/([A-Za-z]*)([A-Z])~([A-Z])/g, (match, prefix, start, end) => {
      const startCode = start.charCodeAt(0);
      const endCode = end.charCodeAt(0);

      if (startCode > endCode) return match; // 잘못된 범위는 그대로 반환

      const items: string[] = [];
      for (let i = startCode; i <= endCode; i++) {
        items.push(prefix + String.fromCharCode(i));
      }
      return items.join(',');
    });

    // 최종 시설 목록 생성 (모든 시설이 기본적으로 활성화됨)
    const facilities = expanded
      .split(',')
      .map((f) => f.trim())
      .filter((f) => f.length > 0)
      .map((name) => ({
        name,
        isActive: true,
      }));

    return facilities;
  };

  const createNewProcess = () => {
    if (!newProcessName.trim() || currentFacilities.length === 0) return;

    const activeFacilities = currentFacilities.filter((f) => f.isActive).map((f) => f.name);

    const newStep = {
      step: processFlow.length,
      name: newProcessName,
      travel_time_minutes: 0, // 사용자가 UI에서 설정
      entry_conditions: [],
      zones: {} as Record<string, any>,
    };

    // activeFacilities를 zones로 변환
    activeFacilities.forEach((facilityName: string) => {
      newStep.zones[facilityName] = {
        facilities: [], // 빈 배열로 시작 - Facility Detail에서 개수 지정 시 채워짐
      };
    });

    // 기존 processFlow에 새로운 step 추가
    setProcessFlow([...processFlow, newStep]);

    // Reset form
    setNewProcessName('');
    setNewProcessFacilities('');
    setCurrentFacilities([]);
    setIsCreatingProcess(false);
  };

  const selectProcess = (index: number) => {
    const step = processFlow[index];
    setSelectedProcessIndex(index);
    setEditProcessName(step.name);
    setEditProcessFacilities(Object.keys(step.zones || {}).join(','));

    // zones에서 facility 정보 생성
    const facilitiesFromZones = Object.keys(step.zones || {}).map((zoneName) => ({
      name: zoneName,
      isActive: true,
    }));
    setEditingFacilities(facilitiesFromZones);

    setIsCreatingProcess(false);
  };

  const updateProcess = () => {
    if (selectedProcessIndex === null || !editProcessName.trim() || editingFacilities.length === 0) return;

    const activeFacilities = editingFacilities.filter((f) => f.isActive).map((f) => f.name);

    const newProcessFlow = [...processFlow];
    newProcessFlow[selectedProcessIndex] = {
      ...newProcessFlow[selectedProcessIndex],
      name: editProcessName,
      zones: {} as Record<string, any>,
    };

    // activeFacilities를 zones로 변환
    activeFacilities.forEach((facilityName: string) => {
      newProcessFlow[selectedProcessIndex].zones[facilityName] = {
        facilities: [], // 빈 배열로 시작 - Facility Detail에서 개수 지정 시 채워짐
      };
    });

    // 업데이트된 processFlow 설정
    setProcessFlow(newProcessFlow);

    // Reset form
    setSelectedProcessIndex(null);
    setEditProcessName('');
    setEditProcessFacilities('');
    setEditingFacilities([]);
  };

  const cancelEdit = () => {
    setSelectedProcessIndex(null);
    setEditProcessName('');
    setEditProcessFacilities('');
    setEditingFacilities([]);
    setIsCreatingProcess(false);
    setNewProcessName('');
    setNewProcessFacilities('');
    setCurrentFacilities([]);
  };

  // 시설명 입력 변경 시 시설 리스트 업데이트
  const handleFacilityInputChange = (value: string, isCreating: boolean = true) => {
    if (isCreating) {
      setNewProcessFacilities(value);
    } else {
      setEditProcessFacilities(value);
    }

    if (value.trim()) {
      const facilities = expandFacilityNames(value);
      if (isCreating) {
        setCurrentFacilities(facilities);
      } else {
        setEditingFacilities(facilities);
      }
    } else {
      if (isCreating) {
        setCurrentFacilities([]);
      } else {
        setEditingFacilities([]);
      }
    }
  };

  // 시설 토글 함수
  const toggleFacility = (facilityName: string, isCreating: boolean = true) => {
    const targetFacilities = isCreating ? currentFacilities : editingFacilities;
    const setTargetFacilities = isCreating ? setCurrentFacilities : setEditingFacilities;

    const updatedFacilities = targetFacilities.map((facility) =>
      facility.name === facilityName ? { ...facility, isActive: !facility.isActive } : facility
    );

    setTargetFacilities(updatedFacilities);
  };

  // 엔터키 핸들러
  const handleKeyDown = (e: React.KeyboardEvent, isCreating: boolean = true) => {
    if (e.key === 'Enter') {
      e.preventDefault();

      if (isCreating) {
        // 새 프로세스 생성 모드
        if (newProcessName.trim() && newProcessFacilities.trim()) {
          createNewProcess();
        }
      } else {
        // 기존 프로세스 수정 모드
        if (editProcessName.trim() && editProcessFacilities.trim()) {
          updateProcess();
        }
      }
    }
  };

  const removeProcedure = (index: number) => {
    const newProcessFlow = processFlow.filter((_, i) => i !== index);

    // step 재정렬 (0부터 시작)
    const reorderedProcessFlow = newProcessFlow.map((step, i) => ({
      ...step,
      step: i,
    }));

    setProcessFlow(reorderedProcessFlow);

    // 삭제된 프로세스가 선택되어 있었다면 선택 해제
    if (selectedProcessIndex === index) {
      setSelectedProcessIndex(null);
      setEditProcessName('');
      setEditProcessFacilities('');
      setEditingFacilities([]);
    } else if (selectedProcessIndex !== null && selectedProcessIndex > index) {
      // 삭제된 프로세스보다 뒤에 있는 프로세스가 선택되어 있다면 인덱스 조정
      setSelectedProcessIndex(selectedProcessIndex - 1);
    }
  };

  // 드래그앤드롭 함수들
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    // 배열 재배열
    const newProcessFlow = [...processFlow];
    const [draggedItem] = newProcessFlow.splice(draggedIndex, 1);
    newProcessFlow.splice(dropIndex, 0, draggedItem);

    // step 재정렬 (0부터 시작)
    const reorderedProcessFlow = newProcessFlow.map((step, i) => ({
      ...step,
      step: i,
    }));

    setProcessFlow(reorderedProcessFlow);

    // 선택된 프로세스 인덱스 업데이트 (간단한 방식)
    if (selectedProcessIndex !== null) {
      if (selectedProcessIndex === draggedIndex) {
        // 드래그된 프로세스가 선택되어 있었다면 새 위치로 업데이트
        setSelectedProcessIndex(dropIndex);
      } else {
        // 다른 프로세스의 경우 인덱스 조정이 필요할 수 있지만
        // 현재는 단순하게 선택 해제
        setSelectedProcessIndex(null);
      }
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // 시뮬레이션 실행 함수
  const handleRunSimulation = async () => {
    if (!canComplete) {
      // 구체적인 미완료 사항 확인
      const missingTravelTimes = processFlow.some((p) => p.travel_time_minutes < 0);
      const missingSchedules = !processFlow.every((process) =>
        Object.values(process.zones).every(
          (zone: any) =>
            zone.facilities &&
            zone.facilities.length > 0 &&
            zone.facilities.every(
              (facility: any) =>
                facility.operating_schedule &&
                facility.operating_schedule.today &&
                facility.operating_schedule.today.time_blocks &&
                facility.operating_schedule.today.time_blocks.length > 0
            )
        )
      );

      let description = 'Please complete the following before running simulation:\n';
      if (missingTravelTimes) description += '• Set travel times for all processes\n';
      if (missingSchedules) description += '• Configure operating schedules for all facilities';

      toast({
        title: 'Setup Incomplete',
        description: description.trim(),
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsRunningSimulation(true);

      // travel_time_minutes 값을 안전하게 처리 (최소 1분)
      const sanitizedProcessFlow = processFlow.map((step) => ({
        ...step,
        travel_time_minutes: Math.max(step.travel_time_minutes || 0, 1), // 최소 1분 보장
      }));

      await runSimulation(simulationId, sanitizedProcessFlow);

      toast({
        title: '🚀 Simulation Started',
        description: 'Your simulation is now running. You can check the results in the Home tab.',
      });
    } catch (error: any) {
      console.error('Simulation failed:', error);
      toast({
        title: 'Simulation Failed',
        description: error.response?.data?.message || 'Failed to start simulation. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsRunningSimulation(false);
    }
  };

  // visible이 false이면 null 반환 (모든 hooks 실행 후)
  if (!visible) return null;

  return (
    <div className="space-y-6 pt-8">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Route className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">Processing Procedures</CardTitle>
              <p className="text-sm text-default-500">
                Configure passenger flow simulation path through airport facilities
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Process Flow Layout */}
      <div className="grid h-[600px] grid-cols-3 gap-6">
        {/* Left Panel - Process Flow */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">Process Flow</CardTitle>
          </CardHeader>
          <CardContent className="h-[500px] space-y-4 overflow-y-auto">
            {/* Entry (Fixed) */}
            <div className="flex items-center gap-4 rounded-lg bg-white p-3 shadow-sm">
              <div className="flex items-center text-sm font-medium text-primary">
                <Users className="mr-2 h-5 w-5" />
                Entry
              </div>
              <div className="flex flex-1 justify-end">
                <Select value={entryType} onValueChange={setEntryType}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Select entry type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Airline">Airline</SelectItem>
                    <SelectItem value="International/Domestic">International/Domestic</SelectItem>
                    <SelectItem value="Passenger Type">Passenger Type</SelectItem>
                    <SelectItem value="Entry Point">Entry Point</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Vertical arrow */}
            <div className="flex justify-center">
              <ChevronDown className="h-6 w-6 text-primary" />
            </div>

            {/* Procedures */}
            {processFlow.map((step, index) => (
              <div key={index}>
                <div
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onClick={() => selectProcess(index)}
                  className={`group flex cursor-pointer items-center justify-between rounded-lg border-2 bg-white p-3 shadow-sm transition-all ${draggedIndex === index ? 'border-primary/40 opacity-50' : 'border-transparent'} ${dragOverIndex === index && draggedIndex !== index ? 'border-primary/60 bg-primary/5' : ''} ${draggedIndex === null ? 'hover:border-primary/20' : ''} `}
                >
                  <div className="flex items-center">
                    <div
                      className="mr-2 cursor-move text-primary hover:text-primary/80"
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragEnd={handleDragEnd}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-default-900">{formatProcessName(step.name)}</div>
                      <div className="text-xs text-default-500">({Object.keys(step.zones || {}).length} zones)</div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 w-6 rounded-full border-red-500 p-0 text-red-500 hover:border-red-600 hover:bg-red-50 hover:text-red-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeProcedure(index);
                    }}
                    title="Remove this process"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>

                {/* Vertical arrow after each procedure */}
                <div className="flex justify-center py-2">
                  <ChevronDown className="h-6 w-6 text-primary" />
                </div>
              </div>
            ))}

            {/* Add Process Button */}
            <Button
              variant="outline"
              className="flex w-full items-center justify-center gap-2 border-2 border-dashed border-primary/30 p-3 text-primary transition-colors hover:border-primary/50 hover:bg-primary/5"
              onClick={() => setIsCreatingProcess(true)}
            >
              <Plus className="h-5 w-5" />
              Add Process
            </Button>

            {/* Vertical arrow to Gate */}
            <div className="flex justify-center">
              <ChevronDown className="h-6 w-6 text-primary" />
            </div>

            {/* Gate (Fixed) */}
            <div className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm">
              <div className="flex items-center text-sm font-medium text-primary">
                <Plane className="mr-2 h-5 w-5" />
                Gate
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Panel - Process Details */}
        <Card className="relative">
          <CardHeader>
            <CardTitle className="text-lg">Process Configuration</CardTitle>
          </CardHeader>
          <CardContent className="h-[500px] overflow-y-auto pb-16">
            {isCreatingProcess ? (
              <div className="space-y-6">
                <div className="text-sm text-default-500">Create a new process step</div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-default-900">Process Name</label>
                    <Input
                      type="text"
                      placeholder="e.g., Process Step Name"
                      value={newProcessName}
                      onChange={(e) => setNewProcessName(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, true)}
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-default-900">Facility Names</label>
                    <Input
                      type="text"
                      placeholder="e.g., A~E, Gate1~5, DG12_3-4-6-2~5, Counter1,Counter2"
                      value={newProcessFacilities}
                      onChange={(e) => handleFacilityInputChange(e.target.value, true)}
                      onKeyDown={(e) => handleKeyDown(e, true)}
                      required
                    />

                    {/* 시설 뱃지 표시 */}
                    {currentFacilities.length > 0 && (
                      <div className="mt-3">
                        <p className="mb-2 text-sm font-medium text-default-900">Facilities (click to toggle):</p>
                        <div className="flex flex-wrap gap-2">
                          {currentFacilities.map((facility) => (
                            <Button
                              key={facility.name}
                              variant="ghost"
                              type="button"
                              onClick={() => toggleFacility(facility.name, true)}
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

                <div className="flex gap-3">
                  <Button
                    onClick={createNewProcess}
                    disabled={!newProcessName.trim() || !newProcessFacilities.trim()}
                    className="flex-1"
                  >
                    Create Process
                  </Button>
                  <Button variant="outline" onClick={cancelEdit} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            ) : selectedProcessIndex !== null ? (
              <div className="space-y-6">
                <div className="text-sm text-default-500">Edit process step</div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-default-900">Process Name</label>
                    <Input
                      type="text"
                      placeholder="e.g., Process Step Name"
                      value={editProcessName}
                      onChange={(e) => setEditProcessName(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, false)}
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-default-900">Facility Names</label>
                    <Input
                      type="text"
                      placeholder="e.g., A~E, Gate1~5, DG12_3-4-6-2~5, Counter1,Counter2"
                      value={editProcessFacilities}
                      onChange={(e) => handleFacilityInputChange(e.target.value, false)}
                      onKeyDown={(e) => handleKeyDown(e, false)}
                      required
                    />

                    {/* 시설 뱃지 표시 */}
                    {editingFacilities.length > 0 && (
                      <div className="mt-3">
                        <p className="mb-2 text-sm font-medium text-default-900">Facilities (click to toggle):</p>
                        <div className="flex flex-wrap gap-2">
                          {editingFacilities.map((facility) => (
                            <Button
                              key={facility.name}
                              variant="ghost"
                              type="button"
                              onClick={() => toggleFacility(facility.name, false)}
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

                <div className="flex gap-3">
                  <Button
                    onClick={updateProcess}
                    disabled={!editProcessName.trim() || !editProcessFacilities.trim()}
                    className="flex-1"
                  >
                    Update Process
                  </Button>
                  <Button variant="outline" onClick={cancelEdit} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            ) : processFlow.length === 0 ? (
              <div className="flex h-full items-center justify-center text-default-500">
                <div className="text-center">
                  <Settings2 className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p>Add a process to configure facilities</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-sm text-default-500">
                  {processFlow.length} process{processFlow.length > 1 ? 'es' : ''} configured
                </div>

                <div className="space-y-3">
                  {processFlow.map((step, index) => {
                    const extendedStep = step as any;
                    return (
                      <div
                        key={index}
                        className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                          selectedProcessIndex === index
                            ? 'border-primary/30 bg-primary/10'
                            : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                        }`}
                        onClick={() => selectProcess(index)}
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <h4 className="font-medium text-default-900">{formatProcessName(step.name)}</h4>
                          <span className="text-xs text-default-500">
                            {extendedStep.facilitiesStatus
                              ? extendedStep.facilitiesStatus.filter((f) => f.isActive).length
                              : Object.keys(step.zones || {}).length}{' '}
                            zones
                          </span>
                        </div>

                        {/* Travel Time 설정 */}
                        <div className="mb-3 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <label className="text-default-700 text-xs font-medium">Travel Time:</label>
                          <Input
                            type="number"
                            min="0"
                            max="60"
                            className="h-6 w-16 text-xs"
                            value={step.travel_time_minutes || 0}
                            onChange={(e) => {
                              const minutes = parseInt(e.target.value) || 0;
                              updateTravelTime(index, minutes);
                            }}
                          />
                          <span className="text-xs text-default-500">minutes</span>
                        </div>

                        {/* 시설 뱃지 표시 */}
                        <div className="mb-2">
                          {extendedStep.facilitiesStatus ? (
                            <div className="flex flex-wrap gap-1">
                              {extendedStep.facilitiesStatus.map((facility) => (
                                <span
                                  key={facility.name}
                                  className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium ${
                                    facility.isActive
                                      ? 'bg-primary/10 text-primary'
                                      : 'bg-gray-100 text-muted-foreground line-through'
                                  }`}
                                >
                                  {facility.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {Object.keys(step.zones || {}).map((zoneName) => (
                                <span
                                  key={zoneName}
                                  className="inline-flex items-center rounded bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                                >
                                  {zoneName}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Third Panel - Facility Detail */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Facility Detail</CardTitle>
          </CardHeader>
          <CardContent className="h-[500px] overflow-y-auto pb-16">
            {processFlow.length === 0 ? (
              <div className="flex h-full items-center justify-center text-default-500">
                <div className="text-center">
                  <Settings2 className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p>Add processes to configure facilities</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-sm text-default-500">Set facility count for each zone</div>

                {processFlow.map((step, procIndex) => (
                  <div key={procIndex} className="space-y-4">
                    <div className="border-b pb-2">
                      <h4 className="font-medium text-default-900">{formatProcessName(step.name)}</h4>
                      <div className="text-xs text-default-500">
                        {Object.keys(processFlow[procIndex]?.zones || {}).length} zones
                      </div>
                    </div>

                    {Object.keys(processFlow[procIndex]?.zones || {}).map((zoneName, zoneIndex) => (
                      <div key={zoneIndex} className="space-y-3 rounded-lg border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-default-900">Zone: {zoneName}</div>
                            <div className="text-xs text-default-500">
                              {facilityCountPerZone[`${procIndex}-${zoneName}`] || 0} facilities
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-sm font-medium">Count:</label>
                            <Input
                              type="number"
                              min="0"
                              max="20"
                              className="w-20"
                              value={facilityCountPerZone[`${procIndex}-${zoneName}`] || ''}
                              onChange={(e) => {
                                const count = parseInt(e.target.value) || 0;
                                setFacilityCountPerZone((prev) => ({
                                  ...prev,
                                  [`${procIndex}-${zoneName}`]: count,
                                }));
                                // zustand store에 facilities 생성
                                setFacilitiesForZone(procIndex, zoneName, count);
                              }}
                            />
                          </div>
                        </div>

                        {/* Facility 목록 표시 */}
                        {facilityCountPerZone[`${procIndex}-${zoneName}`] > 0 && (
                          <div className="mt-3">
                            <div className="mb-2 text-xs font-medium text-default-900">Generated Facilities:</div>
                            <div className="flex flex-wrap gap-1">
                              {Array.from({ length: facilityCountPerZone[`${procIndex}-${zoneName}`] || 0 }, (_, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center rounded bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                                >
                                  {zoneName}_{i + 1}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Operating Schedule Editor - Facility가 설정되면 자동 표시 */}
      {hasFacilitiesConfigured && <OperatingScheduleEditor processFlow={processFlow} />}

      {/* Navigation */}
      <div className="mt-8">
        <NextButton showPrevious={true} disabled={!isCompleted} />
      </div>

      {/* Run Simulation Button */}
      {canComplete && (
        <div className="mt-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="mb-4">
                  <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <Plane className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold">Ready to Run Simulation</h3>
                  <p className="text-sm text-muted-foreground">
                    All operating schedules are configured. Start your simulation now!
                  </p>
                </div>
                <Button onClick={handleRunSimulation} disabled={isRunningSimulation}>
                  {isRunningSimulation ? (
                    <>
                      <Settings2 className="mr-2 h-4 w-4 animate-spin" />
                      Running Simulation...
                    </>
                  ) : (
                    <>
                      <Plane className="mr-2 h-4 w-4" />
                      Run Simulation
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Complete Setup Button - 가장 아래로 이동 */}
      <div className="mt-6 space-y-3">
        {/* 진행상황 표시 */}
        <div className="rounded-lg border bg-muted/50 p-3">
          <div className="mb-2 text-sm font-medium">Setup Progress</div>
          <div className="space-y-2 text-xs">
            <div
              className={`flex items-center gap-2 ${processFlow.length > 0 ? 'text-foreground' : 'text-muted-foreground'}`}
            >
              {processFlow.length > 0 ? (
                <CheckSquare className="h-3 w-3" />
              ) : (
                <div className="h-3 w-3 rounded border" />
              )}
              Process Flow Configured ({processFlow.length} processes)
            </div>
            <div
              className={`flex items-center gap-2 ${hasFacilitiesConfigured ? 'text-foreground' : 'text-muted-foreground'}`}
            >
              {hasFacilitiesConfigured ? (
                <CheckSquare className="h-3 w-3" />
              ) : (
                <div className="h-3 w-3 rounded border" />
              )}
              Facilities Configured
            </div>
            <div
              className={`flex items-center gap-2 ${
                processFlow.every((p) => p.travel_time_minutes >= 0) && processFlow.length > 0
                  ? 'text-foreground'
                  : 'text-muted-foreground'
              }`}
            >
              {processFlow.every((p) => p.travel_time_minutes >= 0) && processFlow.length > 0 ? (
                <CheckSquare className="h-3 w-3" />
              ) : (
                <div className="h-3 w-3 rounded border" />
              )}
              Travel Times Set
            </div>
            <div className={`flex items-center gap-2 ${canComplete ? 'text-foreground' : 'text-muted-foreground'}`}>
              {canComplete ? <CheckSquare className="h-3 w-3" /> : <div className="h-3 w-3 rounded border" />}
              Operating Schedules Set
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => setIsCompleted(true)} disabled={!canComplete}>
            {isCompleted ? (
              <>
                <CheckSquare className="mr-2 h-4 w-4" />
                Completed
              </>
            ) : (
              <>{canComplete ? 'Complete Setup' : 'Complete Operating Schedules to Continue'}</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
