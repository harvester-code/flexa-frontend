'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { PRIMARY_COLOR_SCALES } from '@/constants';
import { ChevronDown, Circle } from 'lucide-react';
import { Option } from '@/types/commons';
import { ScenarioData } from '@/types/simulations';
import { useHistogramChart, useLineChart, useSankeyChart } from '@/queries/homeQueries';
import Checkbox from '@/components/Checkbox';
import TheDropdownMenu from '@/components/TheDropdownMenu';
import { Button, ButtonGroup } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const BarChart = dynamic(() => import('@/components/charts/BarChart'), { ssr: false });
const LineChart = dynamic(() => import('@/components/charts/LineChart'), { ssr: false });
const SankeyChart = dynamic(() => import('@/components/charts/SankeyChart'), { ssr: false });

// TODO: 동적으로 수정하기
const FACILITY_OPTIONS: Option[] = [
  { label: 'All Facilities', value: 'all_facilities' },
  { label: 'Check-in', value: 'checkin' },
  { label: 'Departure Gate', value: 'departure_gate' },
  { label: 'Security', value: 'security' },
  { label: 'Passport', value: 'passport' },
];

const CHART_OPTIONS: Option[] = [
  { label: 'Queue Length', value: 'queue_length', color: '' },
  { label: 'Waiting Time', value: 'waiting_time', color: '' },
  { label: 'Throughput', value: 'throughput', color: '' },
];

const CHART_OPTIONS2: Option[] = [
  { label: 'Queue Length', value: 'queue_length', color: '' },
  { label: 'Waiting Time', value: 'waiting_time', color: '' },
];

interface HomeChartsProps {
  scenario: ScenarioData;
}

function HomeCharts({ scenario }: HomeChartsProps) {
  const [chartType, setChartType] = useState(true);

  // TODO: 변수명 개선하기
  const [selectedFacility1, setSelectedFacility1] = useState(FACILITY_OPTIONS[0]);
  const [selectedFacility2, setSelectedFacility2] = useState(FACILITY_OPTIONS[0]);

  // FIXME: 하드코딩 제거하기
  const [selectedChartOption1, setSelectedChartOption1] = useState([0]);
  const handleChartOption1 = (buttonIndex: number) => {
    setSelectedChartOption1((prevData) => {
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
  const [selectedChartOption2, setSelectedChartOption2] = useState([0]);
  const handleChartOption2 = (buttonIndex: number) => {
    setSelectedChartOption2((prevData) => {
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

  const { data: flowChart = {} } = useLineChart({ scenarioId: scenario?.id });
  const { data: histogram = {} } = useHistogramChart({ scenarioId: scenario?.id });
  const { data: sankey = {} } = useSankeyChart({ scenarioId: scenario?.id });

  const [histogramChartData, setHistogramChartData] = useState<Option[]>([]);

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

    const chartData = flowChart[selectedFacility1.value];

    if (chartData) {
      setBarChartData([]);
      setLineChartData([]);
      const yaxis = [null, 'y2'];

      selectedChartOption1.forEach((activeIndex, i) => {
        const option = CHART_OPTIONS[activeIndex];
        handleChartLayout(option, yaxis[i]);
        handleBarChartData(chartData, option, yaxis[i]);
        handleLineChartData(chartData, option, yaxis[i]);
      });
    }
  }, [
    selectedChartOption1,
    selectedFacility1,
    flowChart,
    handleChartLayout,
    handleBarChartData,
    handleLineChartData,
  ]);

  // ================================================================================
  useEffect(() => {
    if (!histogram) return;
    const facility = selectedFacility2.value;

    if (!histogram[facility]) return;
    const option = CHART_OPTIONS[selectedChartOption2[0]].value;

    const data = histogram[facility][option]
      .map(({ title, value }, i) => ({
        title,
        value: Number(value.replace('%', '')),
        color: PRIMARY_COLOR_SCALES[i],
      }))
      .filter(({ value }) => value > 0);

    setHistogramChartData(data);
  }, [histogram, selectedFacility2, selectedChartOption2]);

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
          // line: { color: 'black', width: 0.5 },
          label: sankey.label,
          color: PRIMARY_COLOR_SCALES,
        },
        link: sankey.link,
      },
    ];

    // setSankeyChartData(data);
    // setTotalPassengers(sankey.link?.value.reduce((acc, crr) => acc + crr, 0));
  }, [sankey]);

  return (
    <div className="mt-5 flex flex-col gap-[35px]">
      {/* ============================================================================= */}
      {/* NOTE: MIXED CHARTS */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between pl-5">
          <h5 className="flex h-[50px] items-center text-xl font-semibold">Flow Chart</h5>
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
          <div className="flex items-center justify-between">
            <TheDropdownMenu
              className="min-w-60 [&>*]:justify-start"
              items={FACILITY_OPTIONS}
              icon={<ChevronDown />}
              label={selectedFacility1.label}
              onSelect={(opt) => setSelectedFacility1(opt)}
            />
            <div className="flex items-center">
              {/* HACK: 하드코딩 제거하기 */}
              <ButtonGroup>
                {CHART_OPTIONS.map((opt, i) => (
                  <Button
                    className={cn(
                      selectedChartOption1.includes(i)
                        ? 'bg-default-200 font-bold shadow-[inset_0px_-1px_4px_0px_rgba(185,192,212,0.80)]'
                        : ''
                    )}
                    variant="outline"
                    key={i}
                    onClick={() => handleChartOption1(i)}
                  >
                    {selectedChartOption1.includes(i) && (
                      <Circle className="!size-2.5" fill="#111" stroke="transparent" />
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

      {/* ============================================================================= */}
      {/* NOTE: HISTOGRAM */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between pl-5">
          <h5 className="flex h-[50px] items-center text-xl font-semibold">Histogram</h5>
        </div>
        <div className="flex flex-col rounded-md border border-default-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <TheDropdownMenu
              className="min-w-60 [&>*]:justify-start"
              items={FACILITY_OPTIONS}
              icon={<ChevronDown />}
              label={selectedFacility2.label}
              onSelect={(opt) => setSelectedFacility2(opt)}
            />
            <div className="flex items-center">
              <ButtonGroup>
                {CHART_OPTIONS2.map((opt, idx) => (
                  <Button
                    className={cn(
                      selectedChartOption2.includes(idx)
                        ? 'bg-default-200 font-bold shadow-[inset_0px_-1px_4px_0px_rgba(185,192,212,0.80)]'
                        : ''
                    )}
                    variant="outline"
                    key={idx}
                    onClick={() => handleChartOption2(idx)}
                  >
                    {selectedChartOption2.includes(idx) && (
                      <Circle className="!size-2.5" fill="#111" stroke="transparent" />
                    )}
                    {opt.label}
                  </Button>
                ))}
              </ButtonGroup>
            </div>
          </div>

          <div className="mt-10 rounded-md bg-white">
            <div className="flex rounded-lg text-center">
              {histogramChartData &&
                histogramChartData?.map(({ title, value, color }, idx) => (
                  <div style={{ width: `${value}%` }} key={idx}>
                    <div
                      className={`py-3.5 ${
                        histogramChartData.length === 1
                          ? 'rounded-lg'
                          : idx === 0
                            ? 'rounded-l-lg'
                            : idx === histogramChartData.length - 1
                              ? 'rounded-r-lg'
                              : ''
                      }`}
                      style={{ background: `${color}` }}
                    >
                      <p className="text-3xl font-bold text-white">{value}%</p>
                    </div>
                    <p className="mt-1 text-sm font-medium">{title}</p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================================= */}
      {/* NOTE: SANKEY */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between pl-5">
          <h5 className="flex h-[50px] items-center text-xl font-semibold">Sankey Chart</h5>
          <p className="text-sm font-medium">
            Total Passengers Processed: {Number(totalPassengers).toLocaleString()} pax
          </p>
        </div>
        <div className="flex flex-col rounded-md border border-default-200 bg-white p-5">
          <SankeyChart
            chartData={sankeyChartData}
            chartLayout={{
              margin: { l: 80, r: 80, b: 24, t: 24 },
              font: { size: 20 },
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default HomeCharts;
