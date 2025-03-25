import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { PRIMARY_COLOR_SCALES } from '@/constants';
import { ChevronDown, Circle } from 'lucide-react';
import { Option } from '@/types/commons';
import AppDropdownMenu from '@/components/AppDropdownMenu';
import Checkbox from '@/components/Checkbox';
import { Button, ButtonGroup } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
// TODO: CSS 모듈화하기
import './HomeCharts.css';

const LineChart = dynamic(() => import('@/components/charts/LineChart'), { ssr: false });
const SankeyChart = dynamic(() => import('@/components/charts/SankeyChart'), { ssr: false });

// TODO: 동적으로 수정하기
const FACILITY_OPTIONS: Option[] = [
  { label: 'All Facilities', value: 'All Facilities' },
  { label: 'Check-in', value: 'Check-in' },
  { label: 'Boardingpass Control', value: 'Boardingpass Control' },
  { label: 'Security Control', value: 'Security Control' },
  { label: 'Passport Control', value: 'Passport Control' },
];

// TODO: 변수값 수정하기
const SANKEY_OPTIONS: Option[] = [
  { label: 'By Gate', value: 'byGate' },
  { label: 'New, OLD', value: 'newOld' },
  { label: 'Manual, Automated', value: 'manualAutomated' },
  { label: 'Fasttrack O,Fasttrack X', value: 'fasttrackOFasttrackX' },
];

const CHART_OPTIONS: Option[] = [
  { label: 'Queue Length', value: 'queue_length', color: '' },
  { label: 'Waiting Time', value: 'waiting_time', color: '' },
  { label: 'Throughput', value: 'throughput', color: '' },
];

function HomeCharts() {
  const [chartType, setChartType] = useState(true);

  // TODO: 변수명 개선하기
  const [selectedFacility1, setSelectedFacility1] = useState(FACILITY_OPTIONS[0]);
  const [selectedFacility2, setSelectedFacility2] = useState(FACILITY_OPTIONS[0]);
  const [selectedSankeyOption1, setSelectedSankeyOption1] = useState(SANKEY_OPTIONS[0]);
  const [selectedSankeyOption2, setSelectedSankeyOption2] = useState(SANKEY_OPTIONS[0]);
  const [selectedSankeyOption3, setSelectedSankeyOption3] = useState(SANKEY_OPTIONS[0]);

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

  // FIXME: 라인차트에 날짜 데이터가 없는 상태.
  const [lineChartData, setLineChartData] = useState<Plotly.Data[]>([]);
  const [histogramChartData, setHistogramChartData] = useState<
    { label: string; value: number; color: string }[]
  >([]);
  const [sankeyChartData, setSankeyChartData] = useState<Plotly.Data[]>([]);

  // ================================================================================
  // TODO: 실제 API로 교체하기
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
  // TODO: 실제 API로 교체하기
  useEffect(() => {
    const fetchHistogramChartData = async () => {
      const data = [
        { label: '00:00 - 15:00', value: 14, color: '#4400d9' },
        { label: '15:00 - 30:00', value: 27, color: '#622bd9' },
        { label: '30:00 - 45:00', value: 24, color: '#7f56d9' },
        { label: '45:00 - 60:00', value: 19, color: '#9d82d9' },
        { label: '60:00 -', value: 16, color: '#bbaed9' },
      ];

      setHistogramChartData(data);
    };

    fetchHistogramChartData();
  }, []);

  // ================================================================================
  // TODO: 실제 API로 교체하기
  useEffect(() => {
    const fetchSankeyChartData = async () => {
      try {
        const res = await fetch('/samples/data/passenger_flow_sankey_chart_data.json');
        // FIXME: 오타 발생
        const { sanky } = await res.json();

        const data: Plotly.Data[] = [
          {
            type: 'sankey',
            orientation: 'h',
            node: {
              pad: 15,
              thickness: 20,
              // line: {
              //   color: 'black',
              //   width: 0.5,
              // },
              label: sanky.label,
              color: PRIMARY_COLOR_SCALES,
            },
            link: sanky.link,
          },
        ];

        setSankeyChartData(data);
      } catch (error) {
        console.error((error as Error).message);
      }
    };

    fetchSankeyChartData();
  }, []);

  return (
    <div className="charts">
      {/* Line Chart */}
      <div className="chart-item">
        <div className="chart-item-head">
          <h5>Flow Chart</h5>
          <div>
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

        <div className="chart-item-body">
          <div className="chart-block">
            <div className="flex items-center justify-between">
              <AppDropdownMenu
                className="min-w-60 [&>*]:justify-start"
                items={FACILITY_OPTIONS}
                icon={<ChevronDown />}
                label={selectedFacility1.label}
                onSelect={(opt) => setSelectedFacility1(opt)}
              />

              <div className="tab-btn flex items-center">
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
      </div>

      {/* Histogram Chart */}
      <div className="chart-item">
        <div className="chart-item-head">
          <h5>Histogram</h5>
        </div>
        <div className="chart-item-body">
          <div className="chart-block">
            <div className="flex items-center justify-between">
              <AppDropdownMenu
                className="min-w-60 [&>*]:justify-start"
                items={FACILITY_OPTIONS}
                icon={<ChevronDown />}
                label={selectedFacility2.label}
                onSelect={(opt) => setSelectedFacility2(opt)}
              />

              <div className="tab-btn flex items-center">
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
              <div className="flex text-center">
                {histogramChartData &&
                  histogramChartData.map((d, idx) => (
                    <div style={{ width: `${d.value}%` }} key={idx}>
                      <div
                        className={`py-3.5 ${idx === 0 ? 'rounded-l-lg' : idx === histogramChartData.length - 1 ? 'rounded-r-lg' : ''}`}
                        style={{ background: `${d.color}` }}
                      >
                        <p className="text-3xl font-bold text-white">{d.value}%</p>
                      </div>
                      <p className="mt-1 text-sm font-medium">{d.label}</p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sankey Chart */}
      <div className="chart-item">
        <div className="chart-item-head">
          <h5>Sankey Chart</h5>
          <p className="text-sm font-medium">Total Passengers Processed: 1,568 pax</p>
        </div>

        <div className="chart-item-body">
          <div className="chart-block">
            <div className="mb-6 grid grid-cols-5 gap-14">
              <div className="text-center">
                <p className="mb-2 font-semibold text-default-900">Check-In</p>
                <p className="text-sm font-medium text-default-600">By Check-In Counter</p>
              </div>

              <div className="text-center">
                <p className="mb-2 font-semibold text-default-900">Boarding pass</p>
                <AppDropdownMenu
                  className="min-w-[200px] [&>*]:justify-start"
                  items={SANKEY_OPTIONS}
                  icon={<ChevronDown />}
                  label={selectedSankeyOption1.label}
                  onSelect={(opt) => setSelectedSankeyOption1(opt)}
                />
              </div>

              <div className="text-center">
                <p className="mb-2 font-semibold text-default-900">Security Check</p>
                <AppDropdownMenu
                  className="min-w-[200px] [&>*]:justify-start"
                  items={SANKEY_OPTIONS}
                  icon={<ChevronDown />}
                  label={selectedSankeyOption2.label}
                  onSelect={(opt) => setSelectedSankeyOption2(opt)}
                />
              </div>

              <div className="text-center">
                <p className="mb-2 font-semibold text-default-900">Passport</p>

                <AppDropdownMenu
                  className="min-w-[200px] [&>*]:justify-start"
                  items={SANKEY_OPTIONS}
                  icon={<ChevronDown />}
                  label={selectedSankeyOption3.label}
                  onSelect={(opt) => setSelectedSankeyOption3(opt)}
                />
              </div>

              <div className="text-center">
                <p className="mb-2 font-semibold text-default-900">Boarding</p>
                <p className="text-sm font-medium text-default-600">Eastern, Western</p>
              </div>
            </div>

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
    </div>
  );
}

export default HomeCharts;
