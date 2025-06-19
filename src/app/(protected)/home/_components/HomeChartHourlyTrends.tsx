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

interface HomeChartHourlyTrendsProps {
  scenario: ScenarioData | null;
}

function HomeChartHourlyTrends({ scenario }: HomeChartHourlyTrendsProps) {
  const { data: hourlyTrendsData, isLoading: isFlowChartLoading } = useLineChart({ scenarioId: scenario?.id });
  const [lineChartData, setLineChartData] = useState<Plotly.Data[]>([]);
  const [barChartData, setBarChartData] = useState<Plotly.Data[]>([]);
  const [chartLayout, setChartLayout] = useState<Partial<Plotly.Layout>>({
    margin: { l: 60, r: 60, b: 24, t: 24 },
    showlegend: false,
    xaxis: { showgrid: false },
  });

  const convertSecondsToMinutes = (data: Plotly.Data): Plotly.Data => ({
    ...data,
    y: Array.isArray((data as any).y)
      ? (data as any).y.map((v: any) => (typeof v === 'number' ? v / 60 : v))
      : (data as any).y,
  });
  const getYAxisTitle = (optionValue: string) => (optionValue === 'waiting_time' ? '(min)' : '(pax)');
  const handleChartLayout = useCallback((option: Option, yaxis: null | string) => {
    setChartLayout((prev) => {
      if (yaxis) {
        return {
          ...prev,
          yaxis2: {
            title: { text: `${option.label} ${getYAxisTitle(option.value)}`, standoff: 16 },
            overlaying: 'y',
            side: 'right',
            showgrid: true,
            gridcolor: '#e0e7ef',
            gridwidth: 2,
          },
        };
      }
      return {
        ...prev,
        yaxis: {
          title: { text: `${option.label} ${getYAxisTitle(option.value)}`, standoff: 16 },
          showgrid: true,
          gridcolor: '#e0e7ef',
          gridwidth: 2,
        },
      };
    });
  }, []);
  const handleLineChartData = useCallback((data, option: Option, yaxis: null | string) => {
    const MAX_DATA_LENGTH = 2;
    setLineChartData((prevData) => {
      let newData: Plotly.Data = {
        ...data[option.value],
        name: option.value,
        line: { color: option.color },
        yaxis,
      };
      if (option.value === 'waiting_time') {
        newData = convertSecondsToMinutes(newData);
      }
      const updatedData = [...prevData, newData];
      return updatedData.length > MAX_DATA_LENGTH ? updatedData.slice(1) : updatedData;
    });
  }, []);
  const handleBarChartData = useCallback((data, option: Option, yaxis: null | string) => {
    const MAX_DATA_LENGTH = 2;
    setBarChartData((prevData) => {
      let newData: Plotly.Data = {
        ...data[option.value],
        type: 'bar',
        name: option.value,
        offsetgroup: yaxis ? 1 : 2,
        marker: {
          color: option.color,
          opacity: 0.9,
        },
        yaxis,
      };
      if (option.value === 'waiting_time') {
        newData = convertSecondsToMinutes(newData);
      }
      const updatedData = [...prevData, newData];
      return updatedData.length > MAX_DATA_LENGTH ? updatedData.slice(1) : updatedData;
    });
  }, []);

  const FACILITY_OPTIONS = useMemo(() => {
    if (!hourlyTrendsData) return [];
    return Object.keys(hourlyTrendsData).map((key) => ({
      label: capitalizeFirst(key),
      value: key,
    }));
  }, [hourlyTrendsData]);

  const [selectedFacilityValue, setSelectedFacilityValue] = useState(FACILITY_OPTIONS[0]?.value || '');
  useEffect(() => {
    setSelectedFacilityValue(FACILITY_OPTIONS[0]?.value || '');
  }, [FACILITY_OPTIONS.length]);

  const CHART_OPTION_COLORS: Record<string, string> = {
    queue_length: '#FF9800',
    waiting_time: '#1976D2',
    throughput: '#43A047',
  };

  const CHART_OPTIONS = useMemo(() => {
    if (!hourlyTrendsData || !selectedFacilityValue) return [];
    const keys = Object.keys(hourlyTrendsData[selectedFacilityValue] || {});
    const filteredKeys = selectedFacilityValue === 'all_facilities' ? keys.filter((k) => k !== 'throughput') : keys;
    return filteredKeys.map((key) => ({
      label: capitalizeFirst(key),
      value: key,
      color: CHART_OPTION_COLORS[key] || '#888',
    }));
  }, [hourlyTrendsData, selectedFacilityValue]);

  const [chartType, setChartType] = useState(true);
  const [chartOption1, setChartOption1] = useState([0]);
  const handleChartOption1 = (buttonIndex: number) => {
    setChartOption1((prevData) => {
      if (prevData.includes(buttonIndex)) {
        if (prevData.length === 1) {
          return prevData;
        }
        return prevData.filter((v) => v !== buttonIndex);
      } else {
        if (prevData.length >= 2) {
          return [...prevData.slice(1), buttonIndex];
        }
        return [...prevData, buttonIndex];
      }
    });
  };

  useEffect(() => {
    if (!hourlyTrendsData) return;
    const chartData = hourlyTrendsData[selectedFacilityValue];
    if (!chartData) return;
    setBarChartData([]);
    setLineChartData([]);
    const yaxis = [null, 'y2'];
    chartOption1.forEach((activeIndex, i) => {
      const option = CHART_OPTIONS[activeIndex];
      if (!option) return;
      handleChartLayout(option, yaxis[i]);
      handleBarChartData(chartData, option, yaxis[i]);
      handleLineChartData(chartData, option, yaxis[i]);
    });
  }, [
    chartOption1,
    selectedFacilityValue,
    hourlyTrendsData,
    handleChartLayout,
    handleBarChartData,
    handleLineChartData,
  ]);

  useEffect(() => {
    if (selectedFacilityValue === 'all_facilities') {
      setChartOption1((prev) => prev.filter((idx) => idx !== 2));
    }
  }, [selectedFacilityValue]);

  useEffect(() => {
    if (CHART_OPTIONS.length === 0) {
      setChartOption1([]);
    } else {
      setChartOption1([0]);
    }
  }, [selectedFacilityValue, CHART_OPTIONS.length]);

  if (!scenario) {
    return <HomeNoScenario />;
  }
  if (isFlowChartLoading) {
    return <HomeLoading />;
  }

  console.log(selectedFacilityValue);

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between pl-5">
        <h5 className="flex h-[50px] items-center text-xl font-semibold">Hourly Trends</h5>
        <div className="mb-4 mt-8 flex items-center justify-end gap-1 text-sm">
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
        <div className="mb-4 flex flex-col items-stretch justify-between gap-4 xl:flex-row xl:items-center">
          <TheDropdownMenu
            className="min-w-60 [&>*]:justify-start"
            items={FACILITY_OPTIONS}
            icon={<ChevronDown />}
            label={FACILITY_OPTIONS.find((opt) => opt.value === selectedFacilityValue)?.label || ''}
            onSelect={(item) => setSelectedFacilityValue(item.value)}
          />
          <div className="flex items-center">
            <ButtonGroup>
              {CHART_OPTIONS.map((opt, i) => (
                <Button
                  className={cn(
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
