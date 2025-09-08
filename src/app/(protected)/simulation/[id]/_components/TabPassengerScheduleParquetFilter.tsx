'use client';

import React, { useState } from 'react';
import { Play, Users } from 'lucide-react';
import { createPassengerShowUp } from '@/services/simulationService';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { useToast } from '@/hooks/useToast';
import { useSimulationStore } from '../_stores';
import AddColumnTab from './AddColumnTab';
import SimpleLoadFactorTab from './SimpleLoadFactorTab';
import SimpleShowUpTimeTab from './SimpleShowUpTimeTab';

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

interface TabPassengerScheduleParquetFilterProps {
  parquetMetadata: ParquetMetadataItem[];
  simulationId?: string;
  apiRequestLog?: {
    timestamp: string;
    request?: any;
    response?: any;
    status: 'loading' | 'success' | 'error';
    error?: string;
  } | null;
  setApiRequestLog?: (log: any) => void;
}

export default function TabPassengerScheduleParquetFilter({
  parquetMetadata,
  simulationId,
  apiRequestLog,
  setApiRequestLog,
}: TabPassengerScheduleParquetFilterProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  // zustand store에서 데이터 가져오기
  const passengerData = useSimulationStore((state) => state.passenger);
  const contextData = useSimulationStore((state) => state.context);
  const setStepCompleted = useSimulationStore((state) => state.setStepCompleted);

  // 여객 차트 결과 저장 액션
  const setPassengerChartResult = useSimulationStore((state) => state.setPassengerChartResult);

  // 활성화 조건 확인: load_factor와 show-up-time default 값이 null이 아닌지
  const canGeneratePax =
    passengerData.pax_generation.default.load_factor !== null &&
    passengerData.pax_arrival_patterns.default.mean !== null &&
    passengerData.pax_arrival_patterns.default.std !== null;

  // Generate Pax API 호출 함수
  const handleGeneratePax = async () => {
    if (!simulationId) {
      toast({
        title: 'Error',
        description: 'Simulation ID is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsGenerating(true);

      // API 요청 바디 구성
      const requestBody = {
        settings: {
          airport: contextData.airport || 'ICN',
          date: contextData.date || new Date().toISOString().split('T')[0],
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
            available_values: passengerData.pax_demographics.nationality.available_values || [],
            rules: passengerData.pax_demographics.nationality.rules || [],
            default: passengerData.pax_demographics.nationality.default || {},
          },
          profile: {
            available_values: passengerData.pax_demographics.profile.available_values || [],
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


      // 🔍 API 요청 시작 로그
      setApiRequestLog?.({
        timestamp: new Date().toISOString(),
        request: requestBody,
        status: 'loading',
      });

      // API 호출
      const response = await createPassengerShowUp(simulationId, requestBody);


      // 🔧 Axios response.data를 저장 (response 객체가 아님!)
      setPassengerChartResult(response.data);

      // 🔍 API 성공 로그
      setApiRequestLog?.({
        timestamp: new Date().toISOString(),
        request: requestBody,
        response: response.data,
        status: 'success',
      });

      // 저장 완료

      toast({
        title: 'Success',
        description: 'Passenger data generated successfully!',
      });

      // 🎯 API 응답을 성공적으로 받았을 때만 Step 2 완료 처리
      setStepCompleted(2, true);
    } catch (error) {

      // 🔍 API 에러 로그
      setApiRequestLog?.({
        timestamp: new Date().toISOString(),
        request: requestBody,
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
      });

      toast({
        title: 'Error',
        description: 'Failed to generate passenger data. Please try again.',
        variant: 'destructive',
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
            <div className="text-lg font-semibold text-default-900">Configure Passenger Data</div>
            <p className="text-sm font-normal text-default-500">Configure passenger profiles with properties</p>
          </div>

          {/* Generate Pax Button */}
          <Button onClick={handleGeneratePax} disabled={!canGeneratePax || isGenerating} className="ml-4">
            <Play size={16} />
            {isGenerating ? 'Generating...' : 'Generate Pax'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="nationality" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="nationality">Nationality</TabsTrigger>
            <TabsTrigger value="profile">Pax Profile</TabsTrigger>
            <TabsTrigger value="loadfactor">Load Factor</TabsTrigger>
            <TabsTrigger value="showuptime">Show-up-Time</TabsTrigger>
          </TabsList>

          <TabsContent value="nationality" className="mt-6">
            <AddColumnTab parquetMetadata={parquetMetadata} configType="nationality" />
          </TabsContent>

          <TabsContent value="profile" className="mt-6">
            <AddColumnTab parquetMetadata={parquetMetadata} configType="profile" />
          </TabsContent>

          <TabsContent value="loadfactor" className="mt-6">
            <SimpleLoadFactorTab parquetMetadata={parquetMetadata} />
          </TabsContent>

          <TabsContent value="showuptime" className="mt-6">
            <SimpleShowUpTimeTab
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
