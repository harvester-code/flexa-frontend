import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useAlertIssues } from '@/queries/homeQueries';
import AppDropdownMenu from '@/components/AppDropdownMenu';
// TODO: CSS 모듈화하기
import './HomeWarning.css';

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
      <div className="my-[14px] flex justify-end gap-[14px]">
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

      <div className="issues-list">
        {/* FIXME: [전달 완료] 데이터 구조 개선하기 */}
        {alertIssueData &&
          alertIssueData['alert-issues']
            .find((ele) => ele.label === selectedFacility.value)
            ?.data.map((d, i) => (
              <div className="issue" key={i}>
                <dl>
                  <dt>{d.location}</dt>
                  <dd>{d.time}</dd>
                </dl>
                <p className="time">{d.wait_time}</p>
                <p className="percent red">+15%</p>
              </div>
            ))}
      </div>
    </>
  );
}

export default HomeWarning;
