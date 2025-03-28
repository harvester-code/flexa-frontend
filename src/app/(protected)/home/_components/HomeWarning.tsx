import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useAlertIssues } from '@/queries/homeQueries';
import AppDropdownMenu from '@/components/AppDropdownMenu';

const PROCESS_OPTIONS = [
  { label: 'All Facilities', value: 'All-Facilities' },
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
  const [selectedFacility, setSelectedFacility] = useState(PROCESS_OPTIONS[0]);
  const [selectedTarget, setSelectedTarget] = useState(TARGET_OPTIONS[0]);

  const { data: alertIssueData } = useAlertIssues({ scenarioId: scenario?.id });

  return (
    <>
      <div className="my-3.5 flex justify-end gap-3.5">
        <AppDropdownMenu
          className="min-w-60 [&>*]:justify-start"
          items={PROCESS_OPTIONS}
          icon={<ChevronDown />}
          label={selectedFacility.label}
          onSelect={(opt) => setSelectedFacility(opt)}
        />

        <div className="min-w-60">
          <AppDropdownMenu
            className="min-w-60 [&>*]:justify-start"
            items={TARGET_OPTIONS}
            icon={<ChevronDown />}
            label={selectedTarget.label}
            onSelect={(opt) => setSelectedTarget(opt)}
          />
        </div>
      </div>

      {/* FIXME: [전달 완료] 데이터 구조 개선하기 */}
      <div className="grid grid-cols-4 gap-4 rounded-md bg-default-50 p-5">
        {alertIssueData &&
          alertIssueData['alert-issues']
            .find((ele) => ele.label === selectedFacility.value)
            ?.data.map((d, i) => (
              <div
                className="relative flex flex-col rounded-md border border-default-200 bg-white px-4 py-3"
                key={i}
              >
                <dl>
                  <dt className="text-xl font-semibold text-default-700">{d.location}</dt>
                  <dd className="font-medium text-default-500">{d.time}</dd>
                </dl>
                <p className="mt-2 flex justify-end text-4xl font-semibold text-default-900">{d.wait_time}</p>
              </div>
            ))}
      </div>
    </>
  );
}

export default HomeWarning;
