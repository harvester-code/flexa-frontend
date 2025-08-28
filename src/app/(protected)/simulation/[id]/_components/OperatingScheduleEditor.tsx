'use client';

import React, { useMemo, useState } from 'react';
import { CheckSquare, Clock, Plus, Save, Trash2, Users } from 'lucide-react';
import { PassengerCondition, ProcessStep, TimeBlock } from '@/types/simulationTypes';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { useToast } from '@/hooks/useToast';
import { formatProcessName } from '@/lib/utils';
import { useProcessingProceduresStore } from '../_stores';

interface OperatingScheduleEditorProps {
  processFlow: ProcessStep[];
}

interface TimeBlockFormData {
  period: string;
  processTime: number;
  conditions: PassengerCondition[];
}

export default function OperatingScheduleEditor({ processFlow }: OperatingScheduleEditorProps) {
  const updateOperatingSchedule = useProcessingProceduresStore((s) => s.updateOperatingSchedule);
  const { toast } = useToast();

  // 선택된 프로세스와 존
  const [selectedProcessIndex, setSelectedProcessIndex] = useState<number>(0);
  const [selectedZone, setSelectedZone] = useState<string>('');

  // 시간 블록 편집 상태
  const [timeBlocks, setTimeBlocks] = useState<TimeBlockFormData[]>([]);

  // 선택된 프로세스와 존 변경 시 시간 블록 로드
  React.useEffect(() => {
    if (processFlow[selectedProcessIndex] && selectedZone) {
      const zone = processFlow[selectedProcessIndex].zones[selectedZone];
      if (zone?.facilities?.length > 0) {
        const firstFacility = zone.facilities[0];
        const schedule = firstFacility.operating_schedule?.today?.time_blocks || [];

        const formData = schedule.map((block: TimeBlock) => ({
          period: block.period,
          processTime: block.process_time_seconds,
          conditions: block.passenger_conditions || [],
        }));

        setTimeBlocks(formData.length > 0 ? formData : []);
      } else {
        setTimeBlocks([]);
      }
    }
  }, [selectedProcessIndex, selectedZone, processFlow]);

  // 선택된 프로세스 변경 시 첫 번째 존 자동 선택
  React.useEffect(() => {
    if (processFlow[selectedProcessIndex]) {
      const zones = Object.keys(processFlow[selectedProcessIndex].zones);
      if (zones.length > 0) {
        setSelectedZone(zones[0]);
      }
    }
  }, [selectedProcessIndex, processFlow]);

  // 새 시간 블록 추가
  const addTimeBlock = () => {
    setTimeBlocks((prev) => [
      ...prev,
      {
        period: '00:00-24:00',
        processTime: 30,
        conditions: [], // 기본적으로 조건 없음 = 모든 승객 이용 가능
      },
    ]);
  };

  // 시간 블록 삭제
  const removeTimeBlock = (index: number) => {
    setTimeBlocks((prev) => prev.filter((_, i) => i !== index));
  };

  // 시간 블록 업데이트
  const updateTimeBlock = (index: number, field: keyof TimeBlockFormData, value: any) => {
    setTimeBlocks((prev) => prev.map((block, i) => (i === index ? { ...block, [field]: value } : block)));
  };

  // 승객 조건 추가
  const addPassengerCondition = (blockIndex: number) => {
    setTimeBlocks((prev) =>
      prev.map((block, i) =>
        i === blockIndex
          ? {
              ...block,
              conditions: [...block.conditions, { field: 'operating_carrier_iata', values: [] }],
            }
          : block
      )
    );
  };

  // 승객 조건 제거
  const removePassengerCondition = (blockIndex: number, conditionIndex: number) => {
    setTimeBlocks((prev) =>
      prev.map((block, i) =>
        i === blockIndex
          ? {
              ...block,
              conditions: block.conditions.filter((_, ci) => ci !== conditionIndex),
            }
          : block
      )
    );
  };

  // 승객 조건 업데이트
  const updatePassengerCondition = (
    blockIndex: number,
    conditionIndex: number,
    field: string,
    value: string | string[]
  ) => {
    setTimeBlocks((prev) =>
      prev.map((block, i) =>
        i === blockIndex
          ? {
              ...block,
              conditions: block.conditions.map((condition, ci) =>
                ci === conditionIndex ? { ...condition, [field]: value } : condition
              ),
            }
          : block
      )
    );
  };

  // 스케줄 저장
  const saveSchedule = () => {
    if (!processFlow[selectedProcessIndex] || !selectedZone) return;

    updateOperatingSchedule(selectedProcessIndex, selectedZone, timeBlocks);

    toast({
      title: 'Schedule Saved',
      description: `Operating schedule saved for ${formatProcessName(processFlow[selectedProcessIndex].name)} → ${selectedZone}`,
    });
  };

  // 시각화용 데이터 생성
  const visualizationData = useMemo(() => {
    if (!processFlow[selectedProcessIndex] || !selectedZone) return null;

    const zone = processFlow[selectedProcessIndex].zones[selectedZone];
    const facilities = zone?.facilities || [];

    // 24시간을 1시간 단위로 나눔
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return facilities.map((facility: any) => {
      const schedule = facility.operating_schedule?.today?.time_blocks || [];
      const hourStatus = hours.map((hour) => {
        // 해당 시간이 어떤 블록에 속하는지 확인
        const matchedBlock = schedule.find((block: TimeBlock) => {
          const [startTime, endTime] = block.period.split('-');
          const startHour = parseInt(startTime.split(':')[0]);
          const endHour = endTime === '24:00' ? 24 : parseInt(endTime.split(':')[0]);
          return hour >= startHour && hour < endHour;
        });

        return {
          hour,
          active: !!matchedBlock,
          processTime: matchedBlock?.process_time_seconds || 0,
          conditions: matchedBlock?.passenger_conditions || [],
        };
      });

      return {
        facilityId: facility.id,
        schedule: hourStatus,
      };
    });
  }, [processFlow, selectedProcessIndex, selectedZone]);

  if (processFlow.length === 0) {
    return null; // 프로세스가 없으면 아예 표시하지 않음
  }

  // 설정이 필요한 시설들 확인
  const facilitiesWithoutSchedule = useMemo(() => {
    const missing: string[] = [];
    processFlow.forEach((process, processIndex) => {
      Object.entries(process.zones).forEach(([zoneName, zone]: [string, any]) => {
        if (zone.facilities && zone.facilities.length > 0) {
          zone.facilities.forEach((facility: any) => {
            if (
              !facility.operating_schedule ||
              !facility.operating_schedule.today ||
              !facility.operating_schedule.today.time_blocks ||
              facility.operating_schedule.today.time_blocks.length === 0
            ) {
              missing.push(`${formatProcessName(process.name)} → ${zoneName} → ${facility.id}`);
            }
          });
        }
      });
    });
    return missing;
  }, [processFlow]);

  const allSchedulesConfigured = facilitiesWithoutSchedule.length === 0;

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Operating Schedule Editor
          </div>
          <div className="flex items-center gap-2 text-sm">
            {allSchedulesConfigured ? (
              <div className="flex items-center gap-1">
                <CheckSquare className="h-4 w-4" />
                All Schedules Set
              </div>
            ) : (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-4 w-4" />
                {facilitiesWithoutSchedule.length} Facilities Pending
              </div>
            )}
          </div>
        </CardTitle>
        {!allSchedulesConfigured && facilitiesWithoutSchedule.length > 0 && (
          <div className="mt-3 rounded-lg border bg-muted/30 p-3">
            <div className="mb-2 text-sm font-medium">⚠️ Facilities requiring schedule setup:</div>
            <div className="space-y-1 text-xs text-muted-foreground">
              {facilitiesWithoutSchedule.slice(0, 5).map((facility, index) => (
                <div key={index}>{facility}</div>
              ))}
              {facilitiesWithoutSchedule.length > 5 && (
                <div className="font-medium">... and {facilitiesWithoutSchedule.length - 5} more</div>
              )}
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {/* Process & Zone Selection */}
        <div className="mb-6 flex gap-4">
          <div className="flex-1">
            <label className="mb-2 block text-sm font-medium">Process</label>
            <Tabs
              value={selectedProcessIndex.toString()}
              onValueChange={(value) => setSelectedProcessIndex(parseInt(value))}
            >
              <TabsList className="grid-cols-auto grid w-full">
                {processFlow.map((step, index) => (
                  <TabsTrigger key={index} value={index.toString()}>
                    {formatProcessName(step.name)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>

        {processFlow[selectedProcessIndex] && (
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium">Zone</label>
            <Tabs value={selectedZone} onValueChange={setSelectedZone}>
              <TabsList>
                {Object.keys(processFlow[selectedProcessIndex].zones).map((zoneName) => (
                  <TabsTrigger key={zoneName} value={zoneName}>
                    {zoneName}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        )}

        {selectedZone && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Time Block Editor */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Time Blocks</h3>
                <Button onClick={addTimeBlock} size="sm" variant="outline">
                  <Plus className="mr-1 h-4 w-4" />
                  Add Block
                </Button>
              </div>

              <div className="max-h-96 space-y-4 overflow-y-auto">
                {timeBlocks.map((block, blockIndex) => (
                  <Card key={blockIndex} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <label className="mb-1 block text-sm font-medium">Time Period</label>
                          <Input
                            value={block.period}
                            onChange={(e) => updateTimeBlock(blockIndex, 'period', e.target.value)}
                            placeholder="06:00-12:00"
                          />
                        </div>
                        <div className="w-32">
                          <label className="mb-1 block text-sm font-medium">Process Time (s)</label>
                          <Input
                            type="number"
                            value={block.processTime}
                            onChange={(e) => updateTimeBlock(blockIndex, 'processTime', parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <Button
                          onClick={() => removeTimeBlock(blockIndex)}
                          size="sm"
                          variant="outline"
                          className="mt-6 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <label className="text-sm font-medium">Passenger Conditions</label>
                          <Button onClick={() => addPassengerCondition(blockIndex)} size="sm" variant="outline">
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        {/* 조건이 없을 때 표시 */}
                        {block.conditions.length === 0 && (
                          <div className="rounded-md border border-dashed bg-muted/50 p-3 text-center">
                            <div className="text-sm">
                              <Users className="mx-auto mb-1 h-4 w-4" />
                              All Passengers Welcome
                            </div>
                            <div className="text-xs text-muted-foreground">
                              No conditions = All passenger types can use this facility
                            </div>
                          </div>
                        )}

                        {/* 조건 목록 */}
                        <div className="space-y-2">
                          {block.conditions.map((condition, conditionIndex) => (
                            <div key={conditionIndex} className="flex items-center gap-2">
                              <Select
                                value={condition.field}
                                onValueChange={(value) =>
                                  updatePassengerCondition(blockIndex, conditionIndex, 'field', value)
                                }
                              >
                                <SelectTrigger className="w-48">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="operating_carrier_iata">Airline</SelectItem>
                                  <SelectItem value="profile">Profile</SelectItem>
                                  <SelectItem value="nationality">Nationality</SelectItem>
                                </SelectContent>
                              </Select>

                              <Input
                                className="flex-1"
                                value={condition.values.join(', ')}
                                onChange={(e) =>
                                  updatePassengerCondition(
                                    blockIndex,
                                    conditionIndex,
                                    'values',
                                    e.target.value
                                      ? e.target.value
                                          .split(',')
                                          .map((v) => v.trim())
                                          .filter((v) => v)
                                      : []
                                  )
                                }
                                placeholder={
                                  condition.field === 'operating_carrier_iata'
                                    ? 'KE, OZ'
                                    : condition.field === 'profile'
                                      ? 'general, business, crew'
                                      : condition.field === 'nationality'
                                        ? 'domestic, international'
                                        : 'Enter values...'
                                }
                              />

                              <Button
                                onClick={() => removePassengerCondition(blockIndex, conditionIndex)}
                                size="sm"
                                variant="outline"
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <Button onClick={saveSchedule} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                Save Schedule
              </Button>
            </div>

            {/* Schedule Visualization */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Schedule Visualization</h3>

              {visualizationData ? (
                <div className="overflow-hidden rounded-lg border">
                  <div className="bg-muted/50 p-3">
                    <div className="text-sm font-medium">
                      {formatProcessName(processFlow[selectedProcessIndex].name)} → {selectedZone}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-muted">
                          <th className="border-r p-2 text-left">Facility</th>
                          {Array.from({ length: 24 }, (_, i) => (
                            <th key={i} className="min-w-8 border-r p-1 text-center">
                              {i.toString().padStart(2, '0')}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {visualizationData.map((facility, index) => (
                          <tr key={index} className="border-t">
                            <td className="border-r p-2 font-medium">{facility.facilityId}</td>
                            {facility.schedule.map((slot, slotIndex) => (
                              <td key={slotIndex} className="border-r text-center">
                                <div
                                  className={`flex h-8 w-full items-center justify-center text-xs font-bold ${
                                    slot.active ? 'bg-primary/10' : 'bg-muted/30 text-muted-foreground'
                                  }`}
                                  title={
                                    slot.active
                                      ? `${slot.processTime}s${
                                          slot.conditions.length > 0
                                            ? ` | ${slot.conditions.map((c) => `${c.field}: ${c.values.join(',')}`).join(' & ')}`
                                            : ' | All Passengers'
                                        }`
                                      : 'Inactive'
                                  }
                                >
                                  {slot.active ? '●' : '○'}
                                </div>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border p-8 text-center text-muted-foreground">
                  Select a zone with facilities to view schedule
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
