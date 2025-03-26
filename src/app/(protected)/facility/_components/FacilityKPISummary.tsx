import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Option } from '@/types/commons';
import AppDropdownMenu from '@/components/AppDropdownMenu';
import AppTable from '@/components/Table';
import FacilityKPISummaryHeatMapChart from './FacilityKPISummaryHeatMapChart';
import FacilityKPISummaryMixedChart from './FacilityKPISummaryMixedChart';
import FacilityKPISummaryTableLoading from './FacilityKPISummaryTableLoading';

const STATS_OPTIONS = [
  { label: 'Mean', value: 'mean' },
  { label: 'Maximum', value: 'max' },
  { label: 'Top 5%', value: 'top5' },
  { label: 'Median', value: 'median' },
  { label: 'Bottom 5%', value: 'bottom5' },
  { label: 'Minimum', value: 'min' },
];
interface FacilityKPISummaryProps {
  kpiSummaryData?: any;
  kpiLineChartData?: { queue_length: any; throughput: any; waiting_time: any };
  kpiHeatMapChartData?: any;
  onChange: (func: string) => void;
}

function FacilityKPISummary({
  kpiSummaryData,
  kpiLineChartData,
  kpiHeatMapChartData,
  onChange,
}: FacilityKPISummaryProps) {
  const [kpiFunc, setKPIFunc] = useState(STATS_OPTIONS[0]);

  const handleSelectedKPIFunc = (option: Option) => {
    setKPIFunc(option);
    onChange(option.value);
  };

  return (
    <>
      <div className="my-[30px] flex justify-between">
        <dl>
          <dt className="text-xl font-semibold leading-8">Passenger waiting status by KPI</dt>
          <dd className="text-sm">
            Analyze the performance of the selected Check-In facility by KPI. You can check individual counters,
            desk, machine through the filter at the top right.
          </dd>
        </dl>

        <div className="flex items-center gap-2.5">
          <AppDropdownMenu
            className="min-w-[120px]"
            icon={<ChevronDown />}
            items={STATS_OPTIONS}
            label={kpiFunc.label}
            onSelect={handleSelectedKPIFunc}
          />
        </div>
      </div>

      {kpiSummaryData ? <AppTable data={kpiSummaryData} /> : <FacilityKPISummaryTableLoading />}

      {kpiLineChartData && <FacilityKPISummaryMixedChart kpiLineChartData={kpiLineChartData} />}

      {kpiHeatMapChartData && <FacilityKPISummaryHeatMapChart kpiHeatMapChartData={kpiHeatMapChartData} />}
    </>
  );
}

export default FacilityKPISummary;
