'use client';

import React, { useMemo, useState } from 'react';
import { Bug, ChevronDown, ChevronRight, Download, Folder, Rocket, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useSimulationStore } from '../_stores';
import { usePassengerStore } from '../_stores/passengerStore';

interface JSONDebugViewerProps {
  visible: boolean;
  simulationId: string; // 시나리오 ID 추가
  apiRequestLog?: {
    timestamp: string;
    request?: any;
    response?: any;
    status: 'loading' | 'success' | 'error';
    error?: string;
  } | null;
}

interface JSONTreeNodeProps {
  data: any;
  keyName?: string;
  depth?: number;
  isRoot?: boolean;
  collapsedPaths: Set<string>;
  togglePath: (path: string) => void;
  currentPath?: string;
}

// 데이터 타입 판별 함수들
const getValueType = (value: any): string => {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  return 'unknown';
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'object':
      return <span className="text-default-600">{'{}'}</span>;
    case 'array':
      return <span className="text-default-600">{'[]'}</span>;
    default:
      return null;
  }
};

const formatValue = (value: any, type: string): string => {
  if (type === 'string') return `"${value}"`;
  if (type === 'null') return 'null';
  if (type === 'boolean') return value ? 'true' : 'false';
  if (type === 'number') return String(value);
  return String(value);
};

// 🌳 재귀적 JSON Tree Node 컴포넌트
const JSONTreeNode: React.FC<JSONTreeNodeProps> = ({
  data,
  keyName,
  depth = 0,
  isRoot = false,
  collapsedPaths,
  togglePath,
  currentPath = '',
}) => {
  const type = getValueType(data);
  const fullPath = keyName ? (currentPath ? `${currentPath}.${keyName}` : keyName) : currentPath;
  const isCollapsed = collapsedPaths.has(fullPath);
  const hasChildren =
    (type === 'object' && data && Object.keys(data).length > 0) || (type === 'array' && data && data.length > 0);

  // Primitive 값인 경우
  if (!hasChildren) {
    return (
      <div className="flex items-center gap-2 py-1 text-sm" style={{ paddingLeft: `${depth * 12}px` }}>
        {keyName && (
          <>
            <span className="text-default-700">{keyName}:</span>
            <span className="text-default-900">{formatValue(data, type)}</span>
          </>
        )}
        {!keyName && <span className="text-default-900">{formatValue(data, type)}</span>}
      </div>
    );
  }

  // Object 또는 Array인 경우
  return (
    <div>
      <div
        className="flex cursor-pointer items-center gap-2 rounded py-1 text-sm hover:bg-gray-50"
        style={{ paddingLeft: `${depth * 5}px` }}
        onClick={() => togglePath(fullPath)}
      >
        {isCollapsed ? (
          <ChevronRight className="h-3 w-3 text-default-500" />
        ) : (
          <ChevronDown className="h-3 w-3 text-default-500" />
        )}
        <span className="text-default-700">
          {keyName && <span>{keyName}: </span>}
          {getTypeIcon(type)}
        </span>
      </div>

      {!isCollapsed && (
        <div>
          {type === 'object' &&
            Object.entries(data).map(([key, value]) => (
              <JSONTreeNode
                key={`${fullPath}.${key}`}
                data={value}
                keyName={key}
                depth={depth + 1}
                collapsedPaths={collapsedPaths}
                togglePath={togglePath}
                currentPath={fullPath}
              />
            ))}
          {type === 'array' &&
            data.map((item: any, index: number) => (
              <JSONTreeNode
                key={`${fullPath}[${index}]`}
                data={item}
                keyName={`[${index}]`}
                depth={depth + 1}
                collapsedPaths={collapsedPaths}
                togglePath={togglePath}
                currentPath={fullPath}
              />
            ))}
        </div>
      )}
    </div>
  );
};

export default function JSONDebugViewer({ visible, simulationId, apiRequestLog }: JSONDebugViewerProps) {
  const [collapsed, setCollapsed] = useState({
    apiRequestLog: false, // API 요청 로그 (기본 펼침)
    unifiedStore: false, // 🆕 통합 Store (기본 펼침)
    passengerStore: false, // 🆕 PassengerStore (기본 펼침)
    generatedJSON: false, // 🆕 Generated Passenger JSON (기본 펼침)
  });

  // 🌳 JSON Tree용 경로별 collapse 상태 관리
  const [collapsedPaths, setCollapsedPaths] = useState<Set<string>>(
    new Set([
      // 기본으로 접힌 경로들
      'context',
      'flight.availableConditions',
      'passenger.pax_demographics',
      'passenger.pax_arrival_patterns.rules',
      'process_flow',
      'workflow',
      // PassengerStore 기본 접힌 경로들
      'nationality.createdRules',
      'profile.createdRules',
      'loadFactor.createdRules',
      'showUpTime.createdRules',
      'pax_generation.rules',
      'pax_demographics',
      'pax_arrival_patterns.rules',
    ])
  );

  // 🆕 통합 Simulation Store 데이터 수집
  const unifiedStore = useSimulationStore();

  // 🆕 PassengerStore 데이터 수집
  const passengerStore = usePassengerStore();

  // 🆕 Generated Passenger JSON (메모이제이션)
  const generatedPassengerJSON = useMemo(() => {
    try {
      return passengerStore.generatePassengerJSON();
    } catch (error) {
      return {
        error: 'Failed to generate JSON',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }, [passengerStore]);

  const toggleCollapse = (section: keyof typeof collapsed) => {
    setCollapsed((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const togglePath = (path: string) => {
    setCollapsedPaths((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const renderJSONTreeSection = (
    title: string,
    data: any,
    collapsedKey: keyof typeof collapsed,
    bgColor: string = 'bg-gray-50'
  ) => {
    const isCollapsed = collapsed[collapsedKey];

    // 🧹 함수(actions)들을 모두 제거한 깔끔한 데이터만 추출
    const cleanData =
      data && typeof data === 'object'
        ? Object.fromEntries(
            Object.entries(data).filter(([key, value]) => {
              // 함수 타입 필터링
              if (typeof value === 'function') return false;
              // actions 키 필터링 (혹시 모를 경우)
              if (key === 'actions') return false;
              return true;
            })
          )
        : data;

    return (
      <div className="mb-6">
        <button
          onClick={() => toggleCollapse(collapsedKey)}
          className={`mb-2 flex w-full items-center justify-start gap-2 rounded p-2 text-left font-medium text-default-900 ${bgColor} hover:${bgColor.replace('50', '100')}`}
        >
          <ChevronRight
            className={`h-4 w-4 transform transition-transform ${isCollapsed ? 'rotate-0' : 'rotate-90'}`}
          />
          <Folder className="h-4 w-4" />
          {title}
        </button>

        {!isCollapsed && (
          <div className={`space-y-3 rounded border p-3 ${bgColor}`}>
            {/* 🌳 Interactive JSON Tree */}
            <div>
              <div className="mb-1 flex items-center gap-2 text-xs font-medium text-default-500">
                <Folder className="h-3 w-3" />
                Interactive Tree:
              </div>
              <div className="max-h-96 overflow-auto rounded border bg-white p-4">
                <JSONTreeNode data={cleanData} isRoot={true} collapsedPaths={collapsedPaths} togglePath={togglePath} />
              </div>
            </div>

            {/* 📝 Raw JSON String */}
            <div>
              <div className="mb-1 flex items-center gap-2 text-xs font-medium text-default-500">
                <Download className="h-3 w-3" />
                Raw JSON:
              </div>
              <div className="max-h-80 overflow-auto rounded border bg-white p-4">
                <pre className="text-xs">{JSON.stringify(cleanData, null, 2)}</pre>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!visible) return null;

  // 🎛️ 전체 접기/펴기 기능
  const expandAll = () => {
    setCollapsedPaths(new Set());
  };

  const collapseAll = () => {
    setCollapsedPaths(
      new Set([
        'context',
        'flight',
        'passenger',
        'process_flow',
        'workflow',
        'context.scenarioId',
        'context.airport',
        'context.date',
        'context.lastSavedAt',
        'flight.selectedConditions',
        'flight.availableConditions',
        'flight.appliedFilterResult',
        'passenger.settings',
        'passenger.pax_demographics',
        'passenger.pax_arrival_patterns',
        'passenger.pax_demographics.nationality',
        'passenger.pax_demographics.profile',
        'passenger.pax_arrival_patterns.rules',
        'passenger.pax_arrival_patterns.default',
        // PassengerStore 경로들
        'nationality',
        'profile',
        'loadFactor',
        'showUpTime',
        'nationality.createdRules',
        'profile.createdRules',
        'loadFactor.createdRules',
        'showUpTime.createdRules',
        // Generated JSON 경로들
        'settings',
        'pax_generation',
        'pax_demographics',
        'pax_arrival_patterns',
        'pax_generation.rules',
        'pax_demographics.nationality',
        'pax_demographics.profile',
        'pax_arrival_patterns.rules',
      ])
    );
  };

  return (
    <div className="mt-8 border-t pt-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-default-900">
          <Bug className="h-5 w-5" />
          Real-time JSON Debug Viewer
        </h3>

        {/* 🎛️ 전체 제어 버튼들 */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={expandAll} className="flex items-center gap-1 text-xs">
            <ChevronDown className="h-3 w-3" />
            Expand All
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll} className="flex items-center gap-1 text-xs">
            <ChevronRight className="h-3 w-3" />
            Collapse All
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-4">
        {/* 탭 순서대로 정렬 */}

        {/* 0. API Request Log - 실시간 API 요청/응답 */}
        {apiRequestLog && (
          <div className="mb-4">
            <button
              className="mb-2 flex w-full items-center gap-2 rounded bg-red-50 p-2 text-left font-medium text-default-900 hover:bg-red-100"
              onClick={() => setCollapsed((prev) => ({ ...prev, apiRequestLog: !prev.apiRequestLog }))}
            >
              <ChevronRight
                className={`h-4 w-4 transform transition-transform ${collapsed.apiRequestLog ? 'rotate-0' : 'rotate-90'}`}
              />
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

        {/* 1. Unified Simulation Store - 통합 단일 스토어 */}
        {renderJSONTreeSection('Unified Simulation Store', unifiedStore, 'unifiedStore', 'bg-green-50')}

        {/* 2. PassengerStore - UI 상태 데이터 */}
        <div className="mb-6">
          <button
            onClick={() => toggleCollapse('passengerStore')}
            className="mb-2 flex w-full items-center justify-start gap-2 rounded bg-blue-50 p-2 text-left font-medium text-default-900 hover:bg-blue-100"
          >
            <ChevronRight
              className={`h-4 w-4 transform transition-transform ${collapsed.passengerStore ? 'rotate-0' : 'rotate-90'}`}
            />
            <Folder className="h-4 w-4" />
            PassengerStore (UI State)
          </button>

          {!collapsed.passengerStore && (
            <div className="space-y-3 rounded border bg-blue-50 p-3">
              <div>
                <div className="mb-1 flex items-center gap-2 text-xs font-medium text-default-500">
                  <Folder className="h-3 w-3" />
                  Raw JSON:
                </div>
                <div className="max-h-80 overflow-auto rounded border bg-white p-4">
                  <pre className="text-xs">{JSON.stringify(passengerStore, null, 2)}</pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. Generated Passenger JSON - 백엔드 전송용 JSON */}
        <div className="mb-6">
          <button
            onClick={() => toggleCollapse('generatedJSON')}
            className="mb-2 flex w-full items-center justify-start gap-2 rounded bg-purple-50 p-2 text-left font-medium text-default-900 hover:bg-purple-100"
          >
            <ChevronRight
              className={`h-4 w-4 transform transition-transform ${collapsed.generatedJSON ? 'rotate-0' : 'rotate-90'}`}
            />
            <Folder className="h-4 w-4" />
            Generated Passenger JSON (Backend)
          </button>

          {!collapsed.generatedJSON && (
            <div className="space-y-3 rounded border bg-purple-50 p-3">
              <div>
                <div className="mb-1 flex items-center gap-2 text-xs font-medium text-default-500">
                  <Download className="h-3 w-3" />
                  Raw JSON:
                </div>
                <div className="max-h-80 overflow-auto rounded border bg-white p-4">
                  <pre className="text-xs">{JSON.stringify(generatedPassengerJSON, null, 2)}</pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 🗑️ Flight Schedule V2 섹션 제거 - 통합 스토어에서 확인 가능 */}
      </div>
    </div>
  );
}
