import Image from 'next/image';
import Button from '@/components/Button';
// TODO: CSS 모듈화하기
import './SelectBlock.css';

function SelectBlock() {
  return (
    <div className="selected-block">
      <dl>
        <dt>Selected</dt>
        <dd>
          <ul>
            <li>
              <button>Type &gt; Actual</button>
            </li>
            <li>
              <button>Date &gt; Oct 14, 2024 - Oct 15, 2024</button>
            </li>
            <li>
              <button>Terminal &gt; T1</button>
            </li>
            <li>
              <button>Type &gt; Actual</button>
            </li>
            <li>
              <button>Date &gt; Oct 14, 2024 - Oct 15, 2024</button>
            </li>
            <li>
              <button>Terminal &gt; T1</button>
            </li>
          </ul>
        </dd>
      </dl>
      <div className="flex items-center gap-2.5">
        <Button
          className="btn-md btn-default"
          icon={<Image src="/image/ico-filter.svg" alt="filter" width={24} height={24} />}
          text="Fliter Details"
          onClick={() => {}}
        />
        <Button className="btn-md btn-primary" text="See Results" onClick={() => {}} />
      </div>
    </div>
  );
}

export default SelectBlock;
