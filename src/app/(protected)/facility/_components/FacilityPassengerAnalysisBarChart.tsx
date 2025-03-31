import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { PRIMARY_COLOR_SCALES } from '@/constants';
import { AlignLeft, Circle } from 'lucide-react';
import { Option } from '@/types/commons';
import { usePassengerAnalysesBarChart } from '@/queries/facilityQueries';
import AppDropdownMenu from '@/components/AppDropdownMenu';
import { Button, ButtonGroup } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const BarChart = dynamic(() => import('@/components/charts/BarChart'), { ssr: false });

interface FacilityPassengerAnalysisBarChartProps {
  process?: string;
  scenarioId: string;
}

const CHART_OPTIONS: Option[] = [
  { label: 'Queue Length', value: 'queue_length', color: '' },
  { label: 'Waiting Time', value: 'waiting_time', color: '' },
  { label: 'Throughput', value: 'throughput', color: '' },
];

const CRITERIA_OPTIONS = [
  // 아래는 고정
  { label: 'Airline', value: 'airline' },
  { label: 'Destination', value: 'destination' },
  { label: 'Flight Number', value: 'flight_number' },
  // 아래는 동적
  // { label: 'checkin Counter', value: 'checkinCounter' },
];

function FacilityPassengerAnalysisBarChart({ process, scenarioId }: FacilityPassengerAnalysisBarChartProps) {
  const { data: passengerAnalysisBarChartData } = usePassengerAnalysesBarChart({ scenarioId, process });

  const [chartData, setChartData] = useState<Plotly.Data[]>([]);

  const [activeCriteria, setActiveCriteria] = useState(CRITERIA_OPTIONS[0].value);
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

  useEffect(() => {
    if (!passengerAnalysisBarChartData) return;

    const target = CHART_OPTIONS[activeCharts[0]].value;

    const x = passengerAnalysisBarChartData[activeCriteria][target]['default_x'];

    const data: Plotly.Data[] = passengerAnalysisBarChartData[activeCriteria][target]['traces'].map(
      ({ y, name }, i) => {
        return {
          x,
          y,
          name,
          type: 'bar',
          marker: {
            color: PRIMARY_COLOR_SCALES[i],
          },
        };
      }
    );

    setChartData(data);
  }, [activeCharts, activeCriteria, passengerAnalysisBarChartData]);

  return (
    <>
      <div className="mt-10 flex justify-between">
        <dl className="flex flex-col gap-2.5">
          <dt className="text-xl font-semibold leading-none text-default-800">
            Passenger Processing Analysis Chart
          </dt>
          <dd className="font-medium leading-none text-default-600">
            Analyze the sum of the performances of the selected Check-In facilities for each indicator. You can
            select up to two indicators.
          </dd>
        </dl>

        <div className="flex items-center gap-2.5">
          <AppDropdownMenu
            className="!w-[150px] rounded-md"
            label="Color Criteria"
            items={CRITERIA_OPTIONS}
            icon={<AlignLeft />}
            iconDirection="left"
            onSelect={(opt) => setActiveCriteria(opt.value)}
          />
        </div>
      </div>

      <div className="mt-10 rounded-md border border-default-200 p-5">
        <ButtonGroup>
          {CHART_OPTIONS.map((opt, idx) => (
            <Button
              className={cn(
                activeCharts.includes(idx)
                  ? 'bg-default-200 font-bold shadow-[inset_0px_-1px_4px_0px_rgba(185,192,212,0.80)]'
                  : ''
              )}
              variant="outline"
              key={idx}
              onClick={() => handleActiveCharts(idx)}
            >
              {activeCharts.includes(idx) && <Circle className="!size-2.5" fill="#111" stroke="transparent" />}
              {opt.label}
            </Button>
          ))}
        </ButtonGroup>

        <div className="rounded-md bg-white">
          <BarChart
            chartData={chartData}
            chartLayout={{
              // barcornerradius: 15,
              barmode: 'stack',
              margin: {
                l: 36,
                r: 24,
                t: 24,
                b: 32,
              },
              legend: {
                orientation: 'h',
                xanchor: 'right',
                x: 1,
                y: 1.1,
              },
            }}
          />
        </div>
      </div>
    </>
  );
}

export default FacilityPassengerAnalysisBarChart;
