'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { APIRequestLog, AirlineInfo, AvailableConditions, SelectedConditions } from '@/types/simulationTypes';
import { getFlightFilters, getFlightSchedules } from '@/services/simulationService';
// useTabReset 제거 - 직접 리셋 로직으로 단순화
import SimulationLoading from '../../_components/SimulationLoading';
import { useFlightScheduleData } from '../../_hooks/useTabData';
import { useFlightScheduleV2Store, useSimulationStore } from '../_stores';
import NextButton from './NextButton';
import TabFlightScheduleChart from './TabFlightScheduleChart';
import TabFlightScheduleFilterConditions from './TabFlightScheduleFilterConditions';
import TabFlightScheduleFilterConditionsNew from './TabFlightScheduleFilterConditionsNew';
import TabFlightScheduleLoadData from './TabFlightScheduleLoadData';
import TabFlightScheduleResponsePreview from './TabFlightScheduleResponsePreview';
import TabFlightScheduleResult from './TabFlightScheduleResult';

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
    actions: { setAirport, setDate, setAvailableConditions, setSelectedConditions, setChartData, setIsCompleted },
  } = useFlightScheduleData();

  // 🆕 통합 Store 액션들 (airport, date 동기화용)
  const setUnifiedAirport = useSimulationStore((s) => s.setAirport);
  const setUnifiedDate = useSimulationStore((s) => s.setDate);
  const setFlightFilters = useSimulationStore((s) => s.setFlightFilters);
  const resetFlightData = useSimulationStore((s) => s.resetFlightData);
  const setAppliedFilterResult = useSimulationStore((s) => s.setAppliedFilterResult);

  // 🆕 zustand에서 flight 데이터 존재 여부 확인
  const hasFlightData = useSimulationStore((s) => s.flight.total_flights !== null);

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

  // 🆕 airport/date는 Load 버튼 클릭 시에만 zustand에 저장
  // (실시간 동기화 제거)

  // 🆕 Apply Filter 응답 상태 관리
  const [applyFilterLoading, setApplyFilterLoading] = useState(false);
  const [applyFilterData, setApplyFilterData] = useState<any>(null);
  const [applyFilterError, setApplyFilterError] = useState<string | null>(null);
  const [showConditions, setShowConditions] = useState(false);

  // 🆕 새로운 필터 시스템용 데이터 state
  const [filtersData, setFiltersData] = useState<any>(null);

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
        values: selectedConditions.selectedAirlines.map((airline) => String(airline)),
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

  // 데이터 로드 핸들러 - GET flight-filters로 변경
  const handleLoadData = useCallback(async () => {
    if (!simulationId || !airport) return;

    // 조건 초기화
    const initialConditions = { types: [], terminal: [], selectedAirlines: [] };
    setLocalSelectedConditions(initialConditions);
    setSelectedConditions(initialConditions as any);
    setShowConditions(false);

    // ✅ Apply Filter 결과 초기화 (기존 차트들 제거)
    setApplyFilterData(null);
    setApplyFilterError(null);
    setChartData(null); // 기존 차트 데이터도 초기화

    try {
      console.log('🔄 Setting loading state to TRUE');
      setLoadingFlightSchedule(true);
      setLoadError(false);

      // 🆕 기존 flight 데이터 완전 초기화 (Filter Conditions가 로딩 상태로 전환됨)
      resetFlightData();
      console.log('🗑️ Previous flight data cleared');

      // 🆕 Load 버튼 클릭 시 airport/date를 zustand에 저장
      setUnifiedAirport(airport);
      setUnifiedDate(date);
      console.log('📍 Airport/Date saved to unified store:', { airport, date });

      // ✅ Load 버튼 API 요청 로그 저장 (시작)
      const timestamp = new Date().toISOString();

      setApiRequestLog({
        timestamp,
        request: {
          method: 'GET',
          endpoint: `/api/v1/simulations/${simulationId}/flight-filters`,
          params: { airport, date },
        },
        response: null,
        status: 'loading',
      });

      // 🆕 GET flight-filters 호출 (URL 파라미터 방식)
      const { data } = await getFlightFilters(simulationId, airport, date);

      console.log('🆕 Flight filters data received:', data);

      // ✅ Load 버튼 API 요청 로그 저장 (성공)
      setApiRequestLog({
        timestamp,
        request: {
          method: 'GET',
          endpoint: `/api/v1/simulations/${simulationId}/flight-filters`,
          params: { airport, date },
        },
        response: data,
        status: 'success',
      });

      // 🆕 새로운 필터 데이터 구조 처리
      if (data && data.filters) {
        setFiltersData(data); // 🆕 필터 데이터 저장

        // 🆕 통합 Store에도 저장
        setFlightFilters({
          total_flights: data.total_flights,
          airlines: data.airlines,
          filters: data.filters,
        });
        console.log('🆕 Flight filters saved to unified store:', {
          total_flights: data.total_flights,
          airlines: Object.keys(data.airlines || {}).length,
          filters: Object.keys(data.filters || {}).length,
        });

        setShowConditions(true);

        // 필터 메타데이터가 로드되었음을 표시
        setIsCompleted(true);

        console.log('✅ Flight filters loaded successfully');
      }
    } catch (error: any) {
      console.error('❌ Failed to load flight filters:', error);

      // 🎯 503 에러에 대한 사용자 친화적 메시지
      let errorMessage = 'Failed to load flight data';

      if (error?.response?.status === 503) {
        errorMessage = 'Server is temporarily overloaded. Please try again in a moment.';
      } else if (error?.response?.status === 504 || error?.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. Please check your connection and try again.';
      }

      console.error('Error details:', errorMessage);
      setLoadError(true);

      // ✅ Load 버튼 API 요청 로그 저장 (에러)
      setApiRequestLog({
        timestamp,
        request: {
          method: 'GET',
          endpoint: `/api/v1/simulations/${simulationId}/flight-filters`,
          params: { airport, date },
        },
        response: null,
        status: 'error',
        error: errorMessage,
      });
    } finally {
      console.log('🔄 Setting loading state to FALSE');
      setLoadingFlightSchedule(false);
    }
  }, [simulationId, airport, date, setSelectedConditions, setShowConditions, setIsCompleted, setApiRequestLog]);

  // 🆕 새로운 Apply Filter 핸들러 (새 필터 시스템용) - 응답 반환
  const handleApplyFiltersNew = useCallback(
    async (type: string, conditions: Array<{ field: string; values: string[] }>) => {
      if (!simulationId || !airport) return null;

      const params = {
        airport,
        date,
        type, // 🆕 1단계에서 선택한 mode 값
        conditions, // 🆕 새로운 조건 형식
      };

      try {
        // ✅ Apply Filter 전용 로딩 상태 사용 (Filter Conditions는 변화 없음)
        setApplyFilterLoading(true);
        setApplyFilterError(null);
        setApplyFilterData(null);

        setApiRequestLog({
          timestamp: new Date().toISOString(),
          request: params,
          response: null,
          status: 'loading',
        });

        // 🆕 기존 POST flight-schedules 호출 (필터링된 실제 데이터)
        const { data } = await getFlightSchedules(simulationId, params);

        setApiRequestLog({
          timestamp: new Date().toISOString(),
          request: params,
          response: data,
          status: 'success',
        });

        // 🆕 차트 데이터 처리는 일단 제거 (응답 확인이 우선)
        // if (data?.chart_x_data && data?.chart_y_data) { ... }

        // ✅ Apply Filter 응답 상태에 저장
        setApplyFilterData(data);

        // 🆕 Apply Filter 요청/응답을 zustand에 저장
        setAppliedFilterResult({
          requestBody: params,
          responseData: data,
        });
        console.log('💾 Apply Filter result saved to zustand:', { requestBody: params, responseData: data });

        return data;
      } catch (error: any) {
        console.error('❌ Apply filter failed:', error);

        // 🎯 503 에러에 대한 사용자 친화적 메시지
        let errorMessage = 'Unknown error';

        if (error?.response?.status === 503) {
          errorMessage =
            'Server is temporarily overloaded. The request contains too much data to process. Try applying more specific filters or try again in a moment.';
        } else if (error?.response?.status === 504) {
          errorMessage = 'Request timed out. Please try with more specific filter conditions.';
        } else if (error?.code === 'ECONNABORTED') {
          errorMessage = 'Request timed out. Please try with more specific filter conditions.';
        } else if (error?.response?.data?.detail) {
          errorMessage = error.response.data.detail;
        } else if (error?.message) {
          errorMessage = error.message;
        }

        // ✅ Apply Filter 에러 상태에 저장
        setApplyFilterError(errorMessage);

        setApiRequestLog({
          timestamp: new Date().toISOString(),
          request: params,
          response: null,
          status: 'error',
          error: errorMessage,
        });

        throw error;
      } finally {
        // ✅ Apply Filter 전용 로딩 완료
        setApplyFilterLoading(false);
      }
    },
    [simulationId, airport, date, setApiRequestLog]
  );

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

      {/* 🆕 새로운 Condition Filter Section - zustand 데이터 존재할 때만 표시 */}
      {hasFlightData && !loadingFlightSchedule && (
        <TabFlightScheduleFilterConditionsNew loading={false} onApplyFilter={handleApplyFiltersNew} />
      )}

      {/* ✨ 공통 로딩 상태 기반 조건부 렌더링 */}
      {loadingFlightSchedule || applyFilterLoading ? (
        <div className="mt-6">
          <SimulationLoading minHeight="min-h-[400px]" size={70} />
        </div>
      ) : (
        <>
          {/* Apply Filter 결과 표시 - 성공 시 차트, 에러 시 에러 메시지 */}
          {(applyFilterData || applyFilterError) && !applyFilterLoading && (
            <div className="mt-6">
              {applyFilterData && applyFilterData.chart_x_data ? (
                <TabFlightScheduleResult data={applyFilterData} />
              ) : (
                <TabFlightScheduleResponsePreview loading={false} data={applyFilterData} error={applyFilterError} />
              )}
            </div>
          )}

          {/* 기존 Chart 데이터 표시 */}
          {chartData && !loadingFlightSchedule && (
            <TabFlightScheduleChart loadingFlightSchedule={false} chartData={chartData} loadError={loadError} />
          )}

          {/* 로드 에러 상태 표시 */}
          {loadError && !loadingFlightSchedule && !applyFilterLoading && (
            <TabFlightScheduleChart loadingFlightSchedule={false} chartData={null} loadError={true} />
          )}
        </>
      )}

      {/* Navigation */}
      <div className="mt-8">
        <NextButton showPrevious={true} />
      </div>
    </div>
  );
}

// React.memo로 컴포넌트 최적화 (props가 동일하면 리렌더링 방지)
export default React.memo(TabFlightSchedule);
