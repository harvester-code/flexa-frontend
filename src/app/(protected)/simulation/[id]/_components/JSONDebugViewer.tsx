'use client';

import React, { useMemo, useState } from 'react';
import { Bug, ChevronRight, Download, Folder, Rocket, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  useFlightScheduleStore,
  usePassengerScheduleStore,
  useProcessingProceduresStore,
} from '../_stores';

interface JSONDebugViewerProps {
  visible: boolean;
  simulationId: string; // 시나리오 ID 추가
  apiRequestLog?: {
    timestamp: string;
    request: any;
    response: any;
    status: 'loading' | 'success' | 'error';
    error?: string;
  } | null;
}

export default function JSONDebugViewer({ visible, simulationId, apiRequestLog }: JSONDebugViewerProps) {
  const [collapsed, setCollapsed] = useState({
    apiRequestLog: false, // API 요청 로그 (기본 펼침)
    flightSchedule: false, // 기본적으로 접힘
    passengerSchedule: false,
    processingProcedures: false,
  });

  // 개별 모듈화된 스토어에서 모든 탭 데이터 수집

  const flightSchedule = {
    airport: useFlightScheduleStore((s) => s.airport),
    date: useFlightScheduleStore((s) => s.date),
    type: useFlightScheduleStore((s) => s.type),
    availableConditions: useFlightScheduleStore((s) => s.availableConditions),
    selectedConditions: useFlightScheduleStore((s) => s.selectedConditions),
    chartData: useFlightScheduleStore((s) => s.chartData),
    total: useFlightScheduleStore((s) => s.total),
    isCompleted: useFlightScheduleStore((s) => s.isCompleted),
  };

  const passengerSchedule = {
    settings: usePassengerScheduleStore((s) => s.settings),
    pax_demographics: usePassengerScheduleStore((s) => s.pax_demographics),
    pax_arrival_patterns: usePassengerScheduleStore((s) => s.pax_arrival_patterns),
    apiResponseData: usePassengerScheduleStore((s) => s.apiResponseData),
    isCompleted: usePassengerScheduleStore((s) => s.isCompleted),
  };

  const airportProcessing = {
    process_flow: useProcessingProceduresStore((s) => s.process_flow),
    isCompleted: useProcessingProceduresStore((s) => s.isCompleted),
  };





  // 실제 S3 저장 구조로 합치기
  const scenarioMetadata = useMemo(() => {
    return {
      scenario_id: simulationId, // 실제 시나리오 ID 사용
      tabs: {
        flightSchedule: flightSchedule,
        passengerSchedule: passengerSchedule,
        processingProcedures: airportProcessing,
      },
      // last_updated: new Date().toISOString(), // SSR/CSR hydration 오류 방지 위해 제거
    };
  }, [simulationId, flightSchedule, passengerSchedule, airportProcessing]);



  const toggleCollapse = (section: keyof typeof collapsed) => {
    setCollapsed((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const renderCollapsibleSection = (
    title: string,
    data: any,
    collapsedKey: keyof typeof collapsed,
    bgColor: string = 'bg-gray-100'
  ) => {
    const isCollapsed = collapsed[collapsedKey];

    // actions 필드를 제거한 데이터 생성
    const cleanData =
      data && typeof data === 'object'
        ? Object.fromEntries(Object.entries(data).filter(([key]) => key !== 'actions'))
        : data;

    return (
      <div className="mb-4">
        <Button
          variant="link"
          onClick={() => toggleCollapse(collapsedKey)}
          className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          <ChevronRight className={`h-4 w-4 transform transition-transform ${isCollapsed ? 'rotate-0' : 'rotate-90'}`} />
          {title}
        </Button>

        {!isCollapsed && (
          <pre className={`max-h-80 overflow-auto rounded border ${bgColor} p-2 text-xs`}>
            {JSON.stringify(cleanData, null, 2)}
          </pre>
        )}
      </div>
    );
  };



  if (!visible) return null;

  return (
    <div className="mt-8 border-t pt-6">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-default-900">
        <Bug className="h-5 w-5" />
        Real-time JSON Debug Viewer
      </h3>

      <div className="rounded-lg border bg-white p-4">
        {/* 탭 순서대로 정렬 */}

        {/* 0. API Request Log - 실시간 API 요청/응답 */}
        {apiRequestLog && (
          <div className="mb-4">
            <button
              className="mb-2 flex w-full items-center gap-2 rounded bg-red-50 p-2 text-left font-medium text-default-900 hover:bg-red-100"
              onClick={() => setCollapsed((prev) => ({ ...prev, apiRequestLog: !prev.apiRequestLog }))}
            >
              <ChevronRight className={`h-4 w-4 transform transition-transform ${collapsed.apiRequestLog ? 'rotate-0' : 'rotate-90'}`} />
              <Rocket className="h-4 w-4" />
              Last API Request ({apiRequestLog.status === 'loading' ? 'Loading...' : apiRequestLog.status})
              <span className="ml-auto text-xs text-default-500">
                {new Date(apiRequestLog.timestamp).toLocaleTimeString()}
              </span>
            </button>

            {!collapsed.apiRequestLog && (
              <div className="space-y-3 rounded border bg-red-50 p-3">
                <div>
                  <div className="mb-1 flex items-center gap-2 text-xs font-medium text-default-500">
                    <Send className="h-3 w-3" />
                    Request:
                  </div>
                  <pre className="max-h-40 overflow-auto rounded border bg-white p-2 text-xs">
                    {JSON.stringify(apiRequestLog.request, null, 2)}
                  </pre>
                </div>

                {apiRequestLog.status === 'success' && (
                  <div>
                    <div className="mb-1 flex items-center gap-2 text-xs font-medium text-default-500">
                      <Download className="h-3 w-3" />
                      Response:
                    </div>
                    <pre className="max-h-40 overflow-auto rounded border bg-white p-2 text-xs">
                      {JSON.stringify(apiRequestLog.response, null, 2)}
                    </pre>
                  </div>
                )}

                {apiRequestLog.status === 'error' && (
                  <div>
                    <div className="mb-1 flex items-center gap-2 text-xs font-medium text-red-600">
                      <X className="h-3 w-3" />
                      Error:
                    </div>
                    <pre className="max-h-20 overflow-auto rounded border bg-red-100 p-2 text-xs text-red-700">
                      {apiRequestLog.error}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 1. Flight Schedule - 전체 스토어 데이터 */}
        {renderCollapsibleSection('Flight Schedule', flightSchedule, 'flightSchedule', 'bg-blue-50')}

        {/* 2. Passenger Schedule - 전체 스토어 데이터 */}
        {renderCollapsibleSection('Passenger Schedule', passengerSchedule, 'passengerSchedule', 'bg-green-50')}

        {/* 3. Processing Procedures - 전체 스토어 데이터 */}
        {renderCollapsibleSection('Processing Procedures', airportProcessing, 'processingProcedures', 'bg-yellow-50')}





        {/* S3 저장 구조 메타데이터 표시 */}
        <div className="mt-8 border-t pt-6">
          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-default-900">
            <Folder className="h-4 w-4" />
            Scenario Metadata (S3 저장 구조)
          </h4>
          <pre className="max-h-96 overflow-auto rounded border bg-blue-50 p-2 text-xs">
            {JSON.stringify(scenarioMetadata, null, 2)}
          </pre>
        </div>


      </div>
    </div>
  );
}
