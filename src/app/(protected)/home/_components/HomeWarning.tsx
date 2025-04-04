'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { ScenarioData } from '@/types/simulations';
import { useAlertIssues } from '@/queries/homeQueries';
import TheDropdownMenu from '@/components/TheDropdownMenu';

const PROCESS_OPTIONS = [
  { label: 'All Facilities', value: 'all_facilities' },
  // TODO: 아래 데이터는 동적으로 달라짐
  { label: 'Check-in', value: 'checkin' },
  { label: 'Departure Gate', value: 'departure_gate' },
  { label: 'Security Control', value: 'security' },
  { label: 'Passport Control', value: 'passport' },
];

const TARGET_OPTIONS = [
  { label: 'Wait Time', value: 'waiting_time' },
  { label: 'Queue Length', value: 'queue_length' },
];

interface HomeWarningProps {
  scenario: ScenarioData;
}

function HomeWarning({ scenario }: HomeWarningProps) {
  const { data: alertIssueData = {} } = useAlertIssues({ scenarioId: scenario?.id });

  const [facility, setFacility] = useState(PROCESS_OPTIONS[0]);
  const [target, setTarget] = useState(TARGET_OPTIONS[0]);

  if (!alertIssueData) return <div>Loading...</div>;

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
          alertIssueData[facility.value]?.map(({ node, time, waiting_time, queue_length }, i) => (
            <div
              className="relative flex flex-col rounded-md border border-default-200 bg-white px-4 py-3"
              key={i}
            >
              <dl>
                <dt className="text-xl font-semibold text-default-700">{node}</dt>
                <dd className="font-medium text-default-500">{time}</dd>
              </dl>
              {/* HACK: 추후에 데이터 구조를 바꿔야함 */}
              <p className="mt-2 flex justify-end text-4xl font-semibold text-default-900">
                {target.value === 'waiting_time'
                  ? waiting_time
                  : target.value === 'queue_length'
                    ? queue_length
                    : 'Error'}
              </p>
            </div>
          ))}
      </div>
    </>
  );
}

export default HomeWarning;
