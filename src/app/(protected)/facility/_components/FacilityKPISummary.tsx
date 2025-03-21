import React, { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { ChevronDown } from 'lucide-react';
import { AppDropdownMenu } from '@/components/AppDropdownMenu';
import Checkbox from '@/components/Checkbox';
import AppTable from '@/components/Table';
import { Button, ButtonGroup } from '@/components/ui/Button';

const LineChart = dynamic(() => import('@/components/charts/LineChart'), { ssr: false });
const HeatMapChart = dynamic(() => import('@/components/charts/HeatMapChart'), { ssr: false });

const LINE_CHART_OPTIONS = [
  { label: 'Queue Length', value: 'queue_length', color: '#53389e' },
  { label: 'Waiting Time', value: 'waiting_time', color: 'orange' },
  { label: 'Throughput', value: 'throughput', color: 'gold' },
] as const;

const HEAT_MAP_CHART_OPTIONS = [
  { label: 'Queue Length', value: 'queue_length' },
  { label: 'Waiting Time', value: 'waiting_time' },
  { label: 'Throughput', value: 'throughput' },
] as const;
interface FacilityKPISummaryProps {
  kpiSummaryData?: any;
  kpiLineChartData?: { queue_length: any; throughput: any; waiting_time: any };
  kpiHeatMapChartData?: any;
}

function FacilityKPISummary({
  kpiSummaryData,
  kpiLineChartData,
  kpiHeatMapChartData,
}: FacilityKPISummaryProps) {
  const [chartType, setChartType] = useState(false);

  const [activeLineCharts, setActiveLineCharts] = useState<number[]>([0]);

  const KPI_FUNC = ['Average', 'Maximum', 'Top 5%', 'Total', 'Median', 'Bottom 5%', 'Minimum'];
  const [selectedKPIFunc, setSelectedKPIFunc] = useState(KPI_FUNC[0]);

  const handleActiveLineCharts = (selectedButton: number) => {
    setActiveLineCharts((prevData) => {
      if (prevData.includes(selectedButton)) {
        if (prevData.length === 1) {
          return prevData;
        }
        return prevData.filter((v) => v !== selectedButton);
      } else {
        if (prevData.length >= 2) {
          return [...prevData.slice(1), selectedButton];
        }
        return [...prevData, selectedButton];
      }
    });
  };

  const [lineChartData, setLineChartData] = useState<Plotly.Data[]>([]);
  const [lineChartLayout, setLineChartLayout] = useState<Partial<Plotly.Layout>>({
    xaxis: { showgrid: false },
    margin: { l: 60, r: 60, b: 24, t: 24 },
    showlegend: false,
  });

  const addLineChartData = useCallback(
    (option: any, yaxis: null | string) => {
      const MAX_DATA_LENGTH = 2;

      if (!kpiLineChartData) return;

      setLineChartLayout((prevData) => {
        if (yaxis) {
          return {
            ...prevData,
            yaxis2: {
              title: { text: option.label },
              overlaying: 'y',
              side: 'right',
              showgrid: false,
            },
          };
        }

        return {
          ...prevData,
          yaxis: { title: { text: option.label } },
        };
      });

      setLineChartData((prevData) => {
        if (prevData.some((data) => data.name === option.value)) {
          return prevData;
        }

        const newData = {
          ...kpiLineChartData[option.value],
          name: option.value,
          yaxis,
          line: { color: option.color },
        };

        const updatedData = [...prevData, newData];
        return updatedData.length > MAX_DATA_LENGTH ? updatedData.slice(1) : updatedData;
      });
    },
    [kpiLineChartData]
  );

  const [heatMapChartData, setHeatMapChartData] = useState<Plotly.Data[]>([]);

  const addHeatMapChartData = useCallback(
    (option: any) => {
      if (!kpiHeatMapChartData) return;

      setHeatMapChartData((prevData) => {
        if (prevData.some((data) => data.name === option.value)) {
          return prevData;
        }

        const newData: Plotly.Data = {
          ...kpiHeatMapChartData[option.value],
          type: 'heatmap',
          colorscale: [
            [0.0, '#f9f5ff'],
            [0.1, '#f4ebff'],
            [0.2, '#e9d7fe'],
            [0.3, '#d6bbfb'],
            [0.4, '#b692f6'],
            [0.5, '#9e77ed'],
            [0.6, '#7f56d9'],
            [0.7, '#6941c6'],
            [0.8, '#53389e'],
            [1.0, '#42307d'],
          ],
          showscale: false,
        };

        const updatedData = [...prevData, newData];
        return updatedData.length > 1 ? updatedData.slice(1) : updatedData;
      });
    },
    [kpiHeatMapChartData]
  );

  // useEffect(() => {
  //   addLineChartData(LINE_CHART_OPTIONS[0]);
  //   addHeatMapChartData(HEAT_MAP_CHART_OPTIONS[0]);
  // }, [addLineChartData, addHeatMapChartData]);

  useEffect(() => {
    // 초기화
    setLineChartData([]);

    // 데이터 담기
    const yaxis = [null, 'y2'];
    activeLineCharts.forEach((activeIndex, i) => {
      console.log(i, yaxis[i]);

      addLineChartData(LINE_CHART_OPTIONS[activeIndex], yaxis[i]);
    });
  }, [activeLineCharts, addLineChartData]);

  return (
    <>
      {kpiSummaryData && (
        <>
          <div className="my-[30px] flex justify-between">
            <dl>
              <dt className="text-xl font-semibold leading-8">Passenger waiting status by KPI</dt>
              <dd className="text-sm">
                Analyze the performance of the selected Check-In facility by KPI. You can check individual
                counters, desk, machine through the filter at the top right.
              </dd>
            </dl>

            <div className="flex items-center gap-2.5">
              <AppDropdownMenu
                className="min-w-[120px]"
                icon={<ChevronDown />}
                items={['Average', 'Maximum', 'Top 5%', 'Total', 'Median', 'Bottom 5%', 'Minimum']}
                label={selectedKPIFunc}
                onSelect={setSelectedKPIFunc}
              />
            </div>
          </div>

          <AppTable data={kpiSummaryData} />
        </>
      )}

      {/* ==================================================================================================== */}

      <div className="mt-10 flex items-center justify-between">
        <dl>
          <dt className="text-xl font-semibold leading-8">Number of people excluded from analysis</dt>
          <dd className="text-sm">
            Number of passengers who used mobile Check-In and did not use Baggage Check-In service at the
            airport during the analysis period.
          </dd>
        </dl>
        <div>
          <p className="text-xl font-semibold text-default-900">0 Pax (0% of the total)</p>
        </div>
      </div>

      {/* ==================================================================================================== */}

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
        <ButtonGroup>
          {LINE_CHART_OPTIONS.map((option, idx) => (
            <Button
              className={activeLineCharts.includes(idx) ? 'bg-gray-200' : ''}
              variant="outline"
              key={option.value}
              onClick={() => handleActiveLineCharts(idx)}
            >
              {option.label}
            </Button>
          ))}
        </ButtonGroup>

        <div className="rounded-md bg-white">
          <LineChart chartData={lineChartData} chartLayout={lineChartLayout} />
        </div>
      </div>

      <div className="my-10 flex justify-between">
        <dl>
          <dt className="text-xl font-semibold leading-8">Passenger Processing Heat Map</dt>
          <dd className="text-sm">
            Visualize and display the performance of the selected Check-In facility. Color density makes it easy
            to see changes in data values and relative differences.
          </dd>
        </dl>
      </div>

      <div className="rounded-md border border-default-200 p-5">
        <ButtonGroup>
          {HEAT_MAP_CHART_OPTIONS.map((option) => (
            <Button variant="outline" key={option.value} onClick={() => addHeatMapChartData(option)}>
              {option.label}
            </Button>
          ))}
        </ButtonGroup>

        <div className="rounded-md bg-white">
          <HeatMapChart
            chartData={heatMapChartData}
            // chartLayout={{
            //   xaxis: { showgrid: false },
            //   yaxis: { showgrid: false },
            //   margin: { l: 80, r: 8, b: 24, t: 24 },
            // }}
          />
        </div>
      </div>
    </>
  );
}

export default FacilityKPISummary;
