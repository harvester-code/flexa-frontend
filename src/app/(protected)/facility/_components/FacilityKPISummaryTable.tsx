import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useKPISummary } from '@/queries/facilityQueries';
import AppDropdownMenu from '@/components/AppDropdownMenu';
import AppTable from '@/components/Table';
import FacilityKPISummaryTableLoading from './FacilityKPISummaryTableLoading';

const STATS_OPTIONS = [
  { label: 'Top 5%', value: 'top5' },
  { label: 'Bottom 5%', value: 'bottom5' },
  { label: 'Mean', value: 'mean' },
  { label: 'Median', value: 'median' },
  { label: 'Maximum', value: 'max' },
  { label: 'Minimum', value: 'min' },
];

interface FacilityKPISummaryTableProps {
  process?: string;
  scenarioId: string;
}

function FacilityKPISummaryTable({ scenarioId, process }: FacilityKPISummaryTableProps) {
  const [kpiFunc, setKPIFunc] = useState(STATS_OPTIONS[0]);

  const { data: kpiSummaryData } = useKPISummary({
    scenarioId,
    process,
    func: kpiFunc.value,
  });

  if (!kpiSummaryData) {
    return <FacilityKPISummaryTableLoading />;
  }

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
            onSelect={setKPIFunc}
          />
        </div>
      </div>
      <AppTable data={kpiSummaryData} />
    </>
  );
}

export default FacilityKPISummaryTable;
