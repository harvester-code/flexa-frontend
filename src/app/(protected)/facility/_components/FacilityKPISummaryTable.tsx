import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useKPISummary } from '@/queries/facilityQueries';
import TheDropdownMenu from '@/components/TheDropdownMenu';
import TheTable from '@/components/TheTable';
import HomeLoading from '../../home/_components/HomeLoading';
import HomeNoData from '../../home/_components/HomeNoData';
import HomeNoScenario from '../../home/_components/HomeNoScenario';

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
  scenarioId?: string;
}

function FacilityKPISummaryTable({ scenarioId, process }: FacilityKPISummaryTableProps) {
  const [kpiFunc, setKPIFunc] = useState(STATS_OPTIONS[0]);

  const { data: kpiSummaryData, isLoading } = useKPISummary({
    scenarioId,
    process,
    func: kpiFunc.value,
  });

  console.log(scenarioId);

  if (!scenarioId) {
    return <HomeNoScenario />;
  }

  if (isLoading) {
    return <HomeLoading />;
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
          <TheDropdownMenu
            className="min-w-[120px]"
            icon={<ChevronDown />}
            items={STATS_OPTIONS}
            label={kpiFunc.label}
            onSelect={setKPIFunc}
          />
        </div>
      </div>

      {kpiSummaryData ? <TheTable data={kpiSummaryData} /> : <HomeNoData />}
    </>
  );
}

export default FacilityKPISummaryTable;
