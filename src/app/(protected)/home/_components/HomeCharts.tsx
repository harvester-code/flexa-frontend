'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { ChevronDown, Circle } from 'lucide-react';
import { Option } from '@/types/commons';
import { ScenarioData } from '@/types/simulations';
import { useHistogramChart, useLineChart, useSankeyChart } from '@/queries/homeQueries';
import { SANKEY_COLOR_SCALES } from '@/constants';
import Checkbox from '@/components/Checkbox';
import TheDropdownMenu from '@/components/TheDropdownMenu';
import TheHistogramChart from '@/components/charts/TheHistogramChart';
import { Button, ButtonGroup } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { formatUnit } from './HomeFormat';
import HomeLoading from './HomeLoading';
import HomeNoScenario from './HomeNoScenario';

const BarChart = dynamic(() => import('@/components/charts/BarChart'), { ssr: false });
const LineChart = dynamic(() => import('@/components/charts/LineChart'), { ssr: false });
const SankeyChart = dynamic(() => import('@/components/charts/SankeyChart'), { ssr: false });

const CHART_OPTIONS: Option[] = [
  { label: 'Queue Pax', value: 'queue_length', color: '#FF9800' }, // 주황
  { label: 'Wait Time', value: 'waiting_time', color: '#1976D2' }, // 파랑
  { label: 'Throughput', value: 'throughput', color: '#43A047' }, // 초록 등
];

const CHART_OPTIONS2: Option[] = [
  { label: 'Wait Time', value: 'waiting_time', color: '' },
  { label: 'Queue Pax', value: 'queue_length', color: '' },
];

interface HomeChartsProps {
  scenario: ScenarioData | null;
  processes: Option[];
}

function HomeCharts({ scenario, processes }: HomeChartsProps) {
  const FACILITY_OPTIONS: Option[] = useMemo(
    () => [{ label: 'All Process (avg)', value: 'all_facilities' }].concat(processes),
    [processes]
  );

  const [chartType, setChartType] = useState(true);

  // TODO: 변수명 개선하기
  // Mixed Chart
  const [facility1, setFacility1] = useState(FACILITY_OPTIONS[0]);
  const handleSelectFacility1 = useCallback(
    (item: Option) => {
      if (item.value !== facility1.value) {
        setFacility1(item);
      }
    },
    [facility1]
  );

  // TODO: 변수명 개선하기
  // Histogram Chart
  const [facility2, setFacility2] = useState(FACILITY_OPTIONS[0]);
  const handleSelectFacility2 = useCallback(
    (item: Option) => {
      if (item.value !== facility2.value) {
        setFacility2(item);
      }
    },
    [facility2]
  );

  // FIXME: 하드코딩 제거하기
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
  // FIXME: 하드코딩 제거하기
  const [chartOption2, setChartOption2] = useState([0]);
  const handleChartOption2 = (buttonIndex: number) => {
    setChartOption2((prevData) => {
      if (prevData.includes(buttonIndex)) {
        if (prevData.length === 1) {
          return prevData;
        }
        return prevData.filter((v) => v !== buttonIndex);
      } else {
        if (prevData.length >= 1) {
          return [...prevData.slice(1), buttonIndex];
        }
        return [...prevData, buttonIndex];
      }
    });
  };

  const { data: flowChart, isLoading: isFlowChartLoading } = useLineChart({ scenarioId: scenario?.id });
  const { data: histogram, isLoading: isHistogramLoading } = useHistogramChart({ scenarioId: scenario?.id });
  const { data: sankey, isLoading: isSankeyChartLoading } = useSankeyChart({ scenarioId: scenario?.id });

  const [histogramChartData, setHistogramChartData] = useState<
    {
      title: string;
      value: string;
      width: number;
    }[]
  >([]);

  const [sankeyChartData, setSankeyChartData] = useState<Plotly.Data[]>([]);
  const [totalPassengers, setTotalPassengers] = useState(0);

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
    if (!flowChart) return;

    const chartData = flowChart[facility1.value];

    if (!chartData) return;

    setBarChartData([]);
    setLineChartData([]);
    const yaxis = [null, 'y2'];

    chartOption1.forEach((activeIndex, i) => {
      const option = CHART_OPTIONS[activeIndex];
      handleChartLayout(option, yaxis[i]);
      handleBarChartData(chartData, option, yaxis[i]);
      handleLineChartData(chartData, option, yaxis[i]);
    });
  }, [chartOption1, facility1, flowChart, handleChartLayout, handleBarChartData, handleLineChartData]);

  // ================================================================================
  useEffect(() => {
    if (!histogram) return;
    const facility = facility2.value;
    if (!histogram[facility]) return;

    const option = CHART_OPTIONS2[chartOption2[0]].value;
    const { bins, range_unit, value_unit } = histogram[facility][option];

    function makeLabel([start, end], unit) {
      if (end === null) return `${start}${unit}~`;
      return `${start}~${end}${unit}`;
    }

    const data = bins
      .map(({ range, value }) => ({
        title: makeLabel(range, range_unit),
        value: (
          <>
            {value}
            {value_unit ? formatUnit(value_unit) : null}
          </>
        ),
        width: value,
      }))
      .filter(({ width }) => width > 0);

    setHistogramChartData(data);
  }, [histogram, facility2, chartOption2]);

  // ================================================================================
  useEffect(() => {
    if (!sankey) return;

    const data: Plotly.Data[] = [
      {
        type: 'sankey',
        orientation: 'h',
        node: {
          pad: 15,
          thickness: 20,
          label: sankey.label,
          color: SANKEY_COLOR_SCALES,
        },
        link: sankey.link,
      },
    ];

    setSankeyChartData(data);
    setTotalPassengers(sankey.link?.value.reduce((acc, crr) => acc + crr, 0));
  }, [sankey]);

  if (!scenario) {
    return <HomeNoScenario />;
  }

  if (isFlowChartLoading || isHistogramLoading || isSankeyChartLoading) {
    return <HomeLoading />;
  }

  return (
    <div className="mt-5 flex flex-col gap-[35px]">
      {/* ==================== MIXED CHARTS ==================== */}
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
          <div className="flex flex-col items-stretch justify-between gap-4 xl:flex-row xl:items-center">
            <TheDropdownMenu
              className="min-w-60 [&>*]:justify-start"
              items={FACILITY_OPTIONS}
              icon={<ChevronDown />}
              label={facility1.label}
              onSelect={handleSelectFacility1}
            />
            <div className="flex items-center">
              {/* FIXME: 다른 옵션에서 Throught를 선택한 상태로 다시 All Facilities로 돌아가면 그대로 눌러져있다. */}
              <ButtonGroup>
                {CHART_OPTIONS.slice(
                  0,
                  facility1.value === 'all_facilities' ? CHART_OPTIONS.length - 1 : CHART_OPTIONS.length
                ).map((opt, i) => (
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
                      <Circle className="!size-2.5" fill={opt.color} color={opt.color} stroke="transparent" />
                    )}
                    {opt.label}
                  </Button>
                ))}
              </ButtonGroup>
            </div>
          </div>
          <div className="min-h-96 bg-white">
            {chartType ? (
              <LineChart chartData={lineChartData} chartLayout={chartLayout} />
            ) : (
              <BarChart chartData={barChartData} chartLayout={chartLayout} />
            )}
          </div>
        </div>
      </div>

      {/* ==================== HISTOGRAM ==================== */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between pl-5">
          <h5 className="flex h-[50px] items-center text-xl font-semibold">Histogram</h5>
        </div>
        <div className="flex flex-col rounded-md border border-default-200 bg-white p-5">
          <div className="flex flex-col items-stretch justify-between gap-4 xl:flex-row xl:items-center">
            <TheDropdownMenu
              className="min-w-60 [&>*]:justify-start"
              items={FACILITY_OPTIONS}
              icon={<ChevronDown />}
              label={facility2.label}
              onSelect={handleSelectFacility2}
            />
            <div className="flex items-center">
              <ButtonGroup>
                {CHART_OPTIONS2.map((opt, idx) => (
                  <Button
                    className={cn(
                      chartOption2.includes(idx)
                        ? 'bg-default-200 font-bold shadow-[inset_0px_-1px_4px_0px_rgba(185,192,212,0.80)]'
                        : ''
                    )}
                    variant="outline"
                    key={idx}
                    onClick={() => handleChartOption2(idx)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </ButtonGroup>
            </div>
          </div>

          <TheHistogramChart className="mt-10 rounded-md bg-white" chartData={histogramChartData} />
        </div>
      </div>

      {/* ==================== SANKEY ==================== */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between pl-5">
          <h5 className="flex h-[50px] items-center text-xl font-semibold">Flow Chart</h5>
          <p className="text-sm font-medium">
            Total Passengers Processed: {Number(totalPassengers).toLocaleString()} pax
          </p>
        </div>
        <div className="flex flex-col rounded-md border border-default-200 bg-white p-5">
          <SankeyChart
            chartData={sankeyChartData}
            chartLayout={{
              margin: { l: 8, r: 8, b: 8, t: 8 },
              font: { size: 20 },
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default HomeCharts;
