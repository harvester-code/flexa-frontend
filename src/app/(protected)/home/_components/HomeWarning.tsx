import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import AppDropdownMenu from '@/components/AppDropdownMenu';
// TODO: CSS 모듈화하기
import './HomeWarning.css';

// TODO: 동적으로 수정하기
const FACILITY_OPTIONS = [
  { label: 'All Facilities', value: 'All Facilities' },
  { label: 'Check-in', value: 'Check-in' },
  { label: 'Boardingpass Control', value: 'Boardingpass Control' },
  { label: 'Security Control', value: 'Security Control' },
  { label: 'Passport Control', value: 'Passport Control' },
];

const TARGET_OPTIONS = [
  { label: 'Passenger Throughput', value: 'Passenger Throughput' },
  { label: 'Wait Time', value: 'Wait Time' },
  { label: 'Queue Length', value: 'Queue Length' },
];

function HomeWarning() {
  const [selectedFacility, setSelectedFacility] = useState(FACILITY_OPTIONS[0]);
  const [selectedTarget, setSelectedTarget] = useState(TARGET_OPTIONS[0]);

  return (
    <>
      <div className="my-[14px] flex justify-end gap-[14px]">
        <AppDropdownMenu
          className="min-w-60 [&>*]:justify-start"
          items={FACILITY_OPTIONS}
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
        <div className="issue">
          <dl>
            <dt>Check-In C</dt>
            <dd>07:30 AM</dd>
          </dl>
          <p className="time">41:22</p>
          <p className="percent red">+12%</p>
        </div>
        <div className="issue">
          <dl>
            <dt>Check-In B</dt>
            <dd>06:50 AM</dd>
          </dl>
          <p className="time">39:03</p>
          <p className="percent red">+15%</p>
        </div>
        <div className="issue">
          <dl>
            <dt>DG5</dt>
            <dd>07:00 AM</dd>
          </dl>
          <p className="time">33:21</p>
          <p className="percent red">+15%</p>
        </div>
        <div className="issue">
          <dl>
            <dt>DG5</dt>
            <dd>07:00 AM</dd>
          </dl>
          <p className="time">33:21</p>
          <p className="percent red">+15%</p>
        </div>
        <div className="issue">
          <dl>
            <dt>DG5</dt>
            <dd>07:00 AM</dd>
          </dl>
          <p className="time">33:21</p>
          <p className="percent red">+15%</p>
        </div>
        <div className="issue">
          <dl>
            <dt>DG2</dt>
            <dd>07:00 AM</dd>
          </dl>
          <p className="time">39:03</p>
          <p className="percent red">+15%</p>
        </div>
        <div className="issue">
          <dl>
            <dt>DG2</dt>
            <dd>07:00 AM</dd>
          </dl>
          <p className="time">39:03</p>
          <p className="percent orange">+8%</p>
        </div>
        <div className="issue">
          <dl>
            <dt>DG2</dt>
            <dd>07:00 AM</dd>
          </dl>
          <p className="time">20:28</p>
          <p className="percent orange">+8%</p>
        </div>
      </div>
    </>
  );
}

export default HomeWarning;
