'use client';

import { ScenarioData } from '@/types/simulations';
import { useSummaries } from '@/queries/homeQueries';
import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import HomeLoading from './HomeLoading';
import HomeNoData from './HomeNoData';
import HomeNoScenario from './HomeNoScenario';

const TOOLTIP_MAP = {
  'Passenger Throughput': 'The number of all passengers processed in a day',
  'Wait Time': 'Average (or top n%) wait time experienced by passengers across all checkpoints',
  'Queue Pax': 'Average (or top n%) queue experienced by passengers across all checkpoints',
  'Facility Utilization': 'Percentage of time during the day that the facility is operational',
};

interface HomeSummaryProps {
  scenario: ScenarioData | null;
  calculate_type: string;
  percentile: number;
}

function HomeSummary({ scenario, calculate_type, percentile }: HomeSummaryProps) {
  const { data: summaries, isLoading } = useSummaries({ calculate_type, percentile, scenarioId: scenario?.id });

  if (!scenario) {
    return <HomeNoScenario />;
  }

  if (isLoading) {
    return <HomeLoading />;
  }

  if (!summaries) {
    return <HomeNoData />;
  }

  return (
    <div className="my-[14px] flex overflow-auto">
      {/* ==================== NORMAL ==================== */}
      <div className="flex flex-1 flex-col gap-y-5 font-medium">
        <div className="flex h-full">
          <div className="flex w-[25rem] rounded-lg border border-default-200 px-4 py-5">
            <dl className="flex w-1/2 flex-col justify-between">
              <dt>{summaries?.normal[0].title}</dt>
              <dd className="text-end text-[2.5rem] font-semibold">
                {summaries?.normal[0].value.toLocaleString()}
              </dd>
            </dl>

            <div className="mx-5 w-0.5 bg-default-200"></div>

            <dl className="flex w-1/2 flex-col justify-between">
              <dt>{summaries?.normal[1].title}</dt>
              <dd className="text-end text-[2.5rem] font-semibold">
                {summaries?.normal[1].value.toLocaleString()}
              </dd>
            </dl>
          </div>

          <div className="mx-5 min-w-[12.5rem] rounded-lg border border-default-200 px-4 py-5">
            <dl className="flex h-full flex-col justify-between">
              <dt>{summaries?.normal[2].title}</dt>
              <dd className="text-end text-[2.5rem] font-semibold">
                {summaries?.normal[2].value[0]} / {summaries?.normal[2].value[1].toLocaleString()}
              </dd>
            </dl>
          </div>
        </div>

        <div className="flex h-full">
          <div className="flex w-[25rem] rounded-lg border border-default-200 px-4 py-5">
            <dl className="flex w-1/2 flex-col justify-between">
              <dt>{summaries?.normal[3].title}</dt>
              <dd className="text-end text-[2.5rem] font-semibold">
                {summaries?.normal[3].value.toLocaleString()}
              </dd>
            </dl>

            <div className="mx-5 w-0.5 bg-default-200"></div>

            <dl className="flex w-1/2 flex-col justify-between">
              <dt>{summaries?.normal[4].title}</dt>
              <dd className="text-end text-[2.5rem] font-semibold">
                {summaries?.normal[4].value.toLocaleString()}
              </dd>
            </dl>
          </div>

          <div className="mx-5 min-w-[12.5rem] rounded-lg border border-default-200 px-4 py-5">
            <dl className="flex h-full flex-col justify-between">
              <dt>{summaries?.normal[5].title}</dt>
              <dd className="mt-14 text-end text-[2.5rem] font-semibold">
                {summaries?.normal[5].value.toLocaleString()}
              </dd>
            </dl>
          </div>
        </div>
      </div>

      {/* ==================== KPI ==================== */}
      <div className="min-w-fit flex-1 rounded-lg border border-accent-300 bg-accent-50 px-5 py-3">
        <p className="mb-2.5 text-xl font-semibold leading-6">KPI</p>
        <div className="grid grid-cols-2 grid-rows-2 gap-5">
          {summaries &&
            summaries?.kpi.map(({ title, value }, i) => (
              <dl className="rounded-lg bg-white p-4" key={i}>
                <dt>
                  <TooltipProvider delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="text-lg font-medium leading-5">{title}</button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="right"
                        className="max-w-56 border border-default-200 bg-white px-2 py-4 text-black"
                      >
                        <p className="mb-2">
                          <strong>{title}</strong>
                        </p>
                        <p>{TOOLTIP_MAP[title]}</p>
                        <TooltipArrow
                          className="-my-px border-none fill-[#fff] drop-shadow-[0_1px_0_var(--default-200)]"
                          aria-hidden="true"
                        />
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </dt>

                <dd className="pt-8 text-end text-[2.5rem] font-semibold leading-[2.75rem]">
                  {Number.isInteger(value)
                    ? value.toLocaleString()
                    : `${value.hour > 0 ? `${value.hour}h ` : ''} ${value.minute > 0 ? `${value.minute}m ` : ''} ${value.second > 0 ? `${value.second}s` : ''}`.trim()}
                </dd>
              </dl>
            ))}
        </div>
      </div>
    </div>
  );
}

export default HomeSummary;
