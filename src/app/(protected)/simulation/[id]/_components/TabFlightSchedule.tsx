'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { APIRequestLog, AirlineInfo, AvailableConditions, SelectedConditions } from '@/types/simulationTypes';
import { getFlightSchedules } from '@/services/simulationService';
import { useFlightScheduleData } from '../../_hooks/useTabData';
import { useSimulationUIStore } from '../_stores';
// useTabReset 제거 - 직접 리셋 로직으로 단순화
import NextButton from './NextButton';
import TabFlightScheduleChart from './TabFlightScheduleChart';
import TabFlightScheduleFilterConditions from './TabFlightScheduleFilterConditions';
import TabFlightScheduleLoadData from './TabFlightScheduleLoadData';

interface TabFlightScheduleProps {
  simulationId: string;
  visible: boolean;
  apiRequestLog: APIRequestLog | null;
  setApiRequestLog: (log: APIRequestLog | null) => void;
}

function TabFlightSchedule({ simulationId, visible, apiRequestLog, setApiRequestLog }: TabFlightScheduleProps) {
  // 표준화된 훅으로 데이터와 액션들 가져오기
  const {
    airport,
    date,
    availableConditions,
    selectedConditions: zustandSelectedConditions,
    chartData,
    actions: {
      setAirport,
      setDate,
      setAvailableConditions,
      setSelectedConditions,
      setChartData,
      setIsCompleted,
    },
  } = useFlightScheduleData();

  // UI Store에서 분산 저장을 위한 액션들
  const setPassengerScheduleUI = useSimulationUIStore((state) => state.setPassengerScheduleUI);

  // Tab Reset 시스템 제거 - 단순화

  // 로컬 상태로 selectedConditions 관리 (Apply Filter 버튼 누를 때까지 zustand에 저장하지 않음)
  const [selectedConditions, setLocalSelectedConditions] = useState<SelectedConditions>({
    types: [],
    terminal: [],
    selectedAirlines: [],
  });

  // UI 상태 관리 (최소화)
  const [loadError, setLoadError] = useState(false);
  const [loadingFlightSchedule, setLoadingFlightSchedule] = useState(false);
  const [isSomethingChanged, setIsSomethingChanged] = useState(false);
  const [showConditions, setShowConditions] = useState(false);

  // 터미널 표시 형태를 raw 값으로 변환하는 함수 (API 요청용)
  const getTerminalRawValue = useCallback((displayName: string) => {
    if (displayName === 'Unknown') {
      return 'unknown';
    }
    // "Terminal 1" → "1"
    const match = displayName.match(/Terminal\s+(.+)/);
    return match ? match[1] : displayName;
  }, []);

  // 선택된 조건들을 API 형태로 변환 (Terminal 조건은 제외)
  const buildConditions = useCallback(() => {
    const conditions: Array<{ field: string; values: string[] }> = [];

    if (selectedConditions.types.length > 0) {
      conditions.push({
        field: 'types',
        values: selectedConditions.types,
      });
    }

    if (selectedConditions.selectedAirlines.length > 0) {
      conditions.push({
        field: 'airline',
        values: selectedConditions.selectedAirlines.map((airline) => airline.iata),
      });
    }

    return conditions;
  }, [selectedConditions]);

  // API에서 데이터를 불러온다.
  // isAirportOrDateChanged: true면 새로운 공항/날짜로 로드(빈 조건), false면 기존 데이터에 필터만 적용
  const loadFlightSchedule = useCallback(
    async (isAirportOrDateChanged: boolean = false) => {
      if (!simulationId) return;
      if (!airport) return;

      setChartData(null);
      setLoadError(false);

      // API 요청 파라미터와 타임스탬프를 미리 준비 (스코프 밖에서 정의)
      const params = {
        airport,
        date,
        conditions: isAirportOrDateChanged ? [] : buildConditions(), // 공항/날짜 변경시에는 빈 조건, 필터 적용시에만 조건 포함
      };
      const timestamp = new Date().toISOString();

      try {
        setLoadingFlightSchedule(true);
        setApiRequestLog({
          timestamp,
          request: params,
          response: null,
          status: 'loading',
        });

        const { data } = await getFlightSchedules(simulationId, params);

        // API 응답 로그 업데이트 (timestamp 기준으로 새 객체 생성)
        setApiRequestLog({
          timestamp,
          request: params,
          response: data,
          status: 'success',
        });

        // Available conditions 추출 - 실제 API 응답 구조에 맞춤

        // API 응답이 배열인지 객체인지 확인하고 처리
        const allAirlines: Array<AirlineInfo> = [];
        let typesData: { International: AirlineInfo[]; Domestic: AirlineInfo[] } = { International: [], Domestic: [] };
        let terminalsData: { [terminalName: string]: AirlineInfo[] } = {};

        // Case 1: 응답이 직접 항공사 배열인 경우
        if (Array.isArray(data)) {
          data.forEach((airline: AirlineInfo) => {
            if (airline && airline.iata && airline.name) {
              allAirlines.push({ iata: airline.iata, name: airline.name });
            }
          });
        }
        // Case 2: 기존 구조 (types, terminals 등이 있는 경우)
        else if (data && typeof data === 'object') {
          typesData = (data as { types?: { International: AirlineInfo[]; Domestic: AirlineInfo[] } })?.types || {
            International: [],
            Domestic: [],
          };
          terminalsData = (data as { terminals?: { [terminalName: string]: AirlineInfo[] } })?.terminals || {};

          // Types에서 항공사 정보 추출
          const typesAirlines = [...Array.from(typesData.International || []), ...Array.from(typesData.Domestic || [])];

          typesAirlines.forEach((airline: AirlineInfo) => {
            if (
              airline &&
              airline.iata &&
              airline.name &&
              !allAirlines.find((a) => a.iata === airline.iata && a.name === airline.name)
            ) {
              allAirlines.push({ ...airline });
            }
          });

          // Terminals에서 항공사 정보 추출
          Object.values(terminalsData).forEach((terminalAirlines: AirlineInfo[]) => {
            Array.from(terminalAirlines || []).forEach((airline: AirlineInfo) => {
              if (
                airline &&
                airline.iata &&
                airline.name &&
                !allAirlines.find((a) => a.iata === airline.iata && a.name === airline.name)
              ) {
                allAirlines.push({ ...airline });
              }
            });
          });
        }

        // 항공사 리스트 정렬 (IATA 코드 기준) - null 값 안전 처리
        allAirlines.sort((a, b) => {
          const aIata = a.iata || '';
          const bIata = b.iata || '';
          return aIata.localeCompare(bIata);
        });

        // 터미널 리스트 생성 (unknown 제외하고 정렬)
        const availableTerminals = Object.keys(terminalsData)
          .filter((terminal) => terminal !== 'unknown')
          .sort((a, b) => {
            // raw 값("1", "2")을 숫자로 정렬
            const aNum = parseInt(a);
            const bNum = parseInt(b);
            if (!isNaN(aNum) && !isNaN(bNum)) {
              return aNum - bNum;
            }
            return a.localeCompare(b);
          });

        // 공항/날짜 변경일 때만 조건 설정 및 UI 표시
        if (isAirportOrDateChanged) {
          setAvailableConditions({
            types: {
              International: Array.from(typesData.International || []).map((airline: AirlineInfo) => ({ ...airline })),
              Domestic: Array.from(typesData.Domestic || []).map((airline: AirlineInfo) => ({ ...airline })),
            },
            terminals: Object.fromEntries(
              Object.entries(terminalsData).map(([key, airlines]: [string, AirlineInfo[]]) => [
                key,
                Array.from(airlines || []).map((airline: AirlineInfo) => ({ ...airline })),
              ])
            ),
            airlines: allAirlines.map((airline: AirlineInfo) => ({ ...airline })),
          });

          // zustand에도 동일한 데이터 저장
          setAvailableConditions({
            types: {
              International: Array.from(typesData.International || []).map((airline: AirlineInfo) => ({ ...airline })),
              Domestic: Array.from(typesData.Domestic || []).map((airline: AirlineInfo) => ({ ...airline })),
            },
            terminals: Object.fromEntries(
              Object.entries(terminalsData).map(([key, airlines]: [string, AirlineInfo[]]) => [
                key,
                Array.from(airlines || []).map((airline: AirlineInfo) => ({ ...airline })),
              ])
            ),
            airlines: allAirlines.map((airline: AirlineInfo) => ({ ...airline })),
          });

          // 초기 selectedConditions 설정 - 로컬 상태에만 설정
          setLocalSelectedConditions({
            types: [],
            terminal: [],
            selectedAirlines: [],
          });

          // 차트 데이터가 있으면 조건 UI도 표시
          const hasTypes = typesData.International.length > 0 || typesData.Domestic.length > 0;
          const hasTerminals = availableTerminals.length > 0;
          const hasAirlines = allAirlines.length > 0;

          if (hasTypes || hasTerminals || hasAirlines) {
            setShowConditions(true);
          }
        }

        if (data?.chart_x_data && data?.chart_y_data) {
          // 차트 데이터를 안전하게 복사하고 처리
          const chartYDataCopy = JSON.parse(JSON.stringify(data.chart_y_data));

          for (const criteriaCur in chartYDataCopy) {
            const criteriaDataCur = chartYDataCopy[criteriaCur].sort((a, b) => a.order - b.order);
            const acc_y = Array(criteriaDataCur[0]?.y?.length || 0).fill(0);

            for (const itemCur of criteriaDataCur) {
              itemCur.acc_y = Array(itemCur.y?.length || 0).fill(0);

              for (let i = 0; i < (itemCur.y?.length || 0); i++) {
                acc_y[i] += itemCur.y[i] || 0;
                itemCur.acc_y[i] = Number(acc_y[i]);
              }
            }
          }

          const newChartData = {
            total: data?.total,
            x: Array.from(data?.chart_x_data || []),
            data: chartYDataCopy,
          };
          setChartData(newChartData); // zustand에 전체 chartData 저장

          // Parquet 메타데이터 분산 저장 (Passenger Schedule UI에서 사용)
          if (data?.parquet_metadata) {
            setPassengerScheduleUI({ parquetMetadata: data.parquet_metadata });
          }

          // Flight Schedule 탭 완료 상태 설정
          setIsCompleted(true);
        }
      } catch (error) {
        // API 에러 로그 업데이트 (timestamp와 request 정보 유지)
        setApiRequestLog({
          timestamp,
          request: params,
          response: null,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        setLoadError(true);
      } finally {
        setIsSomethingChanged(false);
        setLoadingFlightSchedule(false);
      }
    },
    [
      simulationId,
      airport,
      date,
      buildConditions,
      setApiRequestLog,
      setAvailableConditions,
      setChartData,
      setShowConditions,
      setIsCompleted,
    ]
  );

  // 차트 데이터 로드 시 자동으로 조건 UI 표시
  useEffect(() => {
    if (chartData && Object.keys(chartData).length > 0) {
      const hasTypes =
        availableConditions.types.International.length > 0 || availableConditions.types.Domestic.length > 0;
      const hasTerminals = Object.keys(availableConditions.terminals).length > 0;
      const hasAirlines = availableConditions.airlines.length > 0;

      if (hasTypes || hasTerminals || hasAirlines) {
        setShowConditions(true);
      }
    }
  }, [chartData, availableConditions]);

  // 데이터 로드 핸들러 (단순화)
  const handleLoadData = useCallback(() => {
    // 조건 초기화 (로컬 상태와 zustand 모두)
    const initialConditions = { types: [], terminal: [], selectedAirlines: [] };
    setLocalSelectedConditions(initialConditions);
    setSelectedConditions(initialConditions as any); // 타입 캐스팅 (availableAirlines는 계산으로 처리)
    setShowConditions(false);
    // 바로 데이터 로드 (confirm 팝업 제거) - 공항/날짜가 바뀌었으므로 빈 조건으로 요청
    return loadFlightSchedule(true);
  }, [setShowConditions, loadFlightSchedule, setSelectedConditions]);

  // 필터 적용 핸들러 - 여기서 zustand에 selectedConditions 저장 (단순화)
  const handleApplyFilters = useCallback(() => {
    // Apply Filter 버튼을 누를 때만 zustand에 selectedConditions 저장
    setSelectedConditions(selectedConditions as any); // 타입 캐스팅 (availableAirlines는 계산으로 처리)
    return loadFlightSchedule(false); // 필터만 적용하므로 기존 조건 사용
  }, [loadFlightSchedule, selectedConditions, setSelectedConditions]);

  return !visible ? null : (
    <div className="space-y-6 pt-8">
      {/* Load Flight Schedule Data Section */}
      <TabFlightScheduleLoadData
        airport={airport}
        date={date}
        loadingFlightSchedule={loadingFlightSchedule}
        setAirport={setAirport}
        setDate={setDate}
        setIsSomethingChanged={setIsSomethingChanged}
        onLoadData={handleLoadData}
      />

      {/* Condition Filter Section */}
      <TabFlightScheduleFilterConditions
        showConditions={showConditions}
        chartData={chartData}
        selectedConditions={selectedConditions}
        availableConditions={availableConditions}
        loadingFlightSchedule={loadingFlightSchedule}
        setSelectedConditions={setLocalSelectedConditions}
        onApplyFilters={handleApplyFilters}
      />

      {/* Chart & Results Section */}
      <TabFlightScheduleChart
        loadingFlightSchedule={loadingFlightSchedule}
        chartData={chartData}
        loadError={loadError}
      />

      {/* Navigation */}
      <div className="mt-8">
        <NextButton showPrevious={true} />
      </div>
    </div>
  );
}

// React.memo로 컴포넌트 최적화 (props가 동일하면 리렌더링 방지)
export default React.memo(TabFlightSchedule);
