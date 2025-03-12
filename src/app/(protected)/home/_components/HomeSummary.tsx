import { useState } from 'react';
import Input from '@/components/Input';
import SelectBox from '@/components/SelectBox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip';
// TODO: CSS 모듈화하기
import './HomeSummary.css';

function HomeSummary() {
  const [topValue, setTopValue] = useState('');

  return (
    <>
      <div className="my-[14px] flex justify-end gap-4">
        <div className="min-w-[180px]">
          <SelectBox className="select-sm" options={['Mean', 'Top n%']} defaultValue="" />
        </div>

        <div className="flex items-center gap-1 text-lg font-semibold">
          <span>Top</span>
          <div className="max-w-20">
            <Input
              className="input-rounded text-center text-sm"
              type="text"
              placeholder="0-100"
              value={topValue}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTopValue(e.target.value)}
            />
          </div>
          <span>%</span>
        </div>
      </div>

      <div className="summary-block">
        <div className="summary-left">
          <div className="summary">
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
          </div>
        </div>

        <div className="summary-right">
          <p>KPI</p>
          <div>
            <dl>
              <dt>
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button>Passengers Throughput</button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>
                        <strong>Tool-tip Title</strong>
                        <br />
                        The average or top n% of the total queue count experienced by one passenger across all
                        processes.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </dt>
              <dd>
                41,357 <span className="orange">+8%</span>
              </dd>
            </dl>
            <dl>
              <dt>
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button>Waiting Time</button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>
                        <strong>Tool-tip Title</strong>
                        <br />
                        The average or top n% of the total queue count experienced by one passenger across all
                        processes.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </dt>
              <dd>
                21:31 <span className="red">+15%</span>
              </dd>
            </dl>
            <dl>
              <dt>
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button>Queue Length</button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>
                        <strong>Queue Length</strong>
                        <br />
                        The average or top n% of the total queue count experienced by one passenger across all
                        processes
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </dt>
              <dd>
                271<span className="red">+15%</span>
              </dd>
            </dl>
            <dl>
              <dt>
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button>Facility efficiency</button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>
                        <strong>Tool-tip Title</strong>
                        <br />
                        The average or top n% of the total queue count experienced by one passenger across all
                        processes.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </dt>
              <dd>
                27% <span className="green">+6%</span>
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </>
  );
}

export default HomeSummary;
