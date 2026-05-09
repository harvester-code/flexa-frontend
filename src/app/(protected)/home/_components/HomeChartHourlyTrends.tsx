import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { ChevronDown, ChevronRight, Circle, Check } from 'lucide-react';
import { Option } from '@/types/homeTypes';
import { ScenarioData } from '@/types/homeTypes';
import { Checkbox } from '@/components/ui/Checkbox';
import ToggleButtonGroup from '@/components/ui/ToggleButtonGroup';
import { cn } from '@/lib/utils';
import { capitalizeFirst } from './HomeFormat';
import HomeChartGuard from './HomeChartGuard';
import HomeChartSection from './HomeChartSection';
import HomeFacilityHeatmap from './HomeFacilityHeatmap';

const LineChart = dynamic(() => import('@/components/charts/LineChart'), { ssr: false });

function filterDayTimes(rawTimes: unknown): string[] {
  const allTimes: string[] = Array.isArray(rawTimes) ? rawTimes : [];
  return allTimes.filter((timeStr, idx) => {
    if (idx === 0) return true;
    const currentTime = new Date(timeStr);
    const prevTime = new Date(allTimes[idx - 1]);
    if (currentTime.getHours() < prevTime.getHours()) {
      return currentTime.getHours() === 0 && currentTime.getMinutes() === 0;
    }
    return true;
  });
}

const CHART_OPTION_COLORS: Record<string, string> = {
  inflow: '#06b6d4',     // cyan-500
  outflow: '#10b981',    // emerald-500
  queue_length: '#f59e0b', // amber-500
  waiting_time: '#f43f5e', // rose-500
};

const CHART_OPTIONS: Option[] = [
  { label: 'Inflow', value: 'inflow', color: CHART_OPTION_COLORS.inflow },
  { label: 'Outflow', value: 'outflow', color: CHART_OPTION_COLORS.outflow },
  { label: 'Queue Pax', value: 'queue_length', color: CHART_OPTION_COLORS.queue_length },
  { label: 'Wait Time', value: 'waiting_time', color: CHART_OPTION_COLORS.waiting_time },
];

const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const sanitizeNumericSeries = (series: unknown, expectedLength: number): number[] | undefined => {
  if (!Array.isArray(series) || expectedLength <= 0) return undefined;

  const sanitized = (series as unknown[]).map((value) => {
    const numeric = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
  });

  if (sanitized.length === expectedLength) {
    return sanitized;
  }

  if (sanitized.length < expectedLength) {
    return [...sanitized, ...Array(expectedLength - sanitized.length).fill(0)];
  }

  return sanitized.slice(0, expectedLength);
};

interface HomeChartHourlyTrendsProps {
  scenario: ScenarioData | null;
  data?: any; // 배치 API에서 받은 flow_chart 데이터
  isLoading?: boolean; // 배치 API 로딩 상태
}

function HomeChartHourlyTrends({ scenario, data, isLoading: propIsLoading }: HomeChartHourlyTrendsProps) {
  // 부모 컴포넌트에서 데이터를 받아서 사용 (개별 API 호출 제거)
  const hourlyTrendsData = data;
  const isFlowChartLoading = propIsLoading || false;
  const [lineChartData, setLineChartData] = useState<Plotly.Data[]>([]);
  const [chartLayout, setChartLayout] = useState<Partial<Plotly.Layout>>({
    margin: { l: 60, r: 60, b: 60, t: 24 },
    showlegend: false,
  });

  const convertSecondsToMinutesInt = (data: Plotly.Data): Plotly.Data => ({
    ...data,
    y: Array.isArray((data as any).y)
      ? (data as any).y.map((v: any) => {
          const num = Number(v);
          return isNaN(num) ? null : Math.floor(num / 60);
        })
      : (data as any).y,
  });
  const getYAxisTitle = (optionValue: string) => (optionValue === 'waiting_time' ? '(min)' : '(pax)');

  const FACILITY_OPTIONS = useMemo(() => {
    if (!hourlyTrendsData) return [];
    return Object.keys(hourlyTrendsData)
      .filter((key) => key !== 'times')
      .map((key) => {
        const facilityData = hourlyTrendsData[key];
        const dataSource = facilityData?.data || facilityData;
        const facilities = facilityData?.facilities || [];

        // 총 처리 인원 계산 (facilities 리스트에 있는 시설들의 inflow만 합산)
        let totalThroughput = 0;
        if (dataSource && facilities.length > 0) {
          facilities.forEach((facilityName: string) => {
            if (facilityName === 'Skip') return; // Skip 제외
            const facilityZoneData = dataSource[facilityName];
            if (facilityZoneData?.inflow && Array.isArray(facilityZoneData.inflow)) {
              totalThroughput += facilityZoneData.inflow.reduce((sum: number, val: number) => sum + (val || 0), 0);
            }
          });
        }

        return {
          label: capitalizeFirst(key.replace('_', ' ')),
          value: key,
          throughput: totalThroughput,
        };
      });
  }, [hourlyTrendsData]);

  const [selectedFacilityValue, setSelectedFacilityValue] = useState('');
  useEffect(() => {
    if (FACILITY_OPTIONS.length > 0) {
      // selectedFacilityValue가 비어있거나 현재 옵션에 없으면 첫 번째 옵션 선택
      const isValidSelection = selectedFacilityValue && FACILITY_OPTIONS.some(opt => opt.value === selectedFacilityValue);
      if (!isValidSelection) {
        setSelectedFacilityValue(FACILITY_OPTIONS[0].value);
      }
    } else {
      // 데이터가 없으면 선택값 초기화
      setSelectedFacilityValue('');
    }
  }, [FACILITY_OPTIONS]);

  const ZONE_OPTIONS = useMemo(() => {
    if (!hourlyTrendsData || !selectedFacilityValue) return [];
    const facilityData = hourlyTrendsData[selectedFacilityValue];
    if (!facilityData) return [];

    // 새로운 구조 처리 - data 속성이 있으면 그 안의 키를 사용
    const dataSource = facilityData.data || facilityData;

    return Object.keys(dataSource)
      .filter(key => key !== 'process_name' && key !== 'facilities') // 메타 정보 제외
      .map((key) => ({
        label: key === 'all_zones' ? 'All Zones' : capitalizeFirst(key),
        value: key,
      }));
  }, [hourlyTrendsData, selectedFacilityValue]);

  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [isZonePanelOpen, setIsZonePanelOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isAirlinePanelOpen, setIsAirlinePanelOpen] = useState(false);
  const airlineDropdownRef = useRef<HTMLDivElement>(null);

  // 단일 source of truth: 편명 선택 (항공사 상태는 파생)
  // 'all' = 전체선택, [] = 전체해제, [...] = 개별 편명 선택
  const [selectedFlights, setSelectedFlights] = useState<string[]>(['all']);
  const [hoveredAirline, setHoveredAirline] = useState<string | null>(null);

  // 항공사 목록 추출 ('all' 항목 없이 개별 코드만)
  const AIRLINE_OPTIONS = useMemo(() => {
    if (!hourlyTrendsData || !selectedFacilityValue) return [];

    const facilityData = hourlyTrendsData[selectedFacilityValue];
    const dataSource = facilityData?.data || facilityData;
    if (!dataSource) return [];

    const airlineNames = facilityData?.airline_names || {};

    const airlinesSet = new Set<string>();
    Object.values(dataSource).forEach((zoneData: any) => {
      if (zoneData.airlines) {
        Object.keys(zoneData.airlines).forEach((code: string) => airlinesSet.add(code));
      }
    });

    return Array.from(airlinesSet).sort().map(code => ({
      label: airlineNames[code] ? `${code} | ${airlineNames[code]}` : code,
      value: code,
    }));
  }, [hourlyTrendsData, selectedFacilityValue]);

  // 항공사별 편명 목록 (드롭다운 서브패널용 — 선택 여부 무관하게 전체 수집)
  const flightsByAirline = useMemo(() => {
    if (!hourlyTrendsData || !selectedFacilityValue) return {};

    const facilityData = hourlyTrendsData[selectedFacilityValue];
    const dataSource = facilityData?.data || facilityData;
    const flightAirlineMap: Record<string, string> = facilityData?.flight_airline_map || {};

    if (!dataSource || Object.keys(flightAirlineMap).length === 0) return {};

    const zonesToCheck = selectedZones.includes('all_zones')
      ? Object.keys(dataSource).filter((k) => k !== 'all_zones')
      : selectedZones;

    const byAirline: Record<string, Set<string>> = {};
    zonesToCheck.forEach((zoneKey) => {
      const zoneData = dataSource[zoneKey];
      if (zoneData?.flights) {
        Object.keys(zoneData.flights).forEach((flightNum) => {
          const airline = flightAirlineMap[flightNum];
          if (airline) {
            if (!byAirline[airline]) byAirline[airline] = new Set();
            byAirline[airline].add(flightNum);
          }
        });
      }
    });

    const result: Record<string, string[]> = {};
    Object.entries(byAirline).forEach(([airline, set]) => {
      result[airline] = Array.from(set).sort();
    });
    return result;
  }, [hourlyTrendsData, selectedFacilityValue, selectedZones]);

  useEffect(() => {
    if (ZONE_OPTIONS.length > 0) {
      // 항상 All Zones를 첫 선택으로 설정
      const allZonesOption = ZONE_OPTIONS.find(opt => opt.value === 'all_zones');
      if (allZonesOption) {
        setSelectedZones(['all_zones']);
      } else {
        // all_zones가 없으면 첫 번째 옵션 선택
        setSelectedZones([ZONE_OPTIONS[0].value]);
      }
    }
  }, [ZONE_OPTIONS]);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsZonePanelOpen(false);
      }
      if (airlineDropdownRef.current && !airlineDropdownRef.current.contains(event.target as Node)) {
        setIsAirlinePanelOpen(false);
        setHoveredAirline(null);
      }
    };

    if (isZonePanelOpen || isAirlinePanelOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isZonePanelOpen, isAirlinePanelOpen]);

  const [chartOption1, setChartOption1] = useState([0]);
  const handleChartOption1 = (buttonIndex: number) => {
    setChartOption1((prevData) => {
      if (prevData.includes(buttonIndex)) {
        if (prevData.length === 1) {
          return prevData;
        }
        return prevData.filter((v) => v !== buttonIndex);
      }
      if (prevData.length >= 2) {
        return [...prevData.slice(1), buttonIndex];
      }
      return [...prevData, buttonIndex];
    });
  };

  const toggleZone = (zoneValue: string) => {
    setSelectedZones((prev) => {
      // all_zones 선택 시 모든 개별 zone 해제
      if (zoneValue === 'all_zones') {
        return ['all_zones'];
      }

      // 개별 zone 선택 시 all_zones 해제하고 토글
      const withoutAllZones = prev.filter(z => z !== 'all_zones');
      if (withoutAllZones.includes(zoneValue)) {
        // 최소 1개는 선택되어야 함
        const newSelection = withoutAllZones.filter(z => z !== zoneValue);
        return newSelection.length > 0 ? newSelection : ['all_zones'];
      } else {
        return [...withoutAllZones, zoneValue];
      }
    });
  };

  // 모든 편명 목록 (flightsByAirline에서 flat)
  const allFlightsList = useMemo(
    () => Object.values(flightsByAirline).flat(),
    [flightsByAirline]
  );

  // flight 데이터가 아예 없는 시나리오 여부 (구버전 시나리오)
  // → 이 경우 항공사 코드 자체가 최하위 leaf로 selectedFlights에 담긴다
  const noFlightData = allFlightsList.length === 0;

  // 편명 기준으로 항공사 체크 상태 파생
  const getAirlineCheckState = useCallback(
    (airlineCode: string): boolean | 'indeterminate' => {
      if (selectedFlights.includes('all')) return true;
      const flights = flightsByAirline[airlineCode] ?? [];
      if (flights.length === 0) {
        // 편명 없음 → 항공사 코드 자체가 leaf
        return selectedFlights.includes(airlineCode);
      }
      const selectedCount = flights.filter(f => selectedFlights.includes(f)).length;
      if (selectedCount === 0) return false;
      if (selectedCount === flights.length) return true;
      return 'indeterminate';
    },
    [flightsByAirline, selectedFlights]
  );

  // 항공사 클릭 → 편명 있으면 cascade, 없으면 airline code 직접 토글
  const toggleAirline = (airlineCode: string) => {
    const airlineFlights = flightsByAirline[airlineCode] ?? [];

    setSelectedFlights((prev) => {
      if (airlineFlights.length === 0) {
        // 편명 없는 시나리오: airline code를 leaf로 직접 토글
        if (prev.includes('all')) {
          const allCodes = AIRLINE_OPTIONS.map(a => a.value);
          return allCodes.filter(c => c !== airlineCode);
        }
        if (prev.includes(airlineCode)) {
          return prev.filter(c => c !== airlineCode);
        }
        const next = [...prev, airlineCode];
        if (AIRLINE_OPTIONS.every(a => next.includes(a.value))) return ['all'];
        return next;
      }

      // 편명 있는 시나리오: cascade to flights
      const expanded = prev.includes('all') ? allFlightsList : prev;
      const airlineState = getAirlineCheckState(airlineCode);

      let next: string[];
      if (airlineState === true) {
        next = expanded.filter(f => !airlineFlights.includes(f));
      } else {
        next = [...new Set([...expanded, ...airlineFlights])];
      }

      if (allFlightsList.every(f => next.includes(f))) return ['all'];
      return next;
    });
  };

  // 헤더 체크박스: 전체 켜기/끄기
  const toggleAllFlights = () => {
    setSelectedFlights(prev => (prev.includes('all') ? [] : ['all']));
  };

  // 개별 편명 toggle
  const toggleFlight = (flightNum: string) => {
    setSelectedFlights((prev) => {
      const expanded = prev.includes('all') ? allFlightsList : prev;
      const next = expanded.includes(flightNum)
        ? expanded.filter(f => f !== flightNum)
        : [...expanded, flightNum];

      if (allFlightsList.length > 0 && allFlightsList.every(f => next.includes(f))) {
        return ['all'];
      }
      return next;
    });
  };

  useEffect(() => {
    if (!hourlyTrendsData || !selectedFacilityValue || selectedZones.length === 0) {
      // 데이터가 없으면 이전 상태 초기화
      setLineChartData([]);
      setChartLayout({
        margin: { l: 60, r: 60, b: 60, t: 24 },
        showlegend: false,
      });
      return;
    }

    const times = filterDayTimes(hourlyTrendsData.times);

    const facilityData = hourlyTrendsData[selectedFacilityValue];
    const dataSource = facilityData?.data || facilityData;

    if (!dataSource || !times.length) {
      setLineChartData([]);
      return;
    }

    // 선택된 zone들의 데이터 수집
    const zonesToAggregate = selectedZones.includes('all_zones')
      ? Object.keys(dataSource).filter(key => key !== 'all_zones')
      : selectedZones;

    // 데이터 합산을 위한 초기 객체
    const aggregatedData: Record<string, number[]> = {
      inflow: new Array(times.length).fill(0),
      outflow: new Array(times.length).fill(0),
      queue_length: new Array(times.length).fill(0),
      waiting_time: new Array(times.length).fill(0),
      capacity: new Array(times.length).fill(0),
    };

    let validZoneCount = 0;

    // 각 zone의 데이터를 합산
    zonesToAggregate.forEach((zoneKey) => {
      const zoneData = dataSource[zoneKey];
      if (!zoneData) return;

      // 항공사·편명 필터링이 적용된 경우 (flight → airline → all 순으로 우선 적용)
      let dataToUse: any = {};

      const isFiltered = !selectedFlights.includes('all') && selectedFlights.length > 0;

      // 편명 있는 시나리오: selectedFlights = 편명 코드들
      // 편명 없는 시나리오: selectedFlights = 항공사 코드들 (leaf가 항공사)
      const aggregateByKeys = (
        dataMap: Record<string, any>,
        keys: string[],
        tLen: number
      ) => {
        const result: any = {};
        ['inflow', 'outflow', 'queue_length'].forEach(m => { result[m] = new Array(tLen).fill(0); });
        const wtSum = new Array(tLen).fill(0);
        const wtW = new Array(tLen).fill(0);

        keys.forEach(key => {
          const d = dataMap[key];
          if (!d) return;
          ['inflow', 'outflow', 'queue_length'].forEach(m => {
            if (d[m]) d[m].slice(0, tLen).forEach((v: number, i: number) => { result[m][i] += v; });
          });
          if (d.waiting_time && d.inflow) {
            d.waiting_time.slice(0, tLen).forEach((wt: number, i: number) => {
              const w = d.inflow[i] || 0;
              wtSum[i] += wt * w;
              wtW[i] += w;
            });
          }
        });
        result.waiting_time = wtSum.map((s, i) => wtW[i] > 0 ? s / wtW[i] : 0);
        return result;
      };

      if (selectedFlights.length === 0) {
        // ── 전체 해제 → 빈 데이터 ──
        dataToUse = {
          inflow: new Array(times.length).fill(0),
          outflow: new Array(times.length).fill(0),
          capacity: new Array(times.length).fill(0),
          queue_length: new Array(times.length).fill(0),
          waiting_time: new Array(times.length).fill(0),
        };
      } else if (isFiltered && !noFlightData && zoneData.flights) {
        // ── 편명 필터 (신규 시나리오) ──
        const merged = aggregateByKeys(zoneData.flights, selectedFlights, times.length);
        dataToUse = { ...merged, capacity: zoneData.capacity ? zoneData.capacity.slice(0, times.length) : [] };
      } else if (isFiltered && noFlightData && zoneData.airlines) {
        // ── 항공사 필터 (구버전 시나리오: selectedFlights = airline codes) ──
        const merged = aggregateByKeys(zoneData.airlines, selectedFlights, times.length);
        dataToUse = { ...merged, capacity: zoneData.capacity ? zoneData.capacity.slice(0, times.length) : [] };
      } else {
        // ── 전체 (필터 없음) ──
        dataToUse = {
          inflow: zoneData.inflow ? zoneData.inflow.slice(0, times.length) : [],
          outflow: zoneData.outflow ? zoneData.outflow.slice(0, times.length) : [],
          capacity: zoneData.capacity ? zoneData.capacity.slice(0, times.length) : [],
          queue_length: zoneData.queue_length ? zoneData.queue_length.slice(0, times.length) : [],
          waiting_time: zoneData.waiting_time ? zoneData.waiting_time.slice(0, times.length) : [],
        };
      }

      validZoneCount++;

      // inflow, outflow, capacity는 합산
      ['inflow', 'outflow', 'capacity'].forEach((key) => {
        if (dataToUse[key]) {
          const sanitized = sanitizeNumericSeries(dataToUse[key], times.length);
          if (sanitized) {
            aggregatedData[key] = aggregatedData[key].map((val, idx) => val + (sanitized[idx] || 0));
          }
        }
      });

      // queue_length, waiting_time은 평균 계산을 위해 합산 (나중에 zone 개수로 나눔)
      ['queue_length', 'waiting_time'].forEach((key) => {
        if (dataToUse[key]) {
          const sanitized = sanitizeNumericSeries(dataToUse[key], times.length);
          if (sanitized) {
            aggregatedData[key] = aggregatedData[key].map((val, idx) => val + (sanitized[idx] || 0));
          }
        }
      });
    });

    // queue_length와 waiting_time은 평균 계산
    if (validZoneCount > 0) {
      aggregatedData.queue_length = aggregatedData.queue_length.map(val => val / validZoneCount);
      aggregatedData.waiting_time = aggregatedData.waiting_time.map(val => val / validZoneCount);
    }

    const sanitizedSeriesCache: Record<string, number[]> = aggregatedData;
    const capacitySeries = aggregatedData.capacity;

    const newLineChartData: Plotly.Data[] = [];
    const newLayout: Partial<Plotly.Layout> = {
      margin: { l: 60, r: 60, b: 60, t: 24 },
      showlegend: false,
      xaxis: {
        showgrid: false,
        tickfont: { size: 10 },
        dtick: 3600000,
        showline: false,
        automargin: false,
        ticklen: 15,
        ticks: 'outside',
        tickcolor: 'transparent',
      },
    };

    const yaxisAssignment = [undefined, 'y2'] as const;

    const selectedOptionValues = chartOption1.map((i) => CHART_OPTIONS[i].value);
    // pax 단위 메트릭(inflow/outflow/queue_length) 2개가 동시 선택된 경우 축 범위 동기화
    const paxMetrics = ['inflow', 'outflow', 'queue_length'];
    const bothArePaxMetrics =
      chartOption1.length === 2 && selectedOptionValues.every((v) => paxMetrics.includes(v));

    chartOption1.forEach((activeIndex, i) => {
      const option = CHART_OPTIONS[activeIndex];
      if (!option) return;

      const yaxisId = yaxisAssignment[i];

      const sanitizedSeries = aggregatedData[option.value];
      if (!sanitizedSeries) return;

      // Layout
      const yAxisConfig = {
        title: { text: `${option.label} ${getYAxisTitle(option.value)}`, standoff: 16, font: { color: option.color } },
        showgrid: true,
        gridcolor: option.color ? hexToRgba(option.color, 0.3) : '#e0e7ef',
        gridwidth: 1,
        griddash: 'dot',
        tickfont: { color: option.color, size: 10 },
        linecolor: option.color,
        showline: false,
      } as any;

      if (yaxisId === 'y2') {
        newLayout.yaxis2 = {
          ...yAxisConfig,
          overlaying: 'y',
          side: 'right',
        };
      } else {
        newLayout.yaxis = yAxisConfig;
      }

      // Line chart data
      let lineChartTrace: Plotly.Data = {
        x: times,
        y: sanitizedSeries,
        name: option.label,
        line: { color: option.color, shape: 'spline', smoothing: 1 },
        yaxis: yaxisId,
        showlegend: false,
      };
      if (option.value === 'waiting_time') {
        lineChartTrace = convertSecondsToMinutesInt(lineChartTrace);
      }
      newLineChartData.push(lineChartTrace);
    });

    if (chartOption1.length === 1) {
      delete newLayout.yaxis2;
    }

    const selectedOptionsWithAxis = chartOption1.map((activeIndex, i) => ({
      value: CHART_OPTIONS[activeIndex].value,
      axis: yaxisAssignment[i],
    }));

    const paxUnitOptions = ['inflow', 'outflow', 'queue_length'];

    // --- Calculate Max Value for Pax Units (per-axis independent ranges) ---
    const selectedPaxOptions = selectedOptionsWithAxis.filter((opt) => paxUnitOptions.includes(opt.value));
    if (selectedPaxOptions.length > 0) {
      // pax 단위 메트릭 2개 동시 선택 시: 큰 값 기준으로 양쪽 축 모두 동일한 범위 적용
      if (bothArePaxMetrics) {
        const allPaxData = selectedOptionValues.flatMap((key) => sanitizedSeriesCache[key] ?? []);
        let maxPaxValue = allPaxData.length > 0 ? Math.max(...allPaxData) : 0;
        // capacity는 inflow/outflow가 포함된 경우에만 표시되므로 그때만 반영
        const hasFlowMetric = selectedOptionValues.some((v) => ['inflow', 'outflow'].includes(v));
        if (hasFlowMetric && capacitySeries) {
          const capacityMax = Math.max(...capacitySeries.filter((v) => typeof v === 'number'));
          maxPaxValue = Math.max(maxPaxValue, capacityMax);
        }
        const paxRangeMax = maxPaxValue > 0 ? maxPaxValue * 1.1 : 10;
        if (newLayout.yaxis) {
          newLayout.yaxis.range = [0, paxRangeMax];
          (newLayout.yaxis as any).autorange = false;
        }
        if (newLayout.yaxis2) {
          (newLayout.yaxis2 as any).range = [0, paxRangeMax];
          (newLayout.yaxis2 as any).autorange = false;
        }
      } else {
        const paxByAxis = new Map<string | undefined, typeof selectedPaxOptions>();
        selectedPaxOptions.forEach((opt) => {
          const group = paxByAxis.get(opt.axis) ?? [];
          group.push(opt);
          paxByAxis.set(opt.axis, group);
        });

        paxByAxis.forEach((opts, axis) => {
          const dataToCompare = opts.flatMap((opt) => sanitizedSeriesCache[opt.value] ?? []);
          let maxPaxValue = dataToCompare.length > 0 ? Math.max(...dataToCompare) : 0;

          const hasFlow = opts.some((opt) => ['inflow', 'outflow'].includes(opt.value));
          if (hasFlow && capacitySeries) {
            const capacityMax = Math.max(...capacitySeries.filter((v) => typeof v === 'number'));
            maxPaxValue = Math.max(maxPaxValue, capacityMax);
          }

          const paxRangeMax = maxPaxValue > 0 ? maxPaxValue * 1.1 : 10;

          const axisToUpdate = axis === 'y2' ? newLayout.yaxis2 : newLayout.yaxis;
          if (axisToUpdate) {
            axisToUpdate.range = [0, paxRangeMax];
            axisToUpdate.autorange = false;
          }
        });
      }
    }

    // --- Calculate and Apply Max Value for Wait Time Unit ---
    const selectedWaitTimeOption = selectedOptionsWithAxis.find((opt) => opt.value === 'waiting_time');
    if (selectedWaitTimeOption) {
      const waitTimeRaw = sanitizedSeriesCache['waiting_time'] ?? [];
      const waitTimeData = waitTimeRaw.map((v) => Math.floor(v / 60));
      const maxWaitTimeValue = waitTimeData.length > 0 ? Math.max(...waitTimeData) : 0;
      const waitTimeRangeMax = maxWaitTimeValue > 0 ? maxWaitTimeValue * 1.1 : 10;

      const axisToUpdate = selectedWaitTimeOption.axis === 'y2' ? newLayout.yaxis2 : newLayout.yaxis;
      if (axisToUpdate) {
        axisToUpdate.range = [0, waitTimeRangeMax];
        axisToUpdate.autorange = false;
      }
    }

    const showCapacity =
      chartOption1.some((i) => ['inflow', 'outflow'].includes(CHART_OPTIONS[i].value)) && capacitySeries;

    if (showCapacity) {
      const firstFlowSelectionIndex = chartOption1.findIndex((i) =>
        ['inflow', 'outflow'].includes(CHART_OPTIONS[i].value)
      );
      const capacityYAxis = yaxisAssignment[firstFlowSelectionIndex];

      const capacityTrace: Plotly.Data = {
        x: times,
        y: capacitySeries,
        name: 'Capacity',
        type: 'scatter',
        mode: 'lines',
        line: { color: '#dc2626', dash: 'dashdot', shape: 'hv', width: 2 },
        yaxis: capacityYAxis,
      };
      newLineChartData.push(capacityTrace);
      newLayout.showlegend = true;
      newLayout.legend = {
        x: 1,
        y: 1.05,
        xanchor: 'right',
        yanchor: 'top',
      };
    }

    setLineChartData(newLineChartData);
    setChartLayout(newLayout);
  }, [chartOption1, selectedFacilityValue, selectedZones, selectedFlights, hourlyTrendsData]);

  // 선택된 zone들의 라벨 생성
  const selectedZonesLabel = useMemo(() => {
    if (selectedZones.includes('all_zones')) {
      return 'All Zones';
    }
    if (selectedZones.length === 0) {
      return 'Select Zones';
    }
    if (selectedZones.length === 1) {
      return ZONE_OPTIONS.find(opt => opt.value === selectedZones[0])?.label || selectedZones[0];
    }
    return `${selectedZones.length} zones selected`;
  }, [selectedZones, ZONE_OPTIONS]);

  // selectedFlights 기반으로 라벨 파생
  const selectedAirlinesLabel = useMemo(() => {
    if (selectedFlights.includes('all')) return 'All Airlines';
    if (selectedFlights.length === 0) return 'No selection';

    if (noFlightData) {
      // 편명 없는 시나리오: selectedFlights에 airline code가 담겨있음
      if (selectedFlights.length === 1) {
        const opt = AIRLINE_OPTIONS.find(o => o.value === selectedFlights[0]);
        return opt?.label || selectedFlights[0];
      }
      return `${selectedFlights.length} airlines`;
    }

    // 활성 항공사 목록 파생
    const activeAirlines = AIRLINE_OPTIONS.filter(({ value }) => {
      const flights = flightsByAirline[value] ?? [];
      if (flights.length === 0) return selectedFlights.includes(value);
      return flights.some(f => selectedFlights.includes(f));
    }).map(a => a.value);

    if (activeAirlines.length === 0) return 'No selection';

    if (activeAirlines.length === 1) {
      const airlineCode = activeAirlines[0];
      const flights = flightsByAirline[airlineCode] ?? [];
      const selectedInAirline = flights.filter(f => selectedFlights.includes(f));
      if (selectedInAirline.length === 0 || selectedInAirline.length === flights.length) {
        const opt = AIRLINE_OPTIONS.find(o => o.value === airlineCode);
        return opt?.label || airlineCode;
      }
      if (selectedInAirline.length === 1) return selectedInAirline[0];
      return `${airlineCode} · ${selectedInAirline.length} flights`;
    }

    return `${activeAirlines.length} airlines`;
  }, [selectedFlights, flightsByAirline, AIRLINE_OPTIONS, noFlightData]);

  return (
    <HomeChartGuard scenario={scenario} isLoading={!!isFlowChartLoading}>
      <HomeChartSection title="Hourly Trends">
        <div className="chart-header-container">
          <div className="chart-header-selects">
            <div ref={dropdownRef} className="relative min-w-48 flex-1">
              <button
                onClick={() => setIsZonePanelOpen(!isZonePanelOpen)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <span>
                  {FACILITY_OPTIONS.find((opt) => opt.value === selectedFacilityValue)?.label || 'Select Facility'}
                  {' · '}
                  <span className="text-muted-foreground">{selectedZonesLabel}</span>
                </span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </button>

              {isZonePanelOpen && (
                <div className="absolute left-0 top-full z-50 mt-1 flex min-w-[400px] rounded-md border bg-popover text-popover-foreground shadow-md">
                  {/* Facility 리스트 */}
                  <div className="w-1/2 border-r">
                    {FACILITY_OPTIONS.map((facility) => (
                      <button
                        key={facility.value}
                        onClick={() => setSelectedFacilityValue(facility.value)}
                        className={cn(
                          'flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-accent',
                          selectedFacilityValue === facility.value && 'bg-accent'
                        )}
                      >
                        <div className="flex flex-col items-start gap-0.5">
                          <span>{facility.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {facility.throughput.toLocaleString()} pax
                          </span>
                        </div>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    ))}
                  </div>

                  {/* Zone 멀티셀렉트 패널 */}
                  <div className="w-1/2 p-2">
                    <div className="text-xs font-semibold text-muted-foreground mb-2 px-2">Select Zones</div>
                    <div className="max-h-64 overflow-y-auto">
                      {ZONE_OPTIONS.map((zone) => (
                        <label
                          key={zone.value}
                          className="flex items-center gap-2 px-2 py-1.5 hover:bg-accent rounded-sm cursor-pointer"
                        >
                          <Checkbox
                            checked={selectedZones.includes(zone.value)}
                            onCheckedChange={() => toggleZone(zone.value)}
                          />
                          <span className="text-sm">{zone.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Passengers (Airline + Flight) 드롭다운 */}
            <div ref={airlineDropdownRef} className="relative min-w-48 flex-1">
              <button
                onClick={() => {
                  setIsAirlinePanelOpen(!isAirlinePanelOpen);
                  if (isAirlinePanelOpen) setHoveredAirline(null);
                }}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <span>
                  Passengers
                  {' · '}
                  <span className="text-muted-foreground">{selectedAirlinesLabel}</span>
                </span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </button>

              {isAirlinePanelOpen && (
                <div className="absolute left-0 top-full z-50 mt-1 flex rounded-md border bg-popover text-popover-foreground shadow-md">
                  {/* 1열: 카테고리 헤더 */}
                  <div className="w-28 shrink-0 border-r">
                    <div className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium bg-accent/60 select-none">
                      <span>Airline</span>
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>

                  {/* 2열: 항공사 목록 */}
                  <div className="w-64 shrink-0 border-r">
                    {/* 헤더 — 전체선택/해제 체크박스 (Select Airlines) */}
                    {(() => {
                      const headerChecked = selectedFlights.includes('all')
                        ? true
                        : selectedFlights.length === 0
                        ? false
                        : ('indeterminate' as const);
                      return (
                        <div className="flex items-center gap-2 px-3 py-2 border-b">
                          <Checkbox
                            checked={headerChecked}
                            onCheckedChange={toggleAllFlights}
                          />
                          <span className="text-xs font-semibold text-muted-foreground">Select Airlines</span>
                        </div>
                      );
                    })()}
                    <div className="max-h-60 overflow-y-auto">
                      {AIRLINE_OPTIONS.map((airline) => {
                        const hasFlights = (flightsByAirline[airline.value]?.length ?? 0) > 0;
                        const isExpanded = hoveredAirline === airline.value;
                        const airlineCheckState = getAirlineCheckState(airline.value);

                        return (
                          <div
                            key={airline.value}
                            className={cn('flex items-center', isExpanded && 'bg-accent')}
                          >
                            {/* 체크박스 — 항공사 선택 전용 (cascade to flights) */}
                            <div className="flex items-center pl-3 pr-2 py-2 shrink-0">
                              <Checkbox
                                checked={airlineCheckState}
                                onCheckedChange={() => toggleAirline(airline.value)}
                              />
                            </div>

                            {/* 항공사 이름 (+ 화살표) — 편명 패널 토글 전용 */}
                            {hasFlights ? (
                              <button
                                type="button"
                                className="flex flex-1 items-center justify-between pr-3 py-2 text-sm text-left min-w-0"
                                onClick={() => setHoveredAirline(isExpanded ? null : airline.value)}
                              >
                                <span className="truncate">{airline.label}</span>
                                <ChevronRight className={cn(
                                  'h-4 w-4 shrink-0 ml-2 transition-colors',
                                  isExpanded ? 'text-foreground' : 'text-muted-foreground'
                                )} />
                              </button>
                            ) : (
                              <span className="flex-1 pr-3 py-2 text-sm truncate select-none">
                                {airline.label}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3열: 편명 목록 — 항공사 이름 클릭 시 표시 */}
                  {hoveredAirline && flightsByAirline[hoveredAirline] && (
                    <div className="w-44 shrink-0">
                      {/* 편명 헤더: 항공사 체크박스와 동일한 원리 */}
                      {(() => {
                        const flights = flightsByAirline[hoveredAirline];
                        const airlineState = getAirlineCheckState(hoveredAirline);
                        return (
                          <div className="flex items-center gap-2 px-3 py-2 border-b">
                            <Checkbox
                              checked={airlineState}
                              onCheckedChange={() => toggleAirline(hoveredAirline)}
                            />
                            <span className="text-xs font-semibold text-muted-foreground">
                              {hoveredAirline} Flights ({flights.length})
                            </span>
                          </div>
                        );
                      })()}
                      <div className="max-h-60 overflow-y-auto">
                        {flightsByAirline[hoveredAirline].map((flightNum) => {
                          const isChecked = selectedFlights.includes('all') || selectedFlights.includes(flightNum);
                          return (
                            <label
                              key={flightNum}
                              className="flex items-center gap-2 pl-3 pr-3 py-2 hover:bg-accent cursor-pointer"
                            >
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={() => toggleFlight(flightNum)}
                              />
                              <span className="text-sm">{flightNum}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="chart-header-buttons">
            <ToggleButtonGroup
              options={CHART_OPTIONS}
              selectedValues={chartOption1}
              onSelect={(opt, i) => handleChartOption1(i)}
              labelExtractor={(opt) => opt.label}
              buttonClassName="whitespace-nowrap"
              renderIcon={(opt, i, isSelected) =>
                isSelected && (
                  <Circle className="mr-1 !size-2.5" fill={opt.color} color={opt.color} stroke="transparent" />
                )
              }
            />
          </div>
        </div>
        <div className="mt-2 min-h-96 bg-white">
          <LineChart chartData={lineChartData} chartLayout={chartLayout} />
        </div>

        {/* Facility-level Heatmap */}
        {hourlyTrendsData && selectedFacilityValue && (() => {
          const times = filterDayTimes(hourlyTrendsData.times);

          const facilityData = hourlyTrendsData[selectedFacilityValue];
          const dataSource = facilityData?.data || facilityData;
          const zoneFacilities = facilityData?.facilities || [];

          if (!dataSource || zoneFacilities.length === 0 || times.length === 0) {
            return null;
          }

          // 선택된 zone 확인
          const isAllZones = selectedZones.includes('all_zones');
          // 아무것도 선택 안 된 경우
          const isNoneSelected = selectedFlights.length === 0;
          // 편명 필터 확인 (new unified model)
          const isFlightFilteredHeatmap = !selectedFlights.includes('all') && selectedFlights.length > 0;

          // selectedFlights에서 활성 항공사 파생 (sub_facility airline 필터용)
          // 구버전(편명 없음): selectedFlights 자체가 airline code 목록
          const activeAirlinesList: string[] = selectedFlights.includes('all')
            ? []
            : noFlightData
            ? selectedFlights  // airline codes are the leaves
            : Object.entries(flightsByAirline)
                .filter(([, flights]) => flights.some(f => selectedFlights.includes(f)))
                .map(([code]) => code);

          // 편명별 데이터 집계 헬퍼 함수
          const aggregateFlightData = (flightsData: Record<string, any>, timeLength: number) => {
            const result: Record<string, number[]> = {
              inflow: new Array(timeLength).fill(0),
              outflow: new Array(timeLength).fill(0),
              queue_length: new Array(timeLength).fill(0),
              waiting_time: new Array(timeLength).fill(0),
              capacity: new Array(timeLength).fill(0),
            };
            const wtWeightedSum = new Array(timeLength).fill(0);
            const wtInflowSum = new Array(timeLength).fill(0);

            selectedFlights.forEach((flightNum) => {
              const flightData = flightsData[flightNum];
              if (!flightData) return;
              ['inflow', 'outflow', 'queue_length'].forEach((key) => {
                if (flightData[key]) {
                  flightData[key].forEach((value: number, idx: number) => {
                    if (idx < timeLength) result[key][idx] += value;
                  });
                }
              });
              if (flightData.waiting_time && flightData.inflow) {
                flightData.waiting_time.forEach((wt: number, idx: number) => {
                  if (idx < timeLength) {
                    const w = flightData.inflow[idx] || 0;
                    wtWeightedSum[idx] += wt * w;
                    wtInflowSum[idx] += w;
                  }
                });
              }
            });

            result.waiting_time = wtWeightedSum.map((ws, idx) =>
              wtInflowSum[idx] > 0 ? Math.round(ws / wtInflowSum[idx]) : 0
            );
            return result;
          };

          // 활성 항공사 기반 집계 (sub_facility airline-level fallback)
          const aggregateAirlineData = (airlinesData: Record<string, any>, timeLength: number) => {
            const result: Record<string, number[]> = {
              inflow: new Array(timeLength).fill(0),
              outflow: new Array(timeLength).fill(0),
              queue_length: new Array(timeLength).fill(0),
              waiting_time: new Array(timeLength).fill(0),
              capacity: new Array(timeLength).fill(0),
            };
            const waitingTimeWeightedSum = new Array(timeLength).fill(0);
            const waitingTimeInflowSum = new Array(timeLength).fill(0);

            activeAirlinesList.forEach((airlineCode) => {
              const airlineData = airlinesData[airlineCode];
              if (airlineData) {
                ['inflow', 'outflow', 'queue_length', 'capacity'].forEach((key) => {
                  if (airlineData[key]) {
                    airlineData[key].forEach((value: number, idx: number) => {
                      if (idx < timeLength) result[key][idx] += value;
                    });
                  }
                });
                if (airlineData.waiting_time && airlineData.inflow) {
                  airlineData.waiting_time.forEach((wt: number, idx: number) => {
                    if (idx < timeLength) {
                      const w = airlineData.inflow[idx] || 0;
                      waitingTimeWeightedSum[idx] += wt * w;
                      waitingTimeInflowSum[idx] += w;
                    }
                  });
                }
              }
            });

            result.waiting_time = waitingTimeWeightedSum.map((weightedSum, idx) =>
              waitingTimeInflowSum[idx] > 0 ? Math.round(weightedSum / waitingTimeInflowSum[idx]) : 0
            );
            return result;
          };

          let facilities: string[];
          let filteredFacilityData: Record<string, any>;

          if (isAllZones) {
            // All Zones 선택 → zone 레벨 표시
            facilities = zoneFacilities;
            filteredFacilityData = {};
            Object.keys(dataSource).forEach((key) => {
              const zoneData = dataSource[key];
              if (typeof zoneData === 'object' && zoneData !== null) {
                let facilityMetrics;

                if (isNoneSelected) {
                  facilityMetrics = {
                    inflow: new Array(times.length).fill(0),
                    outflow: new Array(times.length).fill(0),
                    queue_length: new Array(times.length).fill(0),
                    waiting_time: new Array(times.length).fill(0),
                  };
                } else if (isFlightFilteredHeatmap && zoneData.flights) {
                  facilityMetrics = aggregateFlightData(zoneData.flights, times.length);
                } else if (isFlightFilteredHeatmap && activeAirlinesList.length > 0 && zoneData.airlines) {
                  facilityMetrics = aggregateAirlineData(zoneData.airlines, times.length);
                } else {
                  facilityMetrics = {
                    inflow: zoneData.inflow ? zoneData.inflow.slice(0, times.length) : [],
                    outflow: zoneData.outflow ? zoneData.outflow.slice(0, times.length) : [],
                    queue_length: zoneData.queue_length ? zoneData.queue_length.slice(0, times.length) : [],
                    waiting_time: zoneData.waiting_time ? zoneData.waiting_time.slice(0, times.length) : [],
                  };
                }

                filteredFacilityData[key] = {
                  ...zoneData,
                  ...facilityMetrics,
                  capacity: zoneData.capacity ? zoneData.capacity.slice(0, times.length) : [],
                };
              }
            });
          } else {
            // 일부 zone 선택 (1개 이상) → 선택된 zone들의 모든 개별 facility 표시
            const tempFacilities: string[] = [];
            const tempFacilityData: Record<string, any> = {};

            selectedZones.forEach((zoneName) => {
              const zoneData = dataSource[zoneName];
              if (zoneData && zoneData.sub_facilities && zoneData.facility_data) {
                // 해당 zone의 개별 facility 추가
                tempFacilities.push(...zoneData.sub_facilities);

                // facility_data의 각 facility 데이터를 시간에 맞춰 자르기
                Object.keys(zoneData.facility_data).forEach((facilityName) => {
                  const facData = zoneData.facility_data[facilityName];
                  if (typeof facData === 'object' && facData !== null) {
                    let facilityMetrics;

                    if (isNoneSelected) {
                      facilityMetrics = {
                        inflow: new Array(times.length).fill(0),
                        outflow: new Array(times.length).fill(0),
                        queue_length: new Array(times.length).fill(0),
                        waiting_time: new Array(times.length).fill(0),
                      };
                    } else if (isFlightFilteredHeatmap && activeAirlinesList.length > 0 && facData.airlines) {
                      facilityMetrics = aggregateAirlineData(facData.airlines, times.length);
                    } else {
                      facilityMetrics = {
                        inflow: facData.inflow ? facData.inflow.slice(0, times.length) : [],
                        outflow: facData.outflow ? facData.outflow.slice(0, times.length) : [],
                        queue_length: facData.queue_length ? facData.queue_length.slice(0, times.length) : [],
                        waiting_time: facData.waiting_time ? facData.waiting_time.slice(0, times.length) : [],
                      };
                    }

                    tempFacilityData[facilityName] = {
                      ...facData,
                      ...facilityMetrics,
                      capacity: facData.capacity ? facData.capacity.slice(0, times.length) : [],
                    };
                  }
                });
              } else if (zoneData) {
                // sub_facilities가 없으면 해당 zone만 표시
                tempFacilities.push(zoneName);

                let facilityMetrics;
                if (isNoneSelected) {
                  facilityMetrics = {
                    inflow: new Array(times.length).fill(0),
                    outflow: new Array(times.length).fill(0),
                    queue_length: new Array(times.length).fill(0),
                    waiting_time: new Array(times.length).fill(0),
                  };
                } else if (isFlightFilteredHeatmap && zoneData.flights) {
                  facilityMetrics = aggregateFlightData(zoneData.flights, times.length);
                } else if (isFlightFilteredHeatmap && activeAirlinesList.length > 0 && zoneData.airlines) {
                  facilityMetrics = aggregateAirlineData(zoneData.airlines, times.length);
                } else {
                  facilityMetrics = {
                    inflow: zoneData.inflow ? zoneData.inflow.slice(0, times.length) : [],
                    outflow: zoneData.outflow ? zoneData.outflow.slice(0, times.length) : [],
                    queue_length: zoneData.queue_length ? zoneData.queue_length.slice(0, times.length) : [],
                    waiting_time: zoneData.waiting_time ? zoneData.waiting_time.slice(0, times.length) : [],
                  };
                }

                tempFacilityData[zoneName] = {
                  ...zoneData,
                  ...facilityMetrics,
                  capacity: zoneData.capacity ? zoneData.capacity.slice(0, times.length) : [],
                };
              }
            });

            facilities = tempFacilities;
            filteredFacilityData = tempFacilityData;
          }

          if (facilities.length === 0) {
            return null;
          }

          return (
            <HomeFacilityHeatmap
              times={times}
              facilities={facilities}
              facilityData={filteredFacilityData}
              scenarioDate={scenario?.target_flight_schedule_date}
            />
          );
        })()}
      </HomeChartSection>
    </HomeChartGuard>
  );
}

export default HomeChartHourlyTrends;
