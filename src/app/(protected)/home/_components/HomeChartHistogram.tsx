import { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Option, ScenarioData } from '@/types/homeTypes';
import type { HomeStaticData } from '@/types/api/homes/static';
import TheHistogramChart from '@/components/charts/TheHistogramChart';
import { Button } from '@/components/ui/Button';
import ToggleButtonGroup from '@/components/ui/ToggleButtonGroup';
import { cn } from '@/lib/utils';
import { capitalizeFirst, formatUnit } from './HomeFormat';
import HomeChartGuard from './HomeChartGuard';
import HomeChartSection from './HomeChartSection';
import TheDropdownMenu from './TheDropdownMenu';

interface HomeChartHistogramProps {
  scenario: ScenarioData | null;
  data?: HomeStaticData['histogram'];
  isLoading?: boolean;
}

function HomeChartHistogram({ scenario, data, isLoading: propIsLoading }: HomeChartHistogramProps) {
  // 부모 컴포넌트에서 데이터를 받아서 사용 (개별 API 호출 제거)
  const histogramData = data;
  const isHistogramLoading = propIsLoading || false;

  const FACILITY_OPTIONS = useMemo(() => {
    if (!histogramData) return [];
    return Object.keys(histogramData).map((key) => ({
      label: capitalizeFirst(key.replace('_', ' ')),
      value: key,
    }));
  }, [histogramData]);

  const [userFacilityOverride, setUserFacilityOverride] = useState<string | null>(null);
  const selectedFacilityValue = useMemo(() => {
    if (FACILITY_OPTIONS.length === 0) return '';
    if (
      userFacilityOverride &&
      FACILITY_OPTIONS.some((opt) => opt.value === userFacilityOverride)
    ) {
      return userFacilityOverride;
    }
    return FACILITY_OPTIONS[0].value;
  }, [FACILITY_OPTIONS, userFacilityOverride]);

  const ZONE_OPTIONS = useMemo(() => {
    if (!histogramData || !selectedFacilityValue) return [];
    const facilityData = histogramData[selectedFacilityValue];
    if (!facilityData) return [];
    return Object.keys(facilityData).map((key) => ({
      label: key === 'all_zones' ? 'All Zones' : capitalizeFirst(key),
      value: key,
    }));
  }, [histogramData, selectedFacilityValue]);

  const [userZoneOverride, setUserZoneOverride] = useState<string | null>(null);
  const selectedZoneValue = useMemo(() => {
    if (ZONE_OPTIONS.length === 0) return '';
    if (
      userZoneOverride &&
      ZONE_OPTIONS.some((opt) => opt.value === userZoneOverride)
    ) {
      return userZoneOverride;
    }
    const firstActualZone = ZONE_OPTIONS.find((opt) => opt.value !== 'all_zones');
    return firstActualZone ? firstActualZone.value : ZONE_OPTIONS[0].value;
  }, [ZONE_OPTIONS, userZoneOverride]);

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
            {value_unit ? formatUnit(value_unit, 'histogram') : null}
          </>
        ),
        width: value,
      }))
      .filter(({ width }) => width > 0);
  }, [histogramData, selectedFacilityValue, selectedZoneValue, selectedChartType]);

  return (
    <HomeChartGuard scenario={scenario} isLoading={!!isHistogramLoading}>
      <HomeChartSection title="Histogram">
        <div className="chart-header-container">
          <div className="chart-header-selects">
            <TheDropdownMenu
              className="min-w-48 flex-1 [&>*]:justify-start"
              items={FACILITY_OPTIONS}
              icon={<ChevronDown />}
              label={FACILITY_OPTIONS.find((opt) => opt.value === selectedFacilityValue)?.label || 'Select Facility'}
              onSelect={(item) => {
                setUserFacilityOverride(item.value);
                setUserZoneOverride(null);
              }}
            />
            <TheDropdownMenu
              className="min-w-48 flex-1 [&>*]:justify-start"
              items={ZONE_OPTIONS}
              icon={<ChevronDown />}
              label={ZONE_OPTIONS.find((opt) => opt.value === selectedZoneValue)?.label || 'Select Zone'}
              onSelect={(item) => setUserZoneOverride(item.value)}
            />
          </div>
          <div className="chart-header-buttons">
            <ToggleButtonGroup
              options={CHART_OPTIONS}
              selectedValue={selectedChartType}
              onSelect={(opt) => setSelectedChartType(opt.value)}
              labelExtractor={(opt) => opt.label}
            />
          </div>
        </div>
        <TheHistogramChart className="mt-10 rounded-md bg-white" chartData={histogramChartData} />
      </HomeChartSection>
    </HomeChartGuard>
  );
}

export default HomeChartHistogram;
