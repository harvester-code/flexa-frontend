"use client";

import React, { useMemo, useState } from "react";
import { ParquetMetadataItem } from "@/types/parquet";
import { BookOpen, CheckCircle, Play, Users, XCircle } from "lucide-react";
import { createPassengerShowUp } from "@/services/simulationService";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { useToast } from "@/hooks/useToast";
import Spinner from "@/components/ui/Spinner";
import { useSimulationStore } from "../../_stores";
import DistributionSettings from "./DistributionSettings";
import LoadFactorSettings from "./LoadFactorSettings";
import ShowUpTimeSettings from "./ShowUpTimeSettings";
import SimulationCardHeader from "../SimulationCardHeader";
import PassengerPresetModal from "./PassengerPresetModal";
import { PassengerPresetData } from "@/types/passengerPresetTypes";
import { getCategoryNameFromField } from "../facilities/schedule-editor/badgeMappings";

interface PassengerFilterConditionsProps {
  parquetMetadata: ParquetMetadataItem[];
  simulationId?: string;
  apiRequestLog?: {
    timestamp: string;
    request?: any;
    response?: any;
    status: "loading" | "success" | "error";
    error?: string;
  } | null;
  setApiRequestLog?: (log: any) => void;
}

export default function PassengerFilterConditions({
  parquetMetadata,
  simulationId,
  apiRequestLog,
  setApiRequestLog,
}: PassengerFilterConditionsProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);

  // zustand store에서 데이터 가져오기
  const passengerData = useSimulationStore((state) => state.passenger);
  const loadPassengerPreset = useSimulationStore((state) => state.loadPassengerPreset);
  const contextData = useSimulationStore((state) => state.context);
  const setStepCompleted = useSimulationStore(
    (state) => state.setStepCompleted
  );

  // 여객 차트 결과 저장 액션
  const setPassengerChartResult = useSimulationStore(
    (state) => state.setPassengerChartResult
  );

  // 활성화 조건 확인: load_factor와 show-up-time default 값이 null이 아닌지
  const canGeneratePax =
    passengerData.pax_generation.default.load_factor !== null &&
    passengerData.pax_arrival_patterns.default.mean !== null &&
    passengerData.pax_arrival_patterns.default.std !== null;

  // 탭 완료 여부: 클릭 여부가 아니라 실제 데이터 유무로 판단
  const hasLoadFactor = passengerData.pax_generation.default.load_factor !== null;
  const hasShowUpTime =
    passengerData.pax_arrival_patterns.default.mean !== null &&
    passengerData.pax_arrival_patterns.default.std !== null;

  // Generate Pax API 호출 함수
  const handleGeneratePax = async () => {
    if (!simulationId) {
      toast({
        title: "Error",
        description: "Simulation ID is required",
        variant: "destructive",
      });
      return;
    }

    // API 요청 바디 구성
    const requestBody = {
      settings: {
        airport: contextData.airport,
        date: contextData.date,
        min_arrival_minutes:
          passengerData.settings.min_arrival_minutes ?? 60,
      },
      pax_generation: {
        rules: passengerData.pax_generation.rules || [],
        default: {
          load_factor: passengerData.pax_generation.default.load_factor || 0.85,
        },
      },
      pax_demographics: {
        nationality: {
          available_values:
            passengerData.pax_demographics.nationality.available_values || [],
          rules: passengerData.pax_demographics.nationality.rules || [],
          default: passengerData.pax_demographics.nationality.default || {},
        },
        profile: {
          available_values:
            passengerData.pax_demographics.profile.available_values || [],
          rules: passengerData.pax_demographics.profile.rules || [],
          default: passengerData.pax_demographics.profile.default || {},
        },
      },
      pax_arrival_patterns: {
        rules: passengerData.pax_arrival_patterns.rules || [],
        default: {
          mean: passengerData.pax_arrival_patterns.default.mean || 120,
          std: passengerData.pax_arrival_patterns.default.std || 30,
        },
      },
    };

    try {
      setIsGenerating(true);

      // 🔍 API 요청 시작 로그
      setApiRequestLog?.({
        timestamp: new Date().toISOString(),
        request: requestBody,
        status: "loading",
      });

      // API 호출
      const response = await createPassengerShowUp(simulationId, requestBody);

      // 🔧 백엔드 응답 구조에 맞춰 데이터 매핑
      setPassengerChartResult({
        total: response.data.total || 0,
        chart_x_data: response.data.chart_x_data || [],
        chart_y_data: response.data.chart_y_data || undefined,
        summary: response.data.summary
          ? {
              flights: response.data.summary.flights || 0,
              avg_seats: response.data.summary.avg_seats || 0,
              load_factor: response.data.summary.load_factor || 0,
              min_arrival_minutes:
                response.data.summary.min_arrival_minutes || 15,
            }
          : undefined,
      });

      // 🔍 API 성공 로그
      setApiRequestLog?.({
        timestamp: new Date().toISOString(),
        request: requestBody,
        response: response.data,
        status: "success",
      });

      // 🎯 API 응답을 성공적으로 받았을 때만 Step 2 완료 처리
      setStepCompleted(2, true);

      toast({
        title: "Passenger Schedule Generated",
        description: "Passenger data has been generated successfully.",
      });
    } catch (error) {
      // 🔍 API 에러 로그
      setApiRequestLog?.({
        timestamp: new Date().toISOString(),
        request: requestBody,
        status: "error",
        error: error instanceof Error ? error.message : String(error),
      });

      toast({
        title: "Error",
        description: "Failed to generate passenger data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // parquetMetadata를 field명 기준으로 직접 매핑 (카테고리 변환 없이 원본 포맷 유지)
  // → operating_carrier_name: {"Cebu Pacific Air", ...}, operating_carrier_iata: {"5J", ...}
  const rawFieldValidMap = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    parquetMetadata.forEach((item) => {
      map[item.column] = new Set(Object.keys(item.values));
    });
    return map;
  }, [parquetMetadata]);

  // 불일치 요약: { displayCategory → Map<value, Set<tabLabel>> }
  // field가 parquetMetadata에 없으면 user-defined(nationality/profile 등)이므로 스킵
  const invalidConditionsSummary = useMemo(() => {
    const summary: Record<string, Map<string, Set<string>>> = {};

    const SECTION_TAB: Array<{
      rules: Array<{ conditions: Record<string, string[]> }>;
      tabLabel: string;
    }> = [
      { rules: passengerData.pax_generation.rules || [], tabLabel: "Load Factor tab" },
      { rules: passengerData.pax_demographics.nationality.rules || [], tabLabel: "Nationality tab" },
      { rules: passengerData.pax_demographics.profile.rules || [], tabLabel: "Pax Profile tab" },
      { rules: passengerData.pax_arrival_patterns.rules || [], tabLabel: "Show-up-Time tab" },
    ];

    SECTION_TAB.forEach(({ rules, tabLabel }) => {
      rules.forEach((rule) => {
        Object.entries(rule.conditions || {}).forEach(([field, values]) => {
          const validSet = rawFieldValidMap[field];
          // field가 parquetMetadata에 없으면 user-defined → 검증 스킵
          if (!validSet) return;
          const categoryName = getCategoryNameFromField(field);
          values.forEach((val) => {
            if (!validSet.has(val)) {
              if (!summary[categoryName]) summary[categoryName] = new Map();
              if (!summary[categoryName].has(val)) summary[categoryName].set(val, new Set());
              summary[categoryName].get(val)!.add(tabLabel);
            }
          });
        });
      });
    });

    return summary;
  }, [passengerData, rawFieldValidMap]);

  const handleLoadPreset = (data: PassengerPresetData) => {
    loadPassengerPreset(data as any);
  };

  // Build passenger data snapshot for saving (strip chartResult)
  const passengerDataForPreset = {
    settings: passengerData.settings,
    pax_generation: {
      rules: (passengerData.pax_generation.rules || []).map(({ flightCount: _, ...r }) => r),
      default: { load_factor: passengerData.pax_generation.default.load_factor },
    },
    pax_demographics: {
      nationality: {
        available_values: passengerData.pax_demographics.nationality.available_values,
        rules: (passengerData.pax_demographics.nationality.rules || []).map(({ flightCount: _, ...r }) => r),
        default: (() => { const { flightCount: _, ...d } = passengerData.pax_demographics.nationality.default as any; return d; })(),
      },
      profile: {
        available_values: passengerData.pax_demographics.profile.available_values,
        rules: (passengerData.pax_demographics.profile.rules || []).map(({ flightCount: _, ...r }) => r),
        default: (() => { const { flightCount: _, ...d } = passengerData.pax_demographics.profile.default as any; return d; })(),
      },
    },
    pax_arrival_patterns: {
      rules: (passengerData.pax_arrival_patterns.rules || []).map(({ flightCount: _, ...r }) => r),
      default: {
        mean: passengerData.pax_arrival_patterns.default.mean,
        std: passengerData.pax_arrival_patterns.default.std,
      },
    },
  };

  return (
    <>
    <PassengerPresetModal
      isOpen={isPresetModalOpen}
      onClose={() => setIsPresetModalOpen(false)}
      currentPassengerData={passengerDataForPreset as Record<string, unknown>}
      onLoadPreset={handleLoadPreset}
    />
    <Card>
      <SimulationCardHeader
        icon={Users}
        title="Configure Passenger Data"
        description="Configure passenger profiles with properties"
        actions={
          <div className="flex items-center gap-2 ml-4">
            <Button
              variant="outline"
              onClick={() => setIsPresetModalOpen(true)}
              className="flex items-center gap-2 border-primary/40 text-primary hover:bg-primary/5"
            >
              <BookOpen className="h-4 w-4" />
              Presets
            </Button>
            <Button
              onClick={handleGeneratePax}
              disabled={!canGeneratePax || isGenerating}
            >
              {isGenerating ? (
                <>
                  <Spinner size={16} />
                  Generating...
                </>
              ) : (
                <>
                  <Play size={16} />
                  Generate Pax
                </>
              )}
            </Button>
          </div>
        }
      />
      <CardContent>
        {/* 불일치 조건 경고 패널 */}
        {Object.keys(invalidConditionsSummary).length > 0 && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="mb-2 text-xs font-semibold text-red-700">
              ⚠ The following conditions are not available in this scenario:
            </p>
            <div className="space-y-1.5">
              {Object.entries(invalidConditionsSummary).map(([category, valuesMap]) => (
                <div key={category} className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-medium text-red-700 min-w-fit">{category}</span>
                  <span className="text-xs text-red-400">→</span>
                  {Array.from(valuesMap.entries()).map(([val, locations]) => (
                    <span
                      key={val}
                      className="inline-flex items-center gap-1 rounded border border-red-300 bg-white px-1.5 py-0.5"
                      title={`Found in: ${Array.from(locations).join(", ")}`}
                    >
                      <span className="text-[10px] font-semibold text-red-600">{val}</span>
                      <span className="text-[9px] text-red-400 font-normal">
                        {Array.from(locations).join(", ")}
                      </span>
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        <Tabs
          defaultValue="nationality"
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="nationality" className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Nationality
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Pax Profile
            </TabsTrigger>
            <TabsTrigger value="loadfactor" className="flex items-center gap-1.5">
              {hasLoadFactor ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              Load Factor
            </TabsTrigger>
            <TabsTrigger value="showuptime" className="flex items-center gap-1.5">
              {hasShowUpTime ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              Show-up-Time
            </TabsTrigger>
          </TabsList>

          <TabsContent value="nationality" className="mt-6">
            <DistributionSettings
              parquetMetadata={parquetMetadata}
              configType="nationality"
            />
          </TabsContent>

          <TabsContent value="profile" className="mt-6">
            <DistributionSettings
              parquetMetadata={parquetMetadata}
              configType="profile"
            />
          </TabsContent>

          <TabsContent value="loadfactor" className="mt-6">
            <LoadFactorSettings parquetMetadata={parquetMetadata} />
          </TabsContent>

          <TabsContent value="showuptime" className="mt-6">
            <ShowUpTimeSettings
              parquetMetadata={parquetMetadata}
              simulationId={simulationId}
              hideGenerateButton={true}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
    </>
  );
}
