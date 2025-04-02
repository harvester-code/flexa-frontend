'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { ScenarioData } from '@/types/simulations';
import { useSummaries } from '@/queries/homeQueries';
import Input from '@/components/Input';
import TheDropdownMenu from '@/components/TheDropdownMenu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip';

const KPI_FUNCS = [
  { label: 'Mean', value: 'mean' },
  { label: 'Top N%', value: 'topN' },
];

interface HomeSummaryProps {
  scenario: ScenarioData;
}

function HomeSummary({ scenario }: HomeSummaryProps) {
  const [topValue, setTopValue] = useState(0);
  const [kpiFunc, setKPIFunc] = useState(KPI_FUNCS[0]);

  const { data: summaries } = useSummaries({
    calculate_type: kpiFunc.value,
    percentile: topValue,
    scenarioId: scenario?.id,
  });

  if (!summaries) return <div>Loading...</div>;

  return (
    <>
      <div className="my-[14px] flex justify-end gap-4">
        <TheDropdownMenu
          className="min-w-[180px] [&>*]:justify-start"
          items={KPI_FUNCS}
          icon={<ChevronDown />}
          label={kpiFunc.label}
          onSelect={(opt) => setKPIFunc(opt)}
        />

        {kpiFunc.value === 'topN' && (
          <div className="flex items-center gap-1 text-lg font-semibold">
            <span>Top</span>
            <div className="max-w-20">
              {/* FIXME: 컴포넌트 수정하기 */}
              <Input
                className="input-rounded text-center text-sm"
                type="text"
                placeholder="0-100"
                value={topValue.toString()}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTopValue(Number(e.target.value))}
              />
            </div>
            <span>%</span>
          </div>
        )}
      </div>

      <div className="flex overflow-auto">
        <div className="flex flex-1 flex-col gap-y-5">
          <div className="flex h-full">
            <div className="flex w-[25rem] rounded-lg border border-default-200 p-4">
              <dl className="w-full">
                <dt>{summaries.normal[0].title}</dt>
                <dd className="mt-14 text-end text-[2.5rem]">
                  {Number(summaries.normal[0].value).toLocaleString()}
                </dd>
              </dl>

              <div className="mx-5 h-full w-0.5 bg-default-200"></div>

              <dl className="w-full">
                <dt>{summaries.normal[1].title}</dt>
                <dd className="mt-14 text-end text-[2.5rem]">
                  {Number(summaries.normal[1].value).toLocaleString()}
                </dd>
              </dl>
            </div>

            <div className="mx-5 min-w-[12.5rem] rounded-lg border border-default-200 p-4">
              <dl>
                <dt>{summaries.normal[2].title}</dt>
                <dd className="mt-14 text-end text-[2.5rem]">
                  {summaries.normal[2].value[0]} / {summaries.normal[2].value[1]}
                </dd>
              </dl>
            </div>
          </div>

          <div className="flex h-full">
            <div className="flex w-[25rem] rounded-lg border border-default-200 p-4">
              <dl className="w-full">
                <dt>{summaries.normal[3].title}</dt>
                <dd className="mt-14 text-end text-[2.5rem]">
                  {Number(summaries.normal[3].value).toLocaleString()}
                </dd>
              </dl>

              <div className="mx-5 h-full w-0.5 bg-default-200"></div>

              <dl className="w-full">
                <dt>{summaries.normal[4].title}</dt>
                <dd className="mt-14 text-end text-[2.5rem]">
                  {Number(summaries.normal[4].value).toLocaleString()}
                </dd>
              </dl>
            </div>

            <div className="mx-5 min-w-[12.5rem] rounded-lg border border-default-200 p-4">
              <dl>
                <dt>{summaries.normal[5].title}</dt>
                <dd className="mt-14 text-end text-[2.5rem]">
                  {Number(summaries.normal[5].value).toLocaleString()}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="min-w-fit flex-1 rounded-lg border border-accent-300 bg-accent-50 px-5 py-3">
          <p className="mb-2.5 text-xl font-semibold">KPI</p>
          <div className="grid grid-cols-2 grid-rows-2 gap-5">
            {summaries &&
              summaries.kpi.map(({ title, value }, i) => (
                <dl className="rounded-lg bg-white p-4" key={i}>
                  <dt>
                    {/* TODO: Tooltip 마무리하기 */}
                    <TooltipProvider delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="text-lg">{title}</button>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p>
                            <strong>Tool-tip Title</strong>
                            <br />
                            The average or top n% of the total queue count experienced by one passenger across
                            all processes.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </dt>
                  <dd className="mt-10 text-[2.5rem]">{value}</dd>
                </dl>
              ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default HomeSummary;
