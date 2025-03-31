import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { PRIMARY_COLOR_SCALES } from '@/constants';
import { ChevronDown, Circle } from 'lucide-react';
import { Option } from '@/types/commons';
import { useHistogramChart, useLineChart, useSankeyChart } from '@/queries/homeQueries';
import AppDropdownMenu from '@/components/AppDropdownMenu';
import Checkbox from '@/components/Checkbox';
import { Button, ButtonGroup } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const LineChart = dynamic(() => import('@/components/charts/LineChart'), { ssr: false });
const SankeyChart = dynamic(() => import('@/components/charts/SankeyChart'), { ssr: false });

// TODO: 동적으로 수정하기
const FACILITY_OPTIONS: Option[] = [
  { label: 'All Facilities', value: 'All Facility' },
  { label: 'Check-in', value: 'checkin' },
  { label: 'Departure Gate', value: 'departure_gate' },
  { label: 'Security', value: 'security' },
  { label: 'Passport', value: 'passport' },
];

const CHART_OPTIONS: Option[] = [
  { label: 'Queue Length', value: 'queue_length', color: '' },
  { label: 'Waiting Time', value: 'waiting_time', color: '' },
];
const CHART_OPTIONS2: Option[] = [
  { label: 'Queue Length', value: 'queue_length', color: '' },
  { label: 'Waiting Time', value: 'waiting_time', color: '' },
  { label: 'Throughput', value: 'throughput', color: '' },
];

interface HomeChartsProps {
  scenario: any;
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
        if (prevData.length >= 1) {
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

  // FIXME: 병하대리님께 재수정 요청
  const { data: { flow_chart } = {} } = useLineChart({ scenarioId: scenario?.id });
  const { data: { data: histogram } = [] } = useHistogramChart({ scenarioId: scenario?.id });
  const { data: { data: rawSankeyChartData } = {} } = useSankeyChart({ scenarioId: scenario?.id });

  const [lineChartData, setLineChartData] = useState<Plotly.Data[]>([]);
  const [histogramChartData, setHistogramChartData] = useState<Option[]>([]);
  const [sankeyChartData, setSankeyChartData] = useState<Plotly.Data[]>([]);

  useEffect(() => {
    const fetchLineChartData = async () => {
      try {
        const res = await fetch('/samples/data/line_chart_data.json');
        const data = await res.json();

        const [throughput, waitingTime] = data.line_chart_data;

        const trace1: Plotly.Data = {
          ...throughput,
          name: 'Throughtput',
          line: { color: '#53389e' },
        };
        const trace2: Plotly.Data = {
          ...waitingTime,
          name: 'Waiting time',
          yaxis: 'y2',
          // TODO: HEX CODE 확인해보기
          line: { color: 'orange' },
        };

        setLineChartData([trace1, trace2]);
      } catch (error) {
        console.error((error as Error).message);
      }
    };

    fetchLineChartData();
  }, []);

  // ================================================================================
  // FIXME: 병하대리님께 재수정 요청
  useEffect(() => {
    if (!histogram) return;

    const data = histogram.find((data) => Object.hasOwn(data, selectedFacility2.value));
    const target = CHART_OPTIONS[selectedChartOption2[0]].value;
    const finalData = data[selectedFacility2.value][target]
      ?.map(({ title, value }, i) => ({
        label: title,
        value: Number(value.replace('%', '')),
        color: PRIMARY_COLOR_SCALES[i],
      }))
      .filter(({ value }) => value > 0);

    setHistogramChartData(finalData);
  }, [histogram, selectedFacility2, selectedChartOption2]);

  // ================================================================================
  // FIXME: 병하대리님께 재수정 요청
  useEffect(() => {
    if (!rawSankeyChartData) return;

    const data: Plotly.Data[] = [
      {
        type: 'sankey',
        orientation: 'h',
        node: {
          pad: 15,
          thickness: 20,
          // line: { color: 'black', width: 0.5 },
          label: rawSankeyChartData.label,
          color: PRIMARY_COLOR_SCALES,
        },
        link: rawSankeyChartData.link,
      },
    ];
    setSankeyChartData(data);
  }, [rawSankeyChartData]);

  return (
    <div className="mt-5 flex flex-col gap-[35px]">
      <div className="flex flex-col">
        <div className="flex items-center justify-between pl-5">
          <h5 className="flex h-[50px] items-center text-xl font-semibold">Flow Chart</h5>
          <div className="flex items-center gap-1 text-sm font-medium text-default-800">
            <span>Bar Chart</span>
            <Checkbox
              id="chart-type"
              label=""
              checked={chartType}
              onChange={() => setChartType(!chartType)}
              className="checkbox-toggle"
            />
            <span>Line Chart</span>
          </div>
        </div>

        <div className="flex flex-col rounded-md border border-default-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <AppDropdownMenu
              className="min-w-60 [&>*]:justify-start"
              items={FACILITY_OPTIONS}
              icon={<ChevronDown />}
              label={selectedFacility1.label}
              onSelect={(opt) => setSelectedFacility1(opt)}
            />
            <div className="flex items-center">
              <ButtonGroup>
                {CHART_OPTIONS.map((opt, idx) => (
                  <Button
                    className={cn(
                      selectedChartOption1.includes(idx)
                        ? 'bg-default-200 font-bold shadow-[inset_0px_-1px_4px_0px_rgba(185,192,212,0.80)]'
                        : ''
                    )}
                    variant="outline"
                    key={idx}
                    onClick={() => handleChartOption1(idx)}
                  >
                    {selectedChartOption1.includes(idx) && (
                      <Circle className="!size-2.5" fill="#111" stroke="transparent" />
                    )}
                    {opt.label}
                  </Button>
                ))}
              </ButtonGroup>
            </div>
          </div>

          <div className="rounded-md bg-white">
            <LineChart
              chartData={lineChartData}
              chartLayout={{
                xaxis: { showgrid: false },
                yaxis: {
                  title: {
                    text: 'Throughtput (number of people)',
                  },
                },
                yaxis2: {
                  title: {
                    text: 'Waiting time',
                  },
                  overlaying: 'y',
                  side: 'right',
                  showgrid: false,
                },
                margin: { l: 60, r: 60, b: 24, t: 24 },
                showlegend: false,
              }}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center justify-between pl-5">
          <h5 className="flex h-[50px] items-center text-xl font-semibold">Histogram</h5>
        </div>
        <div className="flex flex-col rounded-md border border-default-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <AppDropdownMenu
              className="min-w-60 [&>*]:justify-start"
              items={FACILITY_OPTIONS}
              icon={<ChevronDown />}
              label={selectedFacility2.label}
              onSelect={(opt) => setSelectedFacility2(opt)}
            />
            <div className="flex items-center">
              <ButtonGroup>
                {CHART_OPTIONS.map((opt, idx) => (
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
                histogramChartData?.map(({ label, value, color }, idx) => (
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
                    <p className="mt-1 text-sm font-medium">{label}</p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center justify-between pl-5">
          <h5 className="flex h-[50px] items-center text-xl font-semibold">Sankey Chart</h5>
          <p className="text-sm font-medium">Total Passengers Processed: 1,568 pax</p>
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
