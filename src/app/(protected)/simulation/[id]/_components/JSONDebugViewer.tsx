'use client';

import React, { useMemo, useState } from 'react';
import { useScenarioStore } from '@/stores/useScenarioStore';

interface JSONDebugViewerProps {
  visible: boolean;
  apiRequestLog?: {
    timestamp: string;
    request: any;
    response: any;
    status: 'loading' | 'success' | 'error';
    error?: string;
  } | null;
}

export default function JSONDebugViewer({ visible, apiRequestLog }: JSONDebugViewerProps) {
  const [collapsed, setCollapsed] = useState({
    apiRequestLog: false, // API 요청 로그 (기본 펼침)
    flightSchedule: false, // 기본적으로 접힘
    passengerSchedule: false,
    processingProcedures: false,
    facilityConnection: false,
    facilityInformation: false,
    finalJSON: true, // 최종 JSON 구조 (기본 펼침)
    components: true, // components 키 (기본 접힘)
    processes: true, // processes 키 (기본 접힘)
  });

  // zustand에서 모든 탭 데이터 수집 (개별 구독으로 변경)
  const scenarioProfile = useScenarioStore((s) => s.scenarioProfile);
  const flightSchedule = useScenarioStore((s) => s.flightSchedule);
  const passengerSchedule = useScenarioStore((s) => s.passengerSchedule);
  const airportProcessing = useScenarioStore((s) => s.airportProcessing);
  const facilityConnection = useScenarioStore((s) => s.facilityConnection);
  const facilityCapacity = useScenarioStore((s) => s.facilityCapacity);

  // passengerSchedule의 destribution_conditions를 별도로 구독
  const passengerDestributionConditions = useScenarioStore((s) => s.passengerSchedule.destribution_conditions);

  // 실제 S3 저장 구조로 합치기
  const scenarioMetadata = useMemo(() => {
    return {
      scenario_id: scenarioProfile.scenarioName || 'unknown',
      tabs: {
        overview: scenarioProfile,
        flightSchedule: flightSchedule,
        passengerSchedule: passengerSchedule,
        processingProcedures: airportProcessing,
        facilityConnection: facilityConnection,
        facilityInformation: facilityCapacity,
      },
      // last_updated: new Date().toISOString(), // SSR/CSR hydration 오류 방지 위해 제거
    };
  }, [scenarioProfile, flightSchedule, passengerSchedule, airportProcessing, facilityConnection, facilityCapacity]);

  // 보조 함수들 (useMemo 위에서 먼저 정의)
  const generateFacilitySchedules = (length: number) => {
    return Array(18)
      .fill(null)
      .map(() => Array(length).fill(180.0));
  };

  const generateDefaultMatrix = () => {
    return {
      A: { Dep1: 0.96, Dep2: 0.04 },
      B: { Dep1: 0.92, Dep2: 0.08 },
      C: { Dep1: 0.88, Dep2: 0.12 },
      D: { Dep1: 0.84, Dep2: 0.16 },
      E: { Dep1: 0.8, Dep2: 0.2 },
      F: { Dep1: 0.76, Dep2: 0.24 },
      G: { Dep1: 0.6, Dep2: 0.4 },
      H: { Dep1: 0.24, Dep2: 0.76 },
    };
  };

  const generatePriorityMatrix = () => {
    return passengerSchedule.destribution_conditions.map((param) => ({
      conditions: param.conditions,
      mean: param.mean,
      standard_deviation: param.standard_deviation,
    }));
  };

  // 실시간 JSON 생성
  const simulationJSON = useMemo(() => {
    // Components 생성 (Processing Procedures + Facility Information)
    // facilityConnection.processes 객체에서 Entry(0번) 제외하고 나머지로 components 생성
    const components = Object.entries(facilityConnection.processes || {})
      .filter(([key, process]) => key !== '0') // Entry 프로세스 제외
      .map(([key, process]) => {
        // 간단한 노드 생성 - name과 nodes만 사용
        const nodes = (process.nodes || []).map((nodeName) => ({
          id: 0, // 모든 노드 id를 0으로 설정
          name: nodeName,
          facility_count: 18,
          facility_type: 'limited_facility',
          max_queue_length: 200,
          facility_schedules: generateFacilitySchedules(144), // 144개 기본값
        }));

        return {
          name: process.name, // 원래 name 그대로 사용
          nodes: nodes,
        };
      });

    // Processes 생성 (Facility Connection) - 원본 JSON 구조에 맞게 processes로 명명
    const processes = facilityConnection.processes || {};

    return {
      components,
      processes,
    };
  }, [
    facilityConnection.processes,
    passengerSchedule.destribution_conditions,
    flightSchedule.airport,
    flightSchedule.date,
  ]);

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
        <button
          onClick={() => toggleCollapse(collapsedKey)}
          className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          <span className={`transform transition-transform ${isCollapsed ? 'rotate-0' : 'rotate-90'}`}>▶</span>
          {title}
        </button>

        {!isCollapsed && (
          <pre className={`max-h-80 overflow-auto rounded border ${bgColor} p-2 text-xs`}>
            {JSON.stringify(cleanData, null, 2)}
          </pre>
        )}
      </div>
    );
  };

  const renderJSONSection = (title: string, data: any, collapsedKey: keyof typeof collapsed) => {
    const isCollapsed = collapsed[collapsedKey];

    // facility_schedules 부분을 압축하여 표시
    const processedData =
      title === 'components' || title === 'Complete JSON Structure'
        ? Array.isArray(data)
          ? data.map((component: any) => ({
              ...component,
              nodes: component.nodes?.map((node: any) => ({
                ...node,
                facility_schedules: node.facility_schedules
                  ? `[${node.facility_schedules.length} arrays x ${node.facility_schedules[0]?.length || 0} items each - COMPRESSED]`
                  : node.facility_schedules,
              })),
            }))
          : title === 'Complete JSON Structure'
            ? {
                ...data,
                components: data.components?.map((component: any) => ({
                  ...component,
                  nodes: component.nodes?.map((node: any) => ({
                    ...node,
                    facility_schedules: node.facility_schedules
                      ? `[${node.facility_schedules.length} arrays x ${node.facility_schedules[0]?.length || 0} items each - COMPRESSED]`
                      : node.facility_schedules,
                  })),
                })),
              }
            : data
        : data;

    return (
      <div className="mb-4">
        <button
          onClick={() => toggleCollapse(collapsedKey)}
          className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          <span className={`transform transition-transform ${isCollapsed ? 'rotate-0' : 'rotate-90'}`}>▶</span>
          {title} ({Array.isArray(data) ? data.length : Object.keys(data || {}).length} items)
          {(title === 'components' || title === 'Complete JSON Structure') && (
            <span className="text-xs text-gray-500">(facility_schedules compressed)</span>
          )}
        </button>

        {!isCollapsed && (
          <pre className="max-h-80 overflow-auto rounded border bg-gray-100 p-3 text-xs">
            {JSON.stringify(processedData, null, 2)}
          </pre>
        )}
      </div>
    );
  };

  if (!visible) return null;

  return (
    <div className="mt-8 border-t pt-6">
      <h3 className="mb-4 text-lg font-semibold text-gray-800">🐛 Real-time JSON Debug Viewer</h3>

      <div className="rounded-lg border bg-white p-4">
        {/* 탭 순서대로 정렬 */}

        {/* 0. API Request Log - 실시간 API 요청/응답 */}
        {apiRequestLog && (
          <div className="mb-4">
            <button
              className="bg-red-50 hover:bg-red-100 mb-2 flex w-full items-center gap-2 rounded p-2 text-left font-medium text-gray-700"
              onClick={() => setCollapsed((prev) => ({ ...prev, apiRequestLog: !prev.apiRequestLog }))}
            >
              <span className={`transform transition-transform ${collapsed.apiRequestLog ? 'rotate-0' : 'rotate-90'}`}>
                ▶
              </span>
              🚀 Last API Request ({apiRequestLog.status === 'loading' ? 'Loading...' : apiRequestLog.status})
              <span className="ml-auto text-xs text-gray-500">
                {new Date(apiRequestLog.timestamp).toLocaleTimeString()}
              </span>
            </button>

            {!collapsed.apiRequestLog && (
              <div className="bg-red-50 space-y-3 rounded border p-3">
                <div>
                  <div className="mb-1 text-xs font-medium text-gray-600">📤 Request:</div>
                  <pre className="max-h-40 overflow-auto rounded border bg-white p-2 text-xs">
                    {JSON.stringify(apiRequestLog.request, null, 2)}
                  </pre>
                </div>

                {apiRequestLog.status === 'success' && (
                  <div>
                    <div className="mb-1 text-xs font-medium text-gray-600">📥 Response:</div>
                    <pre className="max-h-40 overflow-auto rounded border bg-white p-2 text-xs">
                      {JSON.stringify(apiRequestLog.response, null, 2)}
                    </pre>
                  </div>
                )}

                {apiRequestLog.status === 'error' && (
                  <div>
                    <div className="text-red-600 mb-1 text-xs font-medium">❌ Error:</div>
                    <pre className="bg-red-100 text-red-700 max-h-20 overflow-auto rounded border p-2 text-xs">
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

        {/* 4. Facility Connection - 전체 스토어 데이터 */}
        {renderCollapsibleSection('Facility Connection', facilityConnection, 'facilityConnection', 'bg-purple-50')}

        {/* 5. Facility Information - 전체 스토어 데이터 */}
        {renderCollapsibleSection('Facility Information', facilityCapacity, 'facilityInformation', 'bg-indigo-50')}

        {/* S3 저장 구조 메타데이터 표시 */}
        <div className="mt-8 border-t pt-6">
          <h4 className="mb-3 text-sm font-semibold text-gray-800">🗂️ Scenario Metadata (S3 저장 구조)</h4>
          <pre className="max-h-96 overflow-auto rounded border bg-blue-50 p-2 text-xs">
            {JSON.stringify(scenarioMetadata, null, 2)}
          </pre>
        </div>

        {/* 최종 생성 결과 - 위치 이동 */}
        <div className="mt-6 border-t border-gray-300 pt-4">
          <h4 className="mb-3 text-sm font-semibold text-gray-800">📄 Final JSON Structure (S3 Ready)</h4>

          {/* 최종 JSON 전체 구조 */}
          <pre className="max-h-96 overflow-auto rounded border bg-gray-50 p-2 text-xs">
            {JSON.stringify(simulationJSON, null, 2)}
          </pre>

          {/* 전체 JSON 다운로드 버튼 및 관련 코드 완전히 제거 */}
        </div>
      </div>
    </div>
  );
}
