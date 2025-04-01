import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { capitalCase } from 'change-case';
import { ChevronDown, Circle } from 'lucide-react';
import { Option } from '@/types/commons';
import { useKPILineChart } from '@/queries/facilityQueries';
import Checkbox from '@/components/Checkbox';
import TheDropdownMenu from '@/components/TheDropdownMenu';
import { Button, ButtonGroup } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const LineChart = dynamic(() => import('@/components/charts/LineChart'), { ssr: false });
const BarChart = dynamic(() => import('@/components/charts/BarChart'), { ssr: false });

const MIXED_CHART_OPTIONS = [
  { label: 'Queue Length', value: 'queue_length', color: '#7f56d9' },
  { label: 'Waiting Time', value: 'waiting_time', color: '#ff9500' },
  { label: 'Throughput', value: 'throughput', color: '#067647' },
] as const;

interface FacilityKPISummaryMixedChartProps {
  process?: string;
  scenarioId: string;
}

function FacilityKPISummaryMixedChart({ process, scenarioId }: FacilityKPISummaryMixedChartProps) {
  const { data: kpiLineChartData } = useKPILineChart({ process, scenarioId });

  const chartKeyOptions = useMemo(() => {
    if (!kpiLineChartData) {
      return [];
    }
    return Object.keys(kpiLineChartData)
      .sort()
      .map((key) => ({ label: capitalCase(key), value: key }));
  }, [kpiLineChartData]);

  const [chartKeyOption, setChartKeyOption] = useState<Option>();

  useEffect(() => {
    if (chartKeyOptions.length > 0) setChartKeyOption(chartKeyOptions[0]);
  }, [chartKeyOptions]);

  const [chartType, setChartType] = useState(true);

  const [activeCharts, setActiveCharts] = useState<number[]>([0]);
  const handleActiveCharts = (buttonIndex: number) => {
    setActiveCharts((prevData) => {
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

  const [chartLayout, setChartLayout] = useState<Partial<Plotly.Layout>>({
    margin: { l: 60, r: 60, b: 24, t: 24 },
    showlegend: false,
    xaxis: { showgrid: false },
  });
  const handleChartLayout = useCallback((option: Option, yaxis: null | string) => {
    setChartLayout((prev) => {
      if (yaxis) {
        return {
          ...prev,
          yaxis2: { title: { text: option.label }, overlaying: 'y', side: 'right', showgrid: false },
        };
      }

      return { ...prev, yaxis: { title: { text: option.label } } };
    });
  }, []);

  const [lineChartData, setLineChartData] = useState<Plotly.Data[]>([]);
  const handleLineChartData = useCallback((data, option: Option, yaxis: null | string) => {
    const MAX_DATA_LENGTH = 2;

    setLineChartData((prevData) => {
      const newData: Plotly.Data = {
        ...data[option.value],
        name: option.value,
        line: { color: option.color },
        yaxis,
      };
      const updatedData = [...prevData, newData];
      return updatedData.length > MAX_DATA_LENGTH ? updatedData.slice(1) : updatedData;
    });
  }, []);

  const [barChartData, setBarChartData] = useState<Plotly.Data[]>([]);
  const handleBarChartData = useCallback((data, option: Option, yaxis: null | string) => {
    const MAX_DATA_LENGTH = 2;

    setBarChartData((prevData) => {
      const newData: Plotly.Data = {
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
      const updatedData = [...prevData, newData];
      return updatedData.length > MAX_DATA_LENGTH ? updatedData.slice(1) : updatedData;
    });
  }, []);

  useEffect(() => {
    if (!kpiLineChartData || !chartKeyOption) return;

    const chartData = kpiLineChartData[chartKeyOption.value];

    if (chartData) {
      setBarChartData([]);
      setLineChartData([]);

      const yaxis = [null, 'y2'];
      activeCharts.forEach((activeIndex, i) => {
        const option = MIXED_CHART_OPTIONS[activeIndex];

        handleChartLayout(option, yaxis[i]);
        handleBarChartData(chartData, option, yaxis[i]);
        handleLineChartData(chartData, option, yaxis[i]);
      });
    }
  }, [
    activeCharts,
    chartKeyOption,
    kpiLineChartData,
    handleChartLayout,
    handleBarChartData,
    handleLineChartData,
  ]);

  return (
    <>
      <div className="mt-10 flex justify-between">
        <dl>
          <dt className="text-xl font-semibold leading-8">Passenger Processing Analysis Chart</dt>
          <dd className="text-sm">
            Analyze the sum of the performances of the selected Check-In facilities for each indicator. You can
            select up to two indicators.
          </dd>
        </dl>
      </div>

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

      <div className="rounded-md border border-default-200 p-5">
        <div className="mb-4 flex items-center justify-between">
          {chartKeyOption ? (
            <TheDropdownMenu
              className="min-w-[120px]"
              icon={<ChevronDown />}
              items={chartKeyOptions}
              label={chartKeyOption.label}
              onSelect={setChartKeyOption}
            />
          ) : (
            <div>Loading...</div>
          )}

          <ButtonGroup className="justify-end">
            {MIXED_CHART_OPTIONS.map((option, idx) => (
              <Button
                className={cn(
                  activeCharts.includes(idx)
                    ? 'bg-default-200 shadow-[inset_0px_-1px_4px_0px_rgba(185,192,212,0.80)]'
                    : ''
                )}
                variant="outline"
                key={option.value}
                onClick={() => handleActiveCharts(idx)}
              >
                {activeCharts.includes(idx) && (
                  <Circle className="!size-2.5" fill={option.color} stroke="transparent" />
                )}
                <span>{option.label}</span>
              </Button>
            ))}
          </ButtonGroup>
        </div>

        <div className="min-h-96 bg-white">
          {chartType ? (
            <LineChart chartData={lineChartData} chartLayout={chartLayout} />
          ) : (
            <BarChart chartData={barChartData} chartLayout={chartLayout} />
          )}
        </div>
      </div>
    </>
  );
}

export default FacilityKPISummaryMixedChart;
