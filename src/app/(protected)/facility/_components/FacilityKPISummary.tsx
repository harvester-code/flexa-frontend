import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Option } from '@/types/commons';
import AppDropdownMenu from '@/components/AppDropdownMenu';
import AppTable from '@/components/Table';
import FacilityKPISummaryHeatMapChart from './FacilityKPISummaryHeatMapChart';
import FacilityKPISummaryMixedChart from './FacilityKPISummaryMixedChart';
import FacilityKPISummaryTableLoading from './FacilityKPISummaryTableLoading';

const KPI_FUNCS = [
  { label: 'Mean', value: 'mean' },
  { label: 'Maximum', value: 'max' },
  { label: 'Top 5%', value: 'top5' },
  { label: 'Total', value: 'sum' },
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
  const [kpiFunc, setKPIFunc] = useState(KPI_FUNCS[0]);

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
            items={KPI_FUNCS}
            label={kpiFunc.label}
            onSelect={handleSelectedKPIFunc}
          />
        </div>
      </div>

      {kpiSummaryData ? <AppTable data={kpiSummaryData} /> : <FacilityKPISummaryTableLoading />}

      {/* ==================================================================================================== */}
      {/* NOTE: 현재는 아래 데이터를 계산할 방법이 없음. */}
      {/* <div className="mt-10 flex items-center justify-between">
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
      </div> */}

      {kpiLineChartData && <FacilityKPISummaryMixedChart kpiLineChartData={kpiLineChartData} />}

      {kpiHeatMapChartData && <FacilityKPISummaryHeatMapChart kpiHeatMapChartData={kpiHeatMapChartData} />}
    </>
  );
}

export default FacilityKPISummary;
