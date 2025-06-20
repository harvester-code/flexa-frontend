import { useEffect, useMemo, useState } from 'react';
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

  const FACILITY_OPTIONS = useMemo(() => {
    if (!histogramData) return [];
    return Object.keys(histogramData).map((key) => ({
      label: capitalizeFirst(key.replace('_', ' ')),
      value: key,
    }));
  }, [histogramData]);

  const [selectedFacilityValue, setSelectedFacilityValue] = useState('');
  useEffect(() => {
    if (FACILITY_OPTIONS.length > 0 && !selectedFacilityValue) {
      setSelectedFacilityValue(FACILITY_OPTIONS[0].value);
    }
  }, [FACILITY_OPTIONS, selectedFacilityValue]);

  const ZONE_OPTIONS = useMemo(() => {
    if (!histogramData || !selectedFacilityValue) return [];
    const facilityData = histogramData[selectedFacilityValue];
    if (!facilityData) return [];
    return Object.keys(facilityData).map((key) => ({
      label: key === 'all_zones' ? 'All Zones' : capitalizeFirst(key),
      value: key,
    }));
  }, [histogramData, selectedFacilityValue]);

  const [selectedZoneValue, setSelectedZoneValue] = useState('');
  useEffect(() => {
    if (ZONE_OPTIONS.length > 0) {
      setSelectedZoneValue(ZONE_OPTIONS[0].value);
    } else {
      setSelectedZoneValue('');
    }
  }, [ZONE_OPTIONS]);

  const [selectedChartType, setSelectedChartType] = useState('waiting_time');

  const CHART_OPTIONS: Option[] = useMemo(() => {
    if (
      !histogramData ||
      !selectedFacilityValue ||
      !selectedZoneValue ||
      !histogramData[selectedFacilityValue]?.[selectedZoneValue]
    )
      return [];
    return Object.keys(histogramData[selectedFacilityValue][selectedZoneValue]).map((key) => ({
      label: key === 'waiting_time' ? 'Wait Time' : 'Queue Pax',
      value: key,
    }));
  }, [histogramData, selectedFacilityValue, selectedZoneValue]);

  const histogramChartData = useMemo(() => {
    const chartData = histogramData?.[selectedFacilityValue]?.[selectedZoneValue]?.[selectedChartType];

    if (!chartData || !Array.isArray(chartData.bins)) {
      return [];
    }

    const { bins, range_unit, value_unit } = chartData;

    const makeLabel = (range: (number | null)[], unit: string) => {
      const [start, end] = range;
      if (end === null) return `${start}${unit}~`;
      return `${start}~${end}${unit}`;
    };

    return bins
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
  }, [histogramData, selectedFacilityValue, selectedZoneValue, selectedChartType]);

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
          <div className="flex flex-wrap gap-4">
            <TheDropdownMenu
              className="min-w-48 flex-1 [&>*]:justify-start"
              items={FACILITY_OPTIONS}
              icon={<ChevronDown />}
              label={FACILITY_OPTIONS.find((opt) => opt.value === selectedFacilityValue)?.label || 'Select Facility'}
              onSelect={(item) => setSelectedFacilityValue(item.value)}
            />
            <TheDropdownMenu
              className="min-w-48 flex-1 [&>*]:justify-start"
              items={ZONE_OPTIONS}
              icon={<ChevronDown />}
              label={ZONE_OPTIONS.find((opt) => opt.value === selectedZoneValue)?.label || 'Select Zone'}
              onSelect={(item) => setSelectedZoneValue(item.value)}
            />
          </div>
          <div className="flex items-center">
            <ButtonGroup>
              {CHART_OPTIONS.map((opt) => (
                <Button
                  className={cn(
                    selectedChartType === opt.value
                      ? 'bg-default-200 font-bold shadow-[inset_0px_-1px_4px_0px_rgba(185,192,212,0.80)]'
                      : ''
                  )}
                  variant="outline"
                  key={opt.value}
                  onClick={() => setSelectedChartType(opt.value)}
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
