import SelectBox from '@/components/SelectBox';
// TODO: CSS 모듈화하기
import './HomeWarning.css';

function HomeWarning() {
  return (
    <>
      <div className="my-[14px] flex justify-end gap-[14px]">
        <div className="min-w-60">
          <SelectBox
            options={[
              'All Facilities',
              'Check-in',
              'Boarding Pass Control',
              'Security Control',
              'Passport Control',
            ]}
            defaultValue=""
            className="select-sm"
          />
        </div>
        <div className="min-w-60">
          <SelectBox
            options={['Passenger Throughput', 'Waiting Time', 'Queue Length', 'Facility Efficiency']}
            defaultValue=""
            className="select-sm"
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
