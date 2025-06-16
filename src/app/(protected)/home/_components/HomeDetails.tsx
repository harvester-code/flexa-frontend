'use client';

import { useState } from 'react';
import Image from 'next/image';
import { pascalCase } from 'change-case';
import { ChevronRight, CircleSmall, Clock4, LockOpen } from 'lucide-react';
import { ScenarioData } from '@/types/simulations';
import { useFacilityDetails } from '@/queries/homeQueries';
import { PassengerQueue, PassengerThroughput, RatioIcon01, RatioIcon02, WaitTime } from '@/components/icons';
import { cn } from '@/lib/utils';
import './HomeDetails.css';
import { formatImageSize, formatNumberWithComma, formatPercent, formatTimeTaken, formatUnit } from './HomeFormat';
import HomeLoading from './HomeLoading';
import HomeNoData from './HomeNoData';
import HomeNoScenario from './HomeNoScenario';
import HomeTooltip from './HomeTooltip';

interface HomeDetailsProps {
  scenario: ScenarioData | null;
  calculate_type: string;
  percentile: number | null;
}

function HomeDetails({ scenario, calculate_type, percentile }: HomeDetailsProps) {
  const { data: details, isLoading } = useFacilityDetails({ calculate_type, percentile, scenarioId: scenario?.id });

  const [openIndexes, setOpenIndexes] = useState<number[]>([]);

  const toggleOpen = (index: number) => {
    setOpenIndexes((prev) => {
      if (prev.includes(index)) {
        return prev.filter((i) => i !== index);
      }
      return [...prev, index];
    });
  };

  if (!scenario) {
    return <HomeNoScenario />;
  }

  if (isLoading) {
    return <HomeLoading />;
  }

  if (!details) {
    return <HomeNoData />;
  }

  return (
    <div className="detail-list">
      {details &&
        details?.map(({ category, components, overview }, i) => (
          <div className="detail-item" key={i}>
            <div
              className="mb-2 flex w-max cursor-pointer select-none items-center"
              style={{ color: '#4A5578' }}
              onClick={() => toggleOpen(i)}
            >
              <ChevronRight
                className={cn('mr-1 transition-transform duration-100', openIndexes.includes(i) ? 'rotate-90' : '')}
              />
              <h4 className="text-xl font-semibold">{pascalCase(category)}</h4>
            </div>

            <div className="detail-body">
              <div className="summary">
                <div>
                  {formatImageSize(<LockOpen stroke="#6941c6" />, 30)}
                  <dl>
                    <dt className="flex items-center">
                      <span>Opened</span>
                      <HomeTooltip content="Actual number of activated desks.">
                        <span className="ml-1 size-3 cursor-pointer">ⓘ</span>
                      </HomeTooltip>
                      <CircleSmall className="ml-1 size-3" fill="#9E77ED" stroke="#9E77ED" aria-hidden="true" />
                    </dt>
                    <dd className="!font-semibold">
                      {overview.opened[0]} / {overview.opened[1]}
                      {formatUnit('EA')}
                    </dd>
                  </dl>
                </div>

                <div>
                  {formatImageSize(<PassengerThroughput />, 30)}
                  <dl>
                    <dt>
                      Throughput
                      <HomeTooltip content="Actual number of passengers processed.">
                        <span className="ml-1 size-3 cursor-pointer">ⓘ</span>
                      </HomeTooltip>
                    </dt>
                    <dd className="!font-semibold">
                      {formatNumberWithComma(overview.throughput)}
                      {formatUnit('pax')}
                    </dd>
                  </dl>
                </div>

                <div>
                  {formatImageSize(<PassengerQueue />, 30)}
                  <dl>
                    <dt>
                      Queue Pax
                      <HomeTooltip content="Average/Top (int)% queue passengers">
                        <span className="ml-1 size-3 cursor-pointer">ⓘ</span>
                      </HomeTooltip>
                    </dt>
                    <dd className="!font-semibold">
                      {formatNumberWithComma(overview.queuePax)}
                      {formatUnit('pax')}
                    </dd>
                  </dl>
                </div>

                <div>
                  {formatImageSize(<WaitTime />, 30)}
                  <dl>
                    <dt className="flex items-center">
                      <span>Wait Time</span>
                      <HomeTooltip content="Average/Top (int)% wait time of passengers">
                        <span className="ml-1 size-3 cursor-pointer">ⓘ</span>
                      </HomeTooltip>
                      <CircleSmall className="ml-1 size-3" fill="#9E77ED" stroke="#9E77ED" aria-hidden="true" />
                    </dt>
                    <dd className="!font-semibold">{formatTimeTaken(overview.waitTime)}</dd>
                  </dl>
                </div>
                <div>
                  {formatImageSize(<RatioIcon01 />, 30)}
                  <dl>
                    <dt className="flex items-center">
                      <span>AI Ratio</span>
                      <HomeTooltip content="The ratio of activated capacity to total installed capacity.">
                        <span className="ml-1 size-3 cursor-pointer">ⓘ</span>
                      </HomeTooltip>
                      <CircleSmall className="ml-1 size-3" fill="#9E77ED" stroke="#9E77ED" aria-hidden="true" />
                    </dt>
                    <dd className="!font-semibold">
                      {Math.round(Number(overview.ai_ratio))}
                      {formatUnit('%')}
                    </dd>
                  </dl>
                </div>

                <div>
                  {formatImageSize(<RatioIcon02 />, 30)}
                  <dl>
                    <dt className="flex items-center">
                      <span>PA Ratio</span>
                      <HomeTooltip content="The ratio of processed capacity to total activated capacity.">
                        <span className="ml-1 size-3 cursor-pointer">ⓘ</span>
                      </HomeTooltip>
                      <CircleSmall className="ml-1 size-3" fill="#9E77ED" stroke="#9E77ED" aria-hidden="true" />
                    </dt>
                    <dd className="!font-semibold">
                      {Math.round(Number(overview.pa_ratio))}
                      {formatUnit('%')}
                    </dd>
                  </dl>
                </div>
              </div>

              {openIndexes.includes(i) && (
                <div className="scroll-list">
                  {components.map((comp, j) => {
                    const parts = comp.title.split('_');
                    // NOTE: 코드 순서가 중요
                    const facility = parts.pop();
                    const zone = parts.join('_');

                    return (
                      <div className={cn('scroll-item', comp.opened[0] === 0 && 'closed')} key={j}>
                        <div className="scroll-item-head">
                          <h5>
                            <em>
                              {pascalCase(zone)} {facility}
                            </em>
                            {comp.opened[0] === 0 ? (
                              <span className="stats-close">CLOSED</span>
                            ) : (
                              <span className="stats-open">OPEN</span>
                            )}
                          </h5>
                        </div>

                        <div className="scroll-item-body">
                          <div className="summary-sm disabled">
                            <div>
                              {formatImageSize(<LockOpen stroke="#6941c6" />, 24)}
                              <dl>
                                <dt>Opened</dt>
                                <dd className="!font-semibold">
                                  {comp.opened[0]} / {comp.opened[1]}
                                  {formatUnit('EA')}
                                </dd>
                              </dl>
                            </div>

                            <div>
                              {formatImageSize(<PassengerThroughput />, 24)}
                              <dl>
                                <dt>Throughput</dt>
                                <dd className="!font-semibold">
                                  {formatNumberWithComma(comp.throughput)}
                                  {formatUnit('pax')}
                                </dd>
                              </dl>
                            </div>

                            <div>
                              {formatImageSize(<PassengerQueue />, 24)}
                              <dl>
                                <dt>Queue Pax</dt>
                                <dd className="!font-semibold">
                                  {formatNumberWithComma(comp.queuePax)}
                                  {formatUnit('pax')}
                                </dd>
                              </dl>
                            </div>

                            <div>
                              {formatImageSize(<WaitTime />, 24)}
                              <dl>
                                <dt>Wait Time</dt>
                                <dd className="!font-semibold">{formatTimeTaken(comp.waitTime)}</dd>
                              </dl>
                            </div>

                            <div>
                              {formatImageSize(<RatioIcon01 />, 24)}
                              <dl>
                                <dt>AI Ratio</dt>
                                <dd className="!font-semibold">
                                  {Math.round(Number(comp.ai_ratio))}
                                  {formatUnit('%')}
                                </dd>
                              </dl>
                            </div>

                            <div>
                              {formatImageSize(<RatioIcon02 />, 24)}
                              <dl>
                                <dt>PA Ratio</dt>
                                <dd className="!font-semibold">
                                  {Math.round(Number(comp.pa_ratio))}
                                  {formatUnit('%')}
                                </dd>
                              </dl>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ))}
    </div>
  );
}

export default HomeDetails;
