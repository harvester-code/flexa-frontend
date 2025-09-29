import { useEffect, useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Option } from '@/types/homeTypes';
import { ScenarioData } from '@/types/homeTypes';
import TheHistogramChart from '@/components/charts/TheHistogramChart';
import { Button } from '@/components/ui/Button';
import ToggleButtonGroup from '@/components/ui/ToggleButtonGroup';
import { cn } from '@/lib/utils';
import { capitalizeFirst, formatUnit } from './HomeFormat';
import HomeLoading from './HomeLoading';
import HomeNoScenario from './HomeNoScenario';
import TheDropdownMenu from './TheDropdownMenu';

interface HomeChartHistogramProps {
  scenario: ScenarioData | null;
  data?: any; // 배치 API에서 받은 histogram 데이터
  isLoading?: boolean; // 배치 API 로딩 상태
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
            {value_unit ? formatUnit(value_unit, 'histogram') : null}
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
        <h5 className="flex h-[50px] items-center text-lg font-semibold">Histogram</h5>
      </div>
      <div className="flex flex-col rounded-md border border-input bg-white p-5">
        <div className="chart-header-container">
          <div className="chart-header-selects">
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
      </div>
    </div>
  );
}

export default HomeChartHistogram;
