import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { ChevronDown, Circle } from 'lucide-react';
import { Option } from '@/types/homeTypes';
import { ScenarioData } from '@/types/homeTypes';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import ToggleButtonGroup from '@/components/ui/ToggleButtonGroup';
import { cn } from '@/lib/utils';
import { capitalizeFirst } from './HomeFormat';
import HomeLoading from './HomeLoading';
import HomeNoScenario from './HomeNoScenario';
import TheDropdownMenu from './TheDropdownMenu';

const BarChart = dynamic(() => import('@/components/charts/BarChart'), { ssr: false });
const LineChart = dynamic(() => import('@/components/charts/LineChart'), { ssr: false });

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
  const [barChartData, setBarChartData] = useState<Plotly.Data[]>([]);
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
      .map((key) => ({
        label: capitalizeFirst(key.replace('_', ' ')),
        value: key,
      }));
  }, [hourlyTrendsData]);

  const [selectedFacilityValue, setSelectedFacilityValue] = useState('');
  useEffect(() => {
    if (FACILITY_OPTIONS.length > 0 && !selectedFacilityValue) {
      setSelectedFacilityValue(FACILITY_OPTIONS[0].value);
    }
  }, [FACILITY_OPTIONS, selectedFacilityValue]);

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

  const [selectedZoneValue, setSelectedZoneValue] = useState('');
  useEffect(() => {
    if (ZONE_OPTIONS.length > 0) {
      setSelectedZoneValue(ZONE_OPTIONS[0].value);
    }
  }, [ZONE_OPTIONS]);

  const [chartType, setChartType] = useState(true);
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

  useEffect(() => {
    if (!hourlyTrendsData || !selectedFacilityValue || !selectedZoneValue) return;

    const times = Array.isArray(hourlyTrendsData.times) ? hourlyTrendsData.times : [];
    // 새로운 구조 처리 - data 속성이 있으면 그 안에서 가져옴
    const facilityData = hourlyTrendsData[selectedFacilityValue];
    const dataSource = facilityData?.data || facilityData;
    const chartDataForZone = dataSource?.[selectedZoneValue];

    if (!chartDataForZone || !times.length) {
      setBarChartData([]);
      setLineChartData([]);
      return;
    }

    const sanitizedSeriesCache: Record<string, number[]> = {};
    const capacitySeries = sanitizeNumericSeries(chartDataForZone.capacity, times.length);

    const newBarChartData: Plotly.Data[] = [];
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
      barmode: 'group',
    };

    const yaxisAssignment = [undefined, 'y2'] as const;

    chartOption1.forEach((activeIndex, i) => {
      const option = CHART_OPTIONS[activeIndex];
      if (!option) return;

      const yaxisId = yaxisAssignment[i];

      const sanitizedSeries = sanitizeNumericSeries(chartDataForZone[option.value], times.length);
      if (!sanitizedSeries) return;
      sanitizedSeriesCache[option.value] = sanitizedSeries;

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

      // Bar chart data
      let barChartTrace: Plotly.Data = {
        x: times,
        y: sanitizedSeries,
        type: 'bar',
        name: option.label,
        offsetgroup: i + 1,
        marker: { color: option.color, opacity: 0.9 },
        yaxis: yaxisId,
        showlegend: false,
      } as any;
      if (option.value === 'waiting_time') {
        barChartTrace = convertSecondsToMinutesInt(barChartTrace);
      }
      newBarChartData.push(barChartTrace);

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

    // --- Calculate Max Value for Pax Units ---
    const selectedPaxOptions = selectedOptionsWithAxis.filter((opt) => paxUnitOptions.includes(opt.value));
    if (selectedPaxOptions.length > 0) {
      const dataToCompare = selectedPaxOptions.flatMap((opt) => sanitizedSeriesCache[opt.value] ?? []);

      let maxPaxValue = dataToCompare.length > 0 ? Math.max(...dataToCompare) : 0;

      const hasFlow = selectedPaxOptions.some((opt) => ['inflow', 'outflow'].includes(opt.value));
      if (hasFlow && capacitySeries) {
        const capacityMax = Math.max(...capacitySeries.filter((v) => typeof v === 'number'));
        maxPaxValue = Math.max(maxPaxValue, capacityMax);
      }

      const paxRangeMax = maxPaxValue > 0 ? maxPaxValue * 1.1 : 10;

      // Apply range to all selected pax axes
      selectedPaxOptions.forEach((opt) => {
        const axisToUpdate = opt.axis === 'y2' ? newLayout.yaxis2 : newLayout.yaxis;
        if (axisToUpdate) {
          axisToUpdate.range = [0, paxRangeMax];
          axisToUpdate.autorange = false;
        }
      });
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
      newBarChartData.push({ ...capacityTrace });
      newLayout.showlegend = true;
      newLayout.legend = {
        x: 1,
        y: 1.05,
        xanchor: 'right',
        yanchor: 'top',
      };
    }

    setBarChartData(newBarChartData);
    setLineChartData(newLineChartData);
    setChartLayout(newLayout);
  }, [chartOption1, selectedFacilityValue, selectedZoneValue, hourlyTrendsData]);

  if (!scenario) {
    return <HomeNoScenario />;
  }
  if (isFlowChartLoading) {
    return <HomeLoading />;
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between pl-5">
        <h5 className="flex h-[50px] items-center text-lg font-semibold">Hourly Trends</h5>
        <div className="mb-4 mr-5 mt-8 flex items-center gap-1 text-sm font-normal">
          <span>Bar Chart</span>
          <Checkbox
            id="chart-type"
            className="checkbox-toggle"
            checked={chartType}
            onCheckedChange={() => setChartType(!chartType)}
          />
          <span>Line Chart</span>
        </div>
      </div>
      <div className="flex flex-col rounded-md border border-input bg-white p-5">
        <div className="chart-header-container">
          <div className="chart-header-selects">
            <TheDropdownMenu
              className="min-w-48 flex-1 [&>*]:justify-start"
              items={FACILITY_OPTIONS}
              icon={<ChevronDown />}
              label={FACILITY_OPTIONS.find((opt) => opt.value === selectedFacilityValue)?.label || 'Select Facility'}
              onSelect={(item) => setSelectedFacilityValue(item.value)}
            />
            <TheDropdownMenu
              className="min-w-48 flex-1 [&>*]:justify-start"
              items={ZONE_OPTIONS}
              icon={<ChevronDown />}
              label={ZONE_OPTIONS.find((opt) => opt.value === selectedZoneValue)?.label || 'Select Zone'}
              onSelect={(item) => setSelectedZoneValue(item.value)}
            />
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
          {chartType ? (
            <LineChart chartData={lineChartData} chartLayout={chartLayout} />
          ) : (
            <BarChart chartData={barChartData} chartLayout={chartLayout} />
          )}
        </div>
      </div>
    </div>
  );
}

export default HomeChartHourlyTrends;
