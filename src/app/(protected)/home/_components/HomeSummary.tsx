import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useSummaries } from '@/queries/homeQueries';
import AppDropdownMenu from '@/components/AppDropdownMenu';
import Input from '@/components/Input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip';
// TODO: CSS 모듈화하기
import './HomeSummary.css';

interface HomeSummaryProps {
  scenario: any;
}

const KPI_FUNCS = [
  { label: 'Mean', value: 'mean' },
  { label: 'Top N%', value: 'topN' },
];

function HomeSummary({ scenario }: HomeSummaryProps) {
  const [topValue, setTopValue] = useState(0);
  const [kpiFunc, setKPIFunc] = useState(KPI_FUNCS[0]);

  const { data: summaryData } = useSummaries({
    calculate_type: kpiFunc.value,
    percentile: topValue,
    scenarioId: scenario?.id,
  });

  return (
    <>
      <div className="my-[14px] flex justify-end gap-4">
        <AppDropdownMenu
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

      <div className="summary-block">
        <div className="summary-left">
          {
            // FIXME: [전달 완료] 아래 데이터 구조 개선 이야기하기
            summaryData &&
              summaryData.summary[0].data.map((d, idx) => (
                <div className="summary" key={idx}>
                  <dl>
                    <dt>{d.title}</dt>
                    <dd>{d.value}</dd>
                  </dl>
                </div>
              ))
          }
          {/* <div className="summary">
            <dl>
              <dt>Departure Flights</dt>
              <dd>306</dd>
            </dl>
            <dl>
              <dt>Arrival Flights</dt>
              <dd>311</dd>
            </dl>
          </div>
          <div className="summary">
            <dl>
              <dt>Delay / Return</dt>
              <dd>41 / 3</dd>
            </dl>
          </div>
          <div className="summary">
            <dl>
              <dt>Departure Passengers</dt>
              <dd>41,357</dd>
            </dl>
            <dl>
              <dt>Arrival Passengers</dt>
              <dd>44,386</dd>
            </dl>
          </div>
          <div className="summary">
            <dl>
              <dt>Transfer Passengers</dt>
              <dd className="text-default-300">N/A</dd>
            </dl>
          </div> */}
        </div>

        <div className="summary-right">
          <p>KPI</p>
          <div>
            {summaryData &&
              summaryData.summary[1].data.map((d, i) => (
                <dl key={i}>
                  <dt>
                    <TooltipProvider delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button>{d.title}</button>
                        </TooltipTrigger>
                        {/* TODO: [전달 완료] 아래 Description에 대한 데이터 필요 */}
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
                  <dd>{d.value}</dd>
                </dl>
              ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default HomeSummary;
