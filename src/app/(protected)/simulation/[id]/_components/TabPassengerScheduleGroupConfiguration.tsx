'use client';

import React, { useState } from 'react';
import { BarChart3, CheckCircle, Edit2, Settings, Trash2, Users } from 'lucide-react';
import { APIRequestLog, DestributionCondition } from '@/types/simulationTypes';
import { createPassengerShowUp } from '@/services/simulationService';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useFlightScheduleStore, usePassengerScheduleStore } from '../_stores';
import { Airline } from './TabPassengerScheduleAirlineSelector';
import TabPassengerScheduleNormalDistribution from './TabPassengerScheduleNormalDistribution';
import TabPassengerScheduleResult from './TabPassengerScheduleResult';

export interface ConfiguredGroup {
  id: string;
  name: string;
  airlines: Airline[];
  meanMinutes: number;
  stdDevMinutes: number;
  color: string;
}

interface GroupConfigurationProps {
  simulationId: string;
  destributionConditions: DestributionCondition[];
  onUpdateConfiguredGroup: (groupId: string, updates: any) => void;
  onDeleteConfiguredGroup: (groupId: string) => void;
  onCompleteSetup: () => void;
  canCompleteSetup: boolean;
  apiRequestLog: APIRequestLog | null;
  setApiRequestLog: (log: APIRequestLog | null) => void;
}

export default function TabPassengerScheduleGroupConfiguration({
  simulationId,
  destributionConditions,
  onUpdateConfiguredGroup,
  onDeleteConfiguredGroup,
  onCompleteSetup,
  canCompleteSetup,
  apiRequestLog,
  setApiRequestLog,
}: GroupConfigurationProps) {
  const [editingConfiguredGroup, setEditingConfiguredGroup] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 새로운 모듈화된 PassengerSchedule 스토어에서 액션 가져오기
  const { setApiResponseData, setCompleted: setIsCompleted } = usePassengerScheduleStore();

  // Convert minutes to hours:minutes format
  const minutesToHoursMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // 새로운 스토어들에서 데이터 가져오기
  const { date: flightScheduleDate, airport: flightScheduleAirport } = useFlightScheduleStore();
  const { pax_arrival_patterns: paxArrivalPatterns } = usePassengerScheduleStore();

  // zustand의 pax_arrival_patterns를 API가 기대하는 형식으로 변환
  // Convert pax_arrival_patterns to API payload format
  const convertToShowUpPaxFormat = () => {
    return {
      settings: {
        load_factor: 0.85,
        min_arrival_minutes: 15,
        date: flightScheduleDate || new Date().toISOString().split('T')[0], // Fallback to current date
        airport: flightScheduleAirport || 'ICN', // Fallback to ICN
      },
      pax_demographics: {
        nationality: {
          rules: [],
          default: {},
        },
        profile: {
          rules: [],
          default: { general: 1 },
        },
      },
      pax_arrival_patterns: paxArrivalPatterns,
    };
  };

  // Handle Complete Setup button click
  const handleCompleteSetup = async () => {
    setLoading(true);
    try {
      const apiPayload = convertToShowUpPaxFormat();

      // API 요청 로그 기록 (loading 상태)
      setApiRequestLog({
        timestamp: new Date().toISOString(),
        request: apiPayload,
        response: null,
        status: 'loading',
      });

      // 백엔드가 기대하는 형식으로 API 호출 (show_up_pax.json 형태)
      const response = await createPassengerShowUp(simulationId, apiPayload);

      // API 응답 로그 기록 (success 상태)
      setApiRequestLog({
        timestamp: new Date().toISOString(),
        request: apiPayload,
        response: response.data,
        status: 'success',
      });

      // zustand store에 API 응답 데이터 저장
      setApiResponseData(response.data);

      // Zustand 상태 업데이트 (이미 저장된 상태이므로 필요없음)
      // setDestributionConditions(destributionConditions);
      setIsCompleted(true);

      // 부모 컴포넌트 콜백 호출
      onCompleteSetup();
    } catch (error) {
      console.error('Failed to create passenger show-up data:', error);

      // API 에러 로그 기록
      setApiRequestLog({
        timestamp: new Date().toISOString(),
        request: convertToShowUpPaxFormat(),
        response: null,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  };

  // No configured groups case
  if ((destributionConditions || []).length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-default-500">
          <Users className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
          <p className="text-lg">No groups configured yet.</p>
          <p className="text-sm">Select airlines above to create your first group.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Passenger Arrival Time Distribution Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-default-900">
                Passenger Arrival Time Distribution Chart
              </CardTitle>
              <p className="text-sm text-default-500">
                Shows the distribution of passenger arrival times at the airport by group. (Based on departure time)
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Enhanced Group Legend with Editing Capabilities */}
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {(destributionConditions || []).map((condition, conditionIndex) => (
              <div
                key={`group-legend-${condition.id}`}
                className="rounded-lg border p-4"
                style={{ backgroundColor: `${condition.color}10`, borderColor: `${condition.color}30` }}
              >
                {/* Group Header */}
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded" style={{ backgroundColor: condition.color }} />
                    {editingConfiguredGroup === condition.id ? (
                      <input
                        type="text"
                        value={condition.name}
                        onChange={(e) => onUpdateConfiguredGroup(condition.id, { name: e.target.value })}
                        onBlur={() => setEditingConfiguredGroup(null)}
                        onKeyDown={(e) => e.key === 'Enter' && setEditingConfiguredGroup(null)}
                        className="rounded border bg-white px-1 py-0.5 text-xs font-medium"
                        autoFocus
                      />
                    ) : (
                      <h4 className="text-xs font-medium text-default-900">
                        {condition.name} ({condition.airline_group?.length || 0} airlines)
                      </h4>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setEditingConfiguredGroup(editingConfiguredGroup === condition.id ? null : condition.id)
                      }
                      className="h-4 w-4 p-0 text-default-500 hover:bg-gray-100"
                    >
                      <Edit2 className="h-2.5 w-2.5" />
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteConfiguredGroup(condition.id)}
                    className="h-4 w-4 p-0 text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="h-2.5 w-2.5" />
                  </Button>
                </div>

                {/* Airlines */}
                <div className="mb-2 flex flex-wrap gap-1">
                  {(condition.airline_group || []).map((airline, airlineIndex) => (
                    <span
                      key={`condition-${conditionIndex}-airline-${airline.iata}`}
                      className="inline-block rounded border bg-white px-1.5 py-0.5 text-xs text-default-900"
                    >
                      {airline.iata}
                    </span>
                  ))}
                </div>

                {/* Editable Settings */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-default-500">Arrival:</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="60"
                        max="480"
                        step="15"
                        value={condition.mean_minutes}
                        onChange={(e) =>
                          onUpdateConfiguredGroup(condition.id, { mean_minutes: Number(e.target.value) })
                        }
                        className="w-16 rounded border border-gray-300 px-3 py-1.5 text-center text-sm focus:outline-none focus:ring-1"
                        style={
                          {
                            '--tw-ring-color': condition.color,
                            borderColor: `${condition.color}30`,
                          } as React.CSSProperties
                        }
                        onFocus={(e) => {
                          e.target.style.borderColor = condition.color;
                          e.target.style.setProperty('--tw-ring-color', condition.color);
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#d1d5db';
                        }}
                      />
                      <span className="text-sm text-default-500">min before</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-default-500">Spread:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">±</span>
                      <input
                        type="number"
                        min="10"
                        max="60"
                        step="5"
                        value={condition.std_dev_minutes}
                        onChange={(e) =>
                          onUpdateConfiguredGroup(condition.id, { std_dev_minutes: Number(e.target.value) })
                        }
                        className="w-14 rounded border border-gray-300 px-3 py-1.5 text-center text-sm focus:outline-none focus:ring-1"
                        style={
                          {
                            '--tw-ring-color': condition.color,
                            borderColor: `${condition.color}30`,
                          } as React.CSSProperties
                        }
                        onFocus={(e) => {
                          e.target.style.borderColor = condition.color;
                          e.target.style.setProperty('--tw-ring-color', condition.color);
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#d1d5db';
                        }}
                      />
                      <span className="text-sm text-default-500">minutes</span>
                    </div>
                  </div>

                  {/* Summary Info */}
                  <div className="space-y-1 border-t border-gray-200 pt-2">
                    <p className="text-xs text-default-500">
                      Arrival: {minutesToHoursMinutes(condition.mean_minutes)} before departure
                    </p>
                    <p className="text-xs text-muted-foreground">Spread: ±{condition.std_dev_minutes} minutes</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Distribution Chart */}
          <div className="w-full">
            <TabPassengerScheduleNormalDistribution
              airlineParams={(destributionConditions || []).map((condition, conditionIndex) => ({
                iata: condition.id,
                name: `${condition.name} (${(condition.airline_group || []).map((a) => a.iata).join(', ')})`,
                mean: -condition.mean_minutes, // Convert to negative (before departure)
                stdDev: condition.std_dev_minutes,
                color: condition.color,
              }))}
              title="Passenger Arrival Time Distribution"
              xAxisTitle="Time before departure (minutes)"
              height={500}
            />
          </div>

          {/* Complete Setup Button - Bottom Right */}
          <div className="mt-4 flex justify-end">
            <Button
              onClick={handleCompleteSetup}
              disabled={!canCompleteSetup || loading}
              className="bg-primary text-white hover:bg-primary/90 disabled:bg-gray-300"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              {loading ? 'Processing...' : 'Complete Setup'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Passenger Show-up Result Chart는 TabPassengerSchedule에서 관리됨 */}
    </div>
  );
}
