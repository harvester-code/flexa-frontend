"use client";

import React, { useState } from "react";
import { Check, CheckCircle, Play, Users, X, XCircle } from "lucide-react";
import { createPassengerShowUp } from "@/services/simulationService";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { useToast } from "@/hooks/useToast";
import Spinner from "@/components/ui/Spinner";
import { useSimulationStore } from "../../_stores";
import DistributionSettings from "./DistributionSettings";
import LoadFactorSettings from "./LoadFactorSettings";
import ShowUpTimeSettings from "./ShowUpTimeSettings";

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

  // zustand store에서 데이터 가져오기
  const passengerData = useSimulationStore((state) => state.passenger);
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

  // 방문한 탭 초기값 설정 - zustand에 값이 있으면 방문한 것으로 처리
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(() => {
    const initialTabs = new Set<string>();
    // Load Factor에 값이 있으면 방문한 것으로 처리
    if (passengerData.pax_generation.default.load_factor !== null) {
      initialTabs.add("loadfactor");
    }
    // Show-up-Time에 값이 있으면 방문한 것으로 처리
    if (passengerData.pax_arrival_patterns.default.mean !== null &&
        passengerData.pax_arrival_patterns.default.std !== null) {
      initialTabs.add("showuptime");
    }
    return initialTabs;
  });

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
        min_arrival_minutes: 15,
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <div className="text-lg font-semibold text-default-900">
              Configure Passenger Data
            </div>
            <p className="text-sm font-normal text-default-500">
              Configure passenger profiles with properties
            </p>
          </div>

          {/* Generate Pax Button */}
          <Button
            onClick={handleGeneratePax}
            disabled={!canGeneratePax || isGenerating}
            className="ml-4"
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
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs
          defaultValue="nationality"
          className="w-full"
          onValueChange={(value) => {
            setVisitedTabs(prev => new Set([...prev, value]));
          }}
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
              {visitedTabs.has("loadfactor") ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              Load Factor
            </TabsTrigger>
            <TabsTrigger value="showuptime" className="flex items-center gap-1.5">
              {visitedTabs.has("showuptime") ? (
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
  );
}
