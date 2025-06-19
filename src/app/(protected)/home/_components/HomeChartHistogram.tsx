import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Option } from '@/types/commons';
import { ScenarioData } from '@/types/simulations';
import { useHistogramChart } from '@/queries/homeQueries';
import TheDropdownMenu from '@/components/TheDropdownMenu';
import TheHistogramChart from '@/components/charts/TheHistogramChart';
import { Button, ButtonGroup } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { capitalizeFirst, formatUnit } from './HomeFormat';
import HomeLoading from './HomeLoading';
import HomeNoScenario from './HomeNoScenario';

interface HomeChartHistogramProps {
  scenario: ScenarioData | null;
}

function HomeChartHistogram({ scenario }: HomeChartHistogramProps) {
  const { data: histogramData, isLoading: isHistogramLoading } = useHistogramChart({ scenarioId: scenario?.id });
  const FACILITY_OPTIONS: Option[] = useMemo(() => {
    if (!histogramData) return [];
    const keys = Object.keys(histogramData);
    // all_facilities를 맨 앞으로, 나머지는 알파벳 순으로
    const sortedKeys = [
      ...keys.filter((k) => k === 'all_facilities'),
      ...keys.filter((k) => k !== 'all_facilities').sort(),
    ];
    return sortedKeys.map((key) => ({
      label: capitalizeFirst(key),
      value: key,
    }));
  }, [histogramData]);
  const [facility2, setFacility2] = useState(FACILITY_OPTIONS[0] || null);
  useEffect(() => {
    setFacility2(FACILITY_OPTIONS[0] || null);
  }, [FACILITY_OPTIONS.length]);
  const handleSelectFacility2 = useCallback(
    (item: Option) => {
      if (!facility2 || item.value !== facility2.value) {
        setFacility2(item);
      }
    },
    [facility2]
  );
  console.log(facility2);
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
  const [histogramChartData, setHistogramChartData] = useState<{ title: string; value: string; width: number }[]>([]);
  useEffect(() => {
    if (!histogramData || !facility2) return;
    const facility = facility2.value;
    if (!histogramData[facility]) return;
    const option = CHART_OPTIONS2[chartOption2[0]].value;
    const { bins, range_unit, value_unit } = histogramData[facility][option];
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
  }, [histogramData, facility2, chartOption2]);
  const CHART_OPTIONS2: Option[] = useMemo(() => {
    if (!histogramData || !facility2 || !histogramData[facility2.value]) return [];
    return Object.keys(histogramData[facility2.value]).map((key) => ({
      label: capitalizeFirst(key),
      value: key,
      color: '',
    }));
  }, [histogramData, facility2]);
  if (!scenario) {
    return <HomeNoScenario />;
  }
  if (isHistogramLoading) {
    return <HomeLoading />;
  }
  return (
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
            label={facility2?.label || ''}
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
  );
}

export default HomeChartHistogram;
