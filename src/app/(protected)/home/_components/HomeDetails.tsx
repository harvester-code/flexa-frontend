'use client';

import { useState } from 'react';
import Image from 'next/image';
import { pascalCase } from 'change-case';
import { ChevronRight, Clock4, LockOpen, User } from 'lucide-react';
import { Option } from '@/types/commons';
import { ScenarioData } from '@/types/simulations';
import { useFacilityDetails } from '@/queries/homeQueries';
import { cn } from '@/lib/utils';
import './HomeDetails.css';
import HomeLoading from './HomeLoading';
import HomeNoData from './HomeNoData';
import HomeNoScenario from './HomeNoScenario';

interface HomeDetailsProps {
  scenario: ScenarioData | null;
  processes: Option[];
  calculate_type: string;
  percentile: number;
}

function HomeDetails({ scenario, processes, calculate_type, percentile }: HomeDetailsProps) {
  const { data: details, isLoading } = useFacilityDetails({
    calculate_type,
    percentile,
    scenarioId: scenario?.id,
  });

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
                className={cn(
                  'mr-1 transition-transform duration-100',
                  openIndexes.includes(i) ? 'rotate-90' : ''
                )}
              />
              <h4 className="text-xl font-semibold">{pascalCase(category)}</h4>
            </div>

            <div className="detail-body">
              <div className="summary">
                <div>
                  <LockOpen className="size-[1.875rem]" stroke="#6941c6" />
                  <dl>
                    <dt>Opened</dt>
                    <dd className="!font-semibold">
                      {overview.opened[0]} / {overview.opened[1]}
                    </dd>
                  </dl>
                </div>

                <div>
                  <User className="size-[1.875rem]" stroke="#6941c6" />
                  <dl>
                    <dt>Throughput</dt>
                    <dd className="!font-semibold">{overview.throughput}</dd>
                  </dl>
                </div>

                <div>
                  <Image src="/image/ico-main-03.svg" width={30} height={30} alt="" />
                  <dl>
                    <dt>Max Queue</dt>
                    <dd className="!font-semibold">{overview.maxQueue}</dd>
                  </dl>
                </div>

                <div>
                  <Image src="/image/ico-main-03.svg" width={30} height={30} alt="" />
                  <dl>
                    <dt>Queue Pax</dt>
                    <dd className="!font-semibold">{overview.queueLength}</dd>
                  </dl>
                </div>
                <div>
                  <Clock4 className="size-[1.875rem]" stroke="#6941c6" />
                  <dl>
                    <dt>Proc. Time</dt>

                    <dd className="!font-semibold">
                      {overview.procTime?.hour > 0 ? `${overview.procTime?.hour}h` : null}
                      {overview.procTime?.minute > 0 ? `${overview.procTime?.minute}m` : null}
                      {overview.procTime?.second > 0 ? `${overview.procTime?.second}s` : null}
                    </dd>
                  </dl>
                </div>

                <div>
                  <LockOpen className="size-[1.875rem]" stroke="#6941c6" />
                  <dl>
                    <dt>Wait Time</dt>
                    <dd className="!font-semibold">
                      {overview.waitTime?.hour > 0 ? `${overview.waitTime?.hour}h` : null}
                      {overview.waitTime?.minute > 0 ? `${overview.waitTime?.minute}m` : null}
                      {overview.waitTime?.second > 0 ? `${overview.waitTime?.second}s` : null}
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
                      <div className={cn('scroll-item', !comp.isOpened && 'closed')} key={j}>
                        <div className="scroll-item-head">
                          <h5>
                            <em>
                              {pascalCase(zone)} {facility}
                            </em>
                            {!comp.isOpened && <span className="stats-close">CLOSED</span>}
                          </h5>
                        </div>

                        <div className="scroll-item-body">
                          <div className="summary-sm disabled">
                            <div>
                              <LockOpen className="size-6" stroke="#6941c6" />
                              <dl>
                                <dt>Opened</dt>
                                <dd className="!font-semibold">
                                  {comp.opened[0]} / {comp.opened[1]}
                                </dd>
                              </dl>
                            </div>

                            <div>
                              <User className="size-6" stroke="#6941c6" />
                              <dl>
                                <dt>Throughput</dt>
                                <dd className="!font-semibold">{comp.throughput}</dd>
                              </dl>
                            </div>

                            <div>
                              <Image src="/image/ico-main-03.svg" alt="" width={24} height={24} />
                              <dl>
                                <dt>Max Queue</dt>
                                <dd className="!font-semibold">{comp.maxQueue}</dd>
                              </dl>
                            </div>

                            <div>
                              <Image src="/image/ico-main-03.svg" alt="" width={24} height={24} />
                              <dl>
                                <dt>Queue Pax</dt>
                                <dd className="!font-semibold">{comp.queueLength}</dd>
                              </dl>
                            </div>

                            <div>
                              <Clock4 className="size-6" stroke="#6941c6" />
                              <dl>
                                <dt>Proc. Time</dt>
                                <dd className="!font-semibold">
                                  {comp.procTime?.hour > 0 ? `${comp.procTime?.hour}h` : null}
                                  {comp.procTime?.minute > 0 ? `${comp.procTime?.minute}m` : null}
                                  {comp.procTime?.second > 0 ? `${comp.procTime?.second}s` : null}
                                </dd>
                              </dl>
                            </div>

                            <div>
                              <Clock4 className="size-6" stroke="#6941c6" />
                              <dl>
                                <dt>Wait Time</dt>
                                <dd className="!font-semibold">
                                  {comp.waitTime?.hour > 0 ? `${comp.waitTime?.hour}h` : null}
                                  {comp.waitTime?.minute > 0 ? `${comp.waitTime?.minute}m` : null}
                                  {comp.waitTime?.second > 0 ? `${comp.waitTime?.second}s` : null}
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
