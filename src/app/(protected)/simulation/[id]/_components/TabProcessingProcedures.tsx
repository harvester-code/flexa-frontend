'use client';

import React, { useState } from 'react';
import { ArrowUpDown, CheckSquare, ChevronDown, Plane, Plus, Route, Settings2, Trash2, Users } from 'lucide-react';
import { useScenarioStore } from '@/stores/useScenarioStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { useTabReset } from '../_hooks/useTabReset';
import NextButton from './NextButton';

interface TabProcessingProceduresProps {
  simulationId: string;
  visible: boolean;
}

export default function TabProcessingProcedures({ simulationId, visible }: TabProcessingProceduresProps) {
  // 모든 hooks를 조건부 리턴 이전에 위치
  const procedures = useScenarioStore((s) => s.airportProcessing.procedures);
  const entryType = useScenarioStore((s) => s.airportProcessing.entryType);
  const isCompleted = useScenarioStore((s) => s.airportProcessing.isCompleted);
  const setProcedures = useScenarioStore((s) => s.airportProcessing.actions.setProcedures);
  const setEntryType = useScenarioStore((s) => s.airportProcessing.actions.setEntryType);
  const setIsCompleted = useScenarioStore((s) => s.airportProcessing.actions.setIsCompleted);
  const generateProcesses = useScenarioStore((s) => s.facilityConnection.actions.generateProcessesFromProcedures);

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

  // Tab Reset Hook
  const { resetByTab } = useTabReset();

  // 조건부 리턴을 모든 hooks 이후에 위치
  if (!visible) return null;

  // 시설 타입 정의
  type FacilityItem = {
    name: string;
    isActive: boolean;
  };

  // 시설명 확장 함수 (DG1~5 → DG1,DG2,DG3,DG4,DG5)
  const expandFacilityNames = (input: string): FacilityItem[] => {
    let expanded = input.toUpperCase(); // 모든 입력을 대문자로 변환

    // 숫자 패턴 처리 (예: DG1~5, SC1~8)
    expanded = expanded.replace(/([A-Za-z]*)(\d+)~(\d+)/g, (match, prefix, start, end) => {
      const startNum = parseInt(start);
      const endNum = parseInt(end);

      if (startNum > endNum) return match; // 잘못된 범위는 그대로 반환

      const items: string[] = [];
      for (let i = startNum; i <= endNum; i++) {
        items.push(prefix + i);
      }
      return items.join(',');
    });

    // 알파벳 패턴 처리 (예: A~E, SC_A~SC_E)
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

    const newProcedure = {
      order: procedures.length + 1,
      process: newProcessName,
      facility_names: activeFacilities,
    };

    setProcedures([...procedures, newProcedure]);

    // Reset form
    setNewProcessName('');
    setNewProcessFacilities('');
    setCurrentFacilities([]);
    setIsCreatingProcess(false);
  };

  const selectProcess = (index: number) => {
    const process = procedures[index];
    setSelectedProcessIndex(index);
    setEditProcessName(process.process);
    setEditProcessFacilities(process.facility_names.join(','));

    // facility_names에서 facility 정보 생성
    const facilitiesFromNames = process.facility_names.map((name) => ({
      name: name,
      isActive: true,
    }));
    setEditingFacilities(facilitiesFromNames);

    setIsCreatingProcess(false);
  };

  const updateProcess = () => {
    if (selectedProcessIndex === null || !editProcessName.trim() || editingFacilities.length === 0) return;

    const activeFacilities = editingFacilities.filter((f) => f.isActive).map((f) => f.name);

    const newProcedures = [...procedures];
    newProcedures[selectedProcessIndex] = {
      ...newProcedures[selectedProcessIndex],
      process: editProcessName,
      facility_names: activeFacilities,
    };

    setProcedures(newProcedures);

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
    const newProcedures = procedures.filter((_, i) => i !== index);
    setProcedures(newProcedures);

    // 삭제된 프로세스가 선택되어 있었다면 선택 해제
    if (selectedProcessIndex === index) {
      setSelectedProcessIndex(null);
      setEditProcessName('');
      setEditProcessFacilities('');
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
    const newProcedures = [...procedures];
    const [draggedItem] = newProcedures.splice(draggedIndex, 1);
    newProcedures.splice(dropIndex, 0, draggedItem);

    setProcedures(newProcedures);

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

  const canComplete = procedures.length > 0;

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
              <CardTitle className="text-xl">Processing Procedures</CardTitle>
              <p className="text-sm text-gray-600">
                Configure passenger flow simulation path through airport facilities
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Process Flow Layout */}
      <div className="grid h-[600px] grid-cols-2 gap-6">
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
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Vertical arrow */}
            <div className="flex justify-center">
              <ChevronDown className="h-6 w-6 text-primary" />
            </div>

            {/* Procedures */}
            {procedures.map((proc, index) => (
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
                      <div className="text-sm font-medium text-gray-900">{proc.process}</div>
                      <div className="text-xs text-gray-600">({proc.facility_names.length} facilities)</div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-500 text-red-500 hover:bg-red-50 hover:border-red-600 hover:text-red-600 h-6 w-6 rounded-full p-0"
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
                <div className="text-sm text-gray-600">Create a new process step</div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Process Name</label>
                    <Input
                      type="text"
                      placeholder="e.g., Check-In, Security, Immigration"
                      value={newProcessName}
                      onChange={(e) => setNewProcessName(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, true)}
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Facility Names</label>
                    <Input
                      type="text"
                      placeholder="e.g., A~E, DG1~5, SC1,SC2,SC3"
                      value={newProcessFacilities}
                      onChange={(e) => handleFacilityInputChange(e.target.value, true)}
                      onKeyDown={(e) => handleKeyDown(e, true)}
                      required
                    />

                    {/* 시설 뱃지 표시 */}
                    {currentFacilities.length > 0 && (
                      <div className="mt-3">
                        <p className="mb-2 text-sm font-medium text-gray-700">Facilities (click to toggle):</p>
                        <div className="flex flex-wrap gap-2">
                          {currentFacilities.map((facility) => (
                            <button
                              key={facility.name}
                              type="button"
                              onClick={() => toggleFacility(facility.name, true)}
                              className={`inline-flex items-center rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors ${
                                facility.isActive
                                  ? 'bg-primary text-white hover:bg-primary/80'
                                  : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                              }`}
                            >
                              {facility.name}
                            </button>
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
                <div className="text-sm text-gray-600">Edit process step</div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Process Name</label>
                    <Input
                      type="text"
                      placeholder="e.g., Check-In, Security, Immigration"
                      value={editProcessName}
                      onChange={(e) => setEditProcessName(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, false)}
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Facility Names</label>
                    <Input
                      type="text"
                      placeholder="e.g., A~E, DG1~5, SC1,SC2,SC3"
                      value={editProcessFacilities}
                      onChange={(e) => handleFacilityInputChange(e.target.value, false)}
                      onKeyDown={(e) => handleKeyDown(e, false)}
                      required
                    />

                    {/* 시설 뱃지 표시 */}
                    {editingFacilities.length > 0 && (
                      <div className="mt-3">
                        <p className="mb-2 text-sm font-medium text-gray-700">Facilities (click to toggle):</p>
                        <div className="flex flex-wrap gap-2">
                          {editingFacilities.map((facility) => (
                            <button
                              key={facility.name}
                              type="button"
                              onClick={() => toggleFacility(facility.name, false)}
                              className={`inline-flex items-center rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors ${
                                facility.isActive
                                  ? 'bg-primary text-white hover:bg-primary/80'
                                  : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                              }`}
                            >
                              {facility.name}
                            </button>
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
            ) : procedures.length === 0 ? (
              <div className="flex h-full items-center justify-center text-gray-500">
                <div className="text-center">
                  <Settings2 className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                  <p>Add a process to configure facilities</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  {procedures.length} process{procedures.length > 1 ? 'es' : ''} configured
                </div>

                <div className="space-y-3">
                  {procedures.map((proc, index) => {
                    const extendedProc = proc as any;
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
                          <h4 className="font-medium text-gray-900">{proc.process}</h4>
                          <span className="text-xs text-gray-500">
                            {extendedProc.facilitiesStatus
                              ? extendedProc.facilitiesStatus.filter((f) => f.isActive).length
                              : proc.facility_names.length}{' '}
                            facilities
                          </span>
                        </div>

                        {/* 시설 뱃지 표시 */}
                        <div className="mb-2">
                          {extendedProc.facilitiesStatus ? (
                            <div className="flex flex-wrap gap-1">
                              {extendedProc.facilitiesStatus.map((facility) => (
                                <span
                                  key={facility.name}
                                  className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium ${
                                    facility.isActive
                                      ? 'bg-primary/10 text-primary'
                                      : 'bg-gray-100 text-gray-400 line-through'
                                  }`}
                                >
                                  {facility.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {proc.facility_names.map((name) => (
                                <span
                                  key={name}
                                  className="inline-flex items-center rounded bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                                >
                                  {name}
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

          {/* Complete Setup - Fixed at bottom right */}
          <div className="absolute bottom-4 right-4">
            <Button
              onClick={() => {
                // Processing Procedures 변경시 후속 탭들 초기화 (먼저 실행)
                resetByTab('ProcessingProcedures');

                // 리셋이 완전히 완료된 후 processes 생성
                setTimeout(() => {
                  generateProcesses(procedures, entryType);
                }, 0);

                setIsCompleted(true);
              }}
              disabled={!canComplete}
              className="bg-primary hover:bg-primary/90"
            >
              {isCompleted ? (
                <>
                  <CheckSquare className="mr-2 h-4 w-4" />
                  Completed
                </>
              ) : (
                'Complete Setup'
              )}
            </Button>
          </div>
        </Card>
      </div>

      {/* Navigation */}
      <div className="mt-8 flex justify-end">
        <NextButton disabled={!isCompleted} />
      </div>
    </div>
  );
}
