import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Circle } from 'lucide-react';
import { Option } from '@/types/commons';
import { useKPIHeatMapChart } from '@/queries/facilityQueries';
import { Button, ButtonGroup } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const HeatMapChart = dynamic(() => import('@/components/charts/HeatMapChart'), { ssr: false });

const HEAT_MAP_CHART_OPTIONS = [
  { label: 'Queue Pax', value: 'queue_length', color: '#7f56d9' },
  { label: 'Wait Time', value: 'waiting_time', color: '#7f56d9' },
  { label: 'Throughput', value: 'throughput', color: '#7f56d9' },
] as const;

interface FacilityKPISummaryHeatMapChartProps {
  process?: string;
  scenarioId?: string;
}

function FacilityKPISummaryHeatMapChart({ process, scenarioId }: FacilityKPISummaryHeatMapChartProps) {
  const { data: kpiHeatMapChartData } = useKPIHeatMapChart({ scenarioId, process });

  const [activeCharts, setActiveCharts] = useState<number[]>([0]);
  const handleActiveCharts = (buttonIndex: number) => {
    setActiveCharts((prevData) => {
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

  // =================================================================================
  const [heatMapChartData, setHeatMapChartData] = useState<Plotly.Data[]>([]);
  const addHeatMapChartData = useCallback(
    (option: Option) => {
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

  // =================================================================================
  useEffect(() => {
    setHeatMapChartData([]);

    activeCharts.forEach((activeIndex) => {
      addHeatMapChartData(HEAT_MAP_CHART_OPTIONS[activeIndex]);
    });
  }, [activeCharts, addHeatMapChartData]);

  return (
    <>
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
        <ButtonGroup className="justify-end">
          {HEAT_MAP_CHART_OPTIONS.map((option, idx) => (
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

        <div className="bg-white">
          <HeatMapChart
            chartData={heatMapChartData}
            chartLayout={{
              margin: { l: 80, r: 8, b: 24, t: 24 },
              xaxis: { showgrid: false },
              yaxis: { showgrid: false },
            }}
          />
        </div>
      </div>
    </>
  );
}

export default FacilityKPISummaryHeatMapChart;
