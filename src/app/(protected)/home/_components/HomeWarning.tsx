'use client';

import { useMemo, useState } from 'react';
import { pascalCase } from 'change-case';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { ChevronDown } from 'lucide-react';
import { Option } from '@/types/commons';
import { ScenarioData } from '@/types/simulations';
import { useAlertIssues } from '@/queries/homeQueries';
import TheDropdownMenu from '@/components/TheDropdownMenu';
import HomeLoading from './HomeLoading';
import HomeNoData from './HomeNoData';
import HomeNoScenario from './HomeNoScenario';

dayjs.extend(customParseFormat);

const TARGET_OPTIONS = [
  { label: 'Wait Time', value: 'waiting_time' },
  { label: 'Queue Pax', value: 'queue_length' },
];

interface HomeWarningProps {
  scenario: ScenarioData | null;
  processes: Option[];
}

function HomeWarning({ scenario, processes }: HomeWarningProps) {
  const { data: alertIssueData, isLoading } = useAlertIssues({ scenarioId: scenario?.id });

  const PROCESS_OPTIONS = useMemo(
    () => [{ label: 'All Facilities', value: 'all_facilities' }].concat(processes),
    [processes]
  );

  const [facility, setFacility] = useState(PROCESS_OPTIONS[0]);
  const [target, setTarget] = useState(TARGET_OPTIONS[0]);

  if (!scenario) {
    return <HomeNoScenario />;
  }

  if (isLoading) {
    return <HomeLoading />;
  }

  if (!alertIssueData) {
    return <HomeNoData />;
  }

  return (
    <>
      <div className="my-3.5 flex justify-end gap-3.5">
        <TheDropdownMenu
          className="min-w-60 [&>*]:justify-start"
          items={PROCESS_OPTIONS}
          icon={<ChevronDown />}
          label={facility.label}
          onSelect={(opt) => setFacility(opt)}
        />

        <div className="min-w-60">
          <TheDropdownMenu
            className="min-w-60 [&>*]:justify-start"
            items={TARGET_OPTIONS}
            icon={<ChevronDown />}
            label={target.label}
            onSelect={(opt) => setTarget(opt)}
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 rounded-md bg-default-50 p-5">
        {alertIssueData &&
          alertIssueData[facility.value]?.map(({ node, time, waiting_time, queue_length }, i) => {
            const parts = node.split('_');
            // NOTE: 코드 순서가 중요
            const facility = parts.pop();
            const zone = parts.join('_');

            return (
              <div
                className="relative flex flex-col rounded-md border border-default-200 bg-white px-4 py-3"
                key={i}
              >
                <dl className="flex justify-between">
                  <dt className="font-semibold text-default-700">
                    {pascalCase(zone)} {facility} · {dayjs(time, 'HH:mm:ss').format('hh:mm a')}
                  </dt>
                </dl>

                <div className="mt-2 flex justify-end text-4xl font-semibold text-default-900">
                  {target.value === 'waiting_time' ? (
                    <p>
                      {waiting_time.hour > 0 ? (
                        <span>
                          {waiting_time.hour}
                          <span className="text-2xl">h</span>
                        </span>
                      ) : null}

                      {waiting_time.minute > 0 ? (
                        <span>
                          {waiting_time.minute}
                          <span className="text-2xl">m</span>
                        </span>
                      ) : null}

                      {waiting_time.second > 0 ? (
                        <span>
                          {waiting_time.second}
                          <span className="text-2xl">s</span>
                        </span>
                      ) : null}
                    </p>
                  ) : target.value === 'queue_length' ? (
                    <p>
                      {queue_length}
                      <span className="text-2xl"> pax</span>
                    </p>
                  ) : (
                    'Error'
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </>
  );
}

export default HomeWarning;
