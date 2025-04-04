'use client';

import Image from 'next/image';
import Link from 'next/link';
import { pascalCase } from 'change-case';
import { ChevronRight, Clock4, LockOpen, User } from 'lucide-react';
import { ScenarioData } from '@/types/simulations';
import { useFacilityDetails } from '@/queries/homeQueries';
import { cn } from '@/lib/utils';
import './HomeDetails.css';

interface HomeDetailsProps {
  scenario: ScenarioData;
}

function HomeDetails({ scenario }: HomeDetailsProps) {
  const { data: details = [] } = useFacilityDetails({
    // TODO: 아래 값은 Summary에서 받아와야한다.
    calculate_type: 'mean',
    percentile: 0,
    //
    scenarioId: scenario?.id,
  });

  if (!details) return <div>Loading...</div>;

  return (
    <div className="detail-list">
      {details &&
        details?.map(({ category, overview, components }, i) => (
          <div className="detail-item" key={i}>
            <div className="mb-2 flex items-center" style={{ color: '#4A5578' }}>
              <h4 className="mr-1 text-xl font-semibold">{pascalCase(category)}</h4>
              <Link href="/facility">
                <ChevronRight stroke="#4A5578" />
              </Link>
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
                    <dt>Queue Length</dt>
                    <dd className="!font-semibold">{overview.queueLength}</dd>
                  </dl>
                </div>
                <div>
                  <Clock4 className="size-[1.875rem]" stroke="#6941c6" />
                  <dl>
                    <dt>Proc. Time</dt>
                    <dd className="!font-semibold">{overview.procTime}</dd>
                  </dl>
                </div>
                <div>
                  <LockOpen className="size-[1.875rem]" stroke="#6941c6" />
                  <dl>
                    <dt>Waiting Time</dt>
                    <dd className="!font-semibold">{overview.waitTime}</dd>
                  </dl>
                </div>
              </div>

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
                              <dt>Queue Length</dt>
                              <dd className="!font-semibold">{comp.queueLength}</dd>
                            </dl>
                          </div>
                          <div>
                            <Clock4 className="size-6" stroke="#6941c6" />
                            <dl>
                              <dt>Proc. Time</dt>
                              <dd className="!font-semibold">{comp.procTime}</dd>
                            </dl>
                          </div>
                          <div>
                            <Clock4 className="size-6" stroke="#6941c6" />
                            <dl>
                              <dt>Waiting Time</dt>
                              <dd className="!font-semibold">{comp.waitTime}</dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
    </div>
  );
}

export default HomeDetails;
