'use client';

import React, { useState } from 'react';
import { Bug, ChevronRight, Copy, Download, Folder, Rocket, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useSimulationStore } from '../../_stores';

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

export default function JSONDebugViewer({ visible, simulationId, apiRequestLog }: JSONDebugViewerProps) {
  const [collapsed, setCollapsed] = useState({
    apiRequestLog: false, // API 요청 로그 (기본 펼침)
    unifiedStore: false, // 통합 Store (기본 펼침)
  });

  // 통합 Simulation Store 데이터 수집
  const unifiedStore = useSimulationStore();

  const toggleCollapse = (section: keyof typeof collapsed) => {
    setCollapsed((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // JSON 클립보드 복사 함수
  const copyToClipboard = async (data: any) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      // 복사 성공 시 사용자에게 알림 (선택적)
      // alert('클립보드에 복사되었습니다!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
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
            {/* 📝 Raw JSON String */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-medium text-default-500">
                  <Download className="h-3 w-3" />
                  Raw JSON:
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 px-2 text-xs"
                  onClick={() => copyToClipboard(cleanData)}
                >
                  <Copy className="mr-1 h-3 w-3" />
                  Copy
                </Button>
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

  return (
    <div className="mt-8 pt-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-default-900">
          <Bug className="h-5 w-5" />
          Real-time JSON Debug Viewer
        </h3>
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
                  <div className="mb-1 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-medium text-default-500">
                      <Send className="h-3 w-3" />
                      Request:
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 px-2 text-xs"
                      onClick={() => copyToClipboard(apiRequestLog.request)}
                    >
                      <Copy className="mr-1 h-3 w-3" />
                      Copy
                    </Button>
                  </div>
                  <pre className="max-h-40 overflow-auto rounded border bg-white p-2 text-xs">
                    {JSON.stringify(apiRequestLog.request, null, 2)}
                  </pre>
                </div>

                {apiRequestLog.status === 'success' && (
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-medium text-default-500">
                        <Download className="h-3 w-3" />
                        Response:
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-xs"
                        onClick={() => copyToClipboard(apiRequestLog.response)}
                      >
                        <Copy className="mr-1 h-3 w-3" />
                        Copy
                      </Button>
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

        {/* 🗑️ Flight Schedule V2 섹션 제거 - 통합 스토어에서 확인 가능 */}
      </div>
    </div>
  );
}
