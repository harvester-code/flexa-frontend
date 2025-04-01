'use client';

import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
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
  { label: 'Passenger Throughput', value: 'Passenger Throughput' },
  { label: 'Wait Time', value: 'Wait Time' },
  { label: 'Queue Length', value: 'Queue Length' },
];

interface HomeWarningProps {
  scenario: any;
}

function HomeWarning({ scenario }: HomeWarningProps) {
  // FIXME: 병하대리님께 재수정 요청
  const { data: { data: alertIssueData } = {} } = useAlertIssues({ scenarioId: scenario?.id });

  const [target, setTarget] = useState(TARGET_OPTIONS[0]);
  const [facility, setFacility] = useState(PROCESS_OPTIONS[0]);
  const [tmpData, setTmpData] = useState<any[]>([]);

  useEffect(() => {
    if (!alertIssueData) return;
    // FIXME: 병하대리님께 재수정 요청
    const result = alertIssueData.find((data) => Object.hasOwn(data, facility.value));
    setTmpData(result[facility.value]);
  }, [facility, alertIssueData]);

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
        {/* FIXME: 병하대리님께 재수정 요청 */}
        {tmpData &&
          tmpData.map((d, i) => (
            <div
              className="relative flex flex-col rounded-md border border-default-200 bg-white px-4 py-3"
              key={i}
            >
              <dl>
                <dt className="text-xl font-semibold text-default-700">{d.node}</dt>
                <dd className="font-medium text-default-500">{d.time}</dd>
              </dl>
              <p className="mt-2 flex justify-end text-4xl font-semibold text-default-900">{d.waiting_time}</p>
            </div>
          ))}
      </div>
    </>
  );
}

export default HomeWarning;
