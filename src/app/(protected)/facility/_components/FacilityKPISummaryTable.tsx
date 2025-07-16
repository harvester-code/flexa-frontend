import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useKPISummary } from '@/queries/facilityQueries';
import TheDropdownMenu from '@/components/TheDropdownMenu';
import TheInput from '@/components/TheInput';
import TheTable from '@/components/TheTable';
import { useDebounce } from '@/hooks/useDebounce';
import HomeLoading from '../../home/_components/HomeLoading';
import HomeNoData from '../../home/_components/HomeNoData';
import HomeNoScenario from '../../home/_components/HomeNoScenario';

const STATS_OPTIONS = [
  { label: 'Mean', value: 'mean' },
  { label: 'Top N%', value: 'top' },
];

interface FacilityKPISummaryTableProps {
  process?: string;
  scenarioId?: string;
}

function FacilityKPISummaryTable({ scenarioId, process }: FacilityKPISummaryTableProps) {
  const [kpiFunc, setKPIFunc] = useState(STATS_OPTIONS[0]);
  const [percentile, setPercentile] = useState(5);
  const debouncedPercentile = useDebounce(percentile, 300);

  const { data: kpiSummaryData, isLoading } = useKPISummary({
    scenarioId,
    process,
    func: kpiFunc.value,
    percentile: debouncedPercentile,
  });

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
            Analyze the performance of the selected Check-In facility by KPI. You can check individual counters, desk,
            machine through the filter at the top right.
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

          {kpiFunc.value === 'top' && (
            <div className="ml-4 flex items-center gap-1 text-lg font-semibold">
              <span>Top</span>
              <div className="max-w-20">
                {/* FIXME: 컴포넌트 수정하기 */}
                <TheInput
                  className="input-rounded text-center text-sm"
                  type="text"
                  placeholder="0-100"
                  value={percentile.toString()}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPercentile(Number(e.target.value))}
                />
              </div>
              <span>%</span>
            </div>
          )}
        </div>
      </div>

      {kpiSummaryData ? <TheTable data={kpiSummaryData} /> : <HomeNoData />}
    </>
  );
}

export default FacilityKPISummaryTable;
