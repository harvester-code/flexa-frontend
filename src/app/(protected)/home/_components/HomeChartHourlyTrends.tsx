import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { ChevronDown, Circle } from 'lucide-react';
import { Option } from '@/types/commons';
import { ScenarioData } from '@/types/simulations';
import { useLineChart } from '@/queries/homeQueries';
import Checkbox from '@/components/Checkbox';
import TheDropdownMenu from '@/components/TheDropdownMenu';
import { Button, ButtonGroup } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { capitalizeFirst } from './HomeFormat';
import HomeLoading from './HomeLoading';
import HomeNoScenario from './HomeNoScenario';

const BarChart = dynamic(() => import('@/components/charts/BarChart'), { ssr: false });
const LineChart = dynamic(() => import('@/components/charts/LineChart'), { ssr: false });

const CHART_OPTION_COLORS: Record<string, string> = {
  inflow: '#FF9800',
  outflow: '#9C27B0',
  queue_length: '#1976D2',
  waiting_time: '#43A047',
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

interface HomeChartHourlyTrendsProps {
  scenario: ScenarioData | null;
}

function HomeChartHourlyTrends({ scenario }: HomeChartHourlyTrendsProps) {
  const { data: hourlyTrendsData, isLoading: isFlowChartLoading } = useLineChart({ scenarioId: scenario?.id });
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
    return Object.keys(facilityData).map((key) => ({
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

    const chartDataForZone = hourlyTrendsData[selectedFacilityValue]?.[selectedZoneValue];
    if (!chartDataForZone) {
      setBarChartData([]);
      setLineChartData([]);
      return;
    }

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
      if (!option || !chartDataForZone[option.value]) return;

      const yaxisId = yaxisAssignment[i];

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
        x: hourlyTrendsData.times,
        y: chartDataForZone[option.value],
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
        x: hourlyTrendsData.times,
        y: chartDataForZone[option.value],
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
      const dataToCompare = selectedPaxOptions.flatMap(
        (opt) => chartDataForZone[opt.value]?.filter((v): v is number => typeof v === 'number') ?? []
      );

      let maxPaxValue = dataToCompare.length > 0 ? Math.max(...dataToCompare) : 0;

      const hasFlow = selectedPaxOptions.some((opt) => ['inflow', 'outflow'].includes(opt.value));
      if (hasFlow && chartDataForZone.capacity) {
        const capacityMax = Math.max(...chartDataForZone.capacity.filter((v): v is number => typeof v === 'number'));
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
      const waitTimeData =
        chartDataForZone.waiting_time?.map((v) => (typeof v === 'number' ? Math.floor(v / 60) : 0)) ?? [];
      const maxWaitTimeValue = waitTimeData.length > 0 ? Math.max(...waitTimeData) : 0;
      const waitTimeRangeMax = maxWaitTimeValue > 0 ? maxWaitTimeValue * 1.1 : 10;

      const axisToUpdate = selectedWaitTimeOption.axis === 'y2' ? newLayout.yaxis2 : newLayout.yaxis;
      if (axisToUpdate) {
        axisToUpdate.range = [0, waitTimeRangeMax];
        axisToUpdate.autorange = false;
      }
    }

    const showCapacity =
      chartOption1.some((i) => ['inflow', 'outflow'].includes(CHART_OPTIONS[i].value)) && chartDataForZone.capacity;

    if (showCapacity) {
      const firstFlowSelectionIndex = chartOption1.findIndex((i) =>
        ['inflow', 'outflow'].includes(CHART_OPTIONS[i].value)
      );
      const capacityYAxis = yaxisAssignment[firstFlowSelectionIndex];

      const capacityTrace: Plotly.Data = {
        x: hourlyTrendsData.times,
        y: chartDataForZone.capacity,
        name: 'Capacity',
        type: 'scatter',
        mode: 'lines',
        line: { color: '#dc2626', dash: 'dashdot', shape: 'hv' },
        yaxis: capacityYAxis,
      };
      newLineChartData.push(capacityTrace);
      newBarChartData.push(capacityTrace);
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
        <h5 className="flex h-[50px] items-center text-xl font-semibold">Hourly Trends</h5>
        <div className="mb-4 mr-5 mt-8 flex items-center gap-1 text-sm">
          <span>Bar Chart</span>
          <Checkbox
            id="chart-type"
            className="checkbox-toggle"
            label=""
            checked={chartType}
            onChange={() => setChartType(!chartType)}
          />
          <span>Line Chart</span>
        </div>
      </div>
      <div className="flex flex-col rounded-md border border-default-200 bg-white p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-4">
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
          <div className="flex items-center self-center md:self-auto">
            <ButtonGroup>
              {CHART_OPTIONS.map((opt, i) => (
                <Button
                  className={cn(
                    'whitespace-nowrap',
                    chartOption1.includes(i)
                      ? 'bg-default-200 font-bold shadow-[inset_0px_-1px_4px_0px_rgba(185,192,212,0.80)]'
                      : ''
                  )}
                  variant="outline"
                  key={i}
                  onClick={() => handleChartOption1(i)}
                >
                  {chartOption1.includes(i) && (
                    <Circle className="mr-1 !size-2.5" fill={opt.color} color={opt.color} stroke="transparent" />
                  )}
                  {opt.label}
                </Button>
              ))}
            </ButtonGroup>
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
