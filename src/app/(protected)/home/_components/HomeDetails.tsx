'use client';

import { useState } from 'react';
import Image from 'next/image';
import { pascalCase } from 'change-case';
import { ChevronRight, Clock4, LockOpen } from 'lucide-react';
import { ScenarioData } from '@/types/homeTypes';
import { PassengerQueue, PassengerThroughput, RatioIcon01, RatioIcon02, WaitTime } from '@/components/icons';
import { cn } from '@/lib/utils';
import { formatImageSize, formatNumberWithComma, formatPercent, formatTimeTaken, formatUnit } from './HomeFormat';
import HomeLoading from './HomeLoading';
import HomeNoData from './HomeNoData';
import HomeNoScenario from './HomeNoScenario';
import HomeTooltip from './HomeTooltip';

interface HomeDetailsProps {
  scenario: ScenarioData | null;
  percentile: number | null;
  data?: any; // 배치 API에서 받은 facility_details 데이터
  isLoading?: boolean; // 배치 API 로딩 상태
}

// Tooltip helper
const getTooltipText = (type: string, percentile: number | null, base: string) => {
  if (type === 'mean') return `Average ${base}`;
  if (type === 'top' && percentile) return `Top ${percentile}% ${base}`;
  return base;
};

function HomeDetails({ scenario, percentile, data, isLoading: propIsLoading }: HomeDetailsProps) {
  // 부모 컴포넌트에서 데이터를 받아서 사용 (개별 API 호출 제거)
  const details = data;
  const isLoading = propIsLoading || false;

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
      {details && Array.isArray(details) &&
        details.map(({ category, components, overview }, i) => (
          <div className="detail-item" key={i}>
            <div
              className="mb-2 flex w-max cursor-pointer select-none items-center text-muted-foreground"
              onClick={() => toggleOpen(i)}
            >
              <ChevronRight
                className={cn('mr-1 transition-transform duration-100', openIndexes.includes(i) ? 'rotate-90' : '')}
              />
              <h4 className="text-lg font-semibold">{pascalCase(category)}</h4>
            </div>

            <div className="detail-body">
              <div className="summary grid w-full grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {/* Opened */}
                <div className="flex min-h-[50px] flex-col justify-center rounded-md border border-input bg-white p-1 xl:min-h-[60px] xl:p-2">
                  <div className="flex h-full flex-row items-center justify-center gap-3">
                    {formatImageSize(<LockOpen />, 30)}
                    <dl className="flex flex-col justify-center">
                      <dt className="flex items-center">
                        <span>Opened</span>
                        <HomeTooltip content="Actual number of activated desks.">
                          <span className="ml-1 size-3 cursor-pointer">ⓘ</span>
                        </HomeTooltip>
                      </dt>
                      <dd className="text-lg font-semibold">
                        {overview?.opened?.[0] || 0} / {overview?.opened?.[1] || 0}
                        {formatUnit('EA')}
                      </dd>
                    </dl>
                  </div>
                </div>
                {/* Throughput */}
                <div className="flex min-h-[50px] flex-col justify-center rounded-md border border-input bg-white p-1 xl:min-h-[60px] xl:p-2">
                  <div className="flex h-full flex-row items-center justify-center gap-3">
                    {formatImageSize(<PassengerThroughput />, 30)}
                    <dl className="flex flex-col justify-center">
                      <dt className="flex items-center">
                        Throughput
                        <HomeTooltip content="Actual number of passengers processed.">
                          <span className="ml-1 size-3 cursor-pointer">ⓘ</span>
                        </HomeTooltip>
                      </dt>
                      <dd className="text-lg font-semibold">
                        {formatNumberWithComma(overview?.throughput || 0)}
                        {formatUnit('pax')}
                      </dd>
                    </dl>
                  </div>
                </div>
                {/* Wait Time */}
                <div className="flex min-h-[50px] flex-col justify-center rounded-md border border-input bg-white p-1 xl:min-h-[60px] xl:p-2">
                  <div className="flex h-full flex-row items-center justify-center gap-3">
                    <div className="relative flex items-center">
                      {formatImageSize(<WaitTime />, 30)}
                      <span className="absolute -top-3.5 left-1/2 z-10 inline-flex h-3.5 -translate-x-1/2 items-center justify-center rounded border border-primary bg-primary px-1 text-xs font-medium leading-none text-primary-foreground">
                        {percentile ? 'Top' : 'Mean'}
                      </span>
                    </div>
                    <dl className="flex flex-col justify-center">
                      <dt className="flex items-center gap-1">
                        <span>Wait Time</span>
                        <HomeTooltip content={getTooltipText(percentile ? 'top' : 'mean', percentile, 'wait time of passengers')}>
                          <span className="ml-1 size-3 cursor-pointer">ⓘ</span>
                        </HomeTooltip>
                      </dt>
                      <dd className="text-lg font-semibold">{formatTimeTaken(overview?.waitTime || 0)}</dd>
                    </dl>
                  </div>
                </div>
                {/* Queue Pax */}
                <div className="flex min-h-[50px] flex-col justify-center rounded-md border border-input bg-white p-1 xl:min-h-[60px] xl:p-2">
                  <div className="flex h-full flex-row items-center justify-center gap-3">
                    <div className="relative flex items-center">
                      {formatImageSize(<PassengerQueue />, 30)}
                      <span className="absolute -top-3.5 left-1/2 z-10 inline-flex h-3.5 -translate-x-1/2 items-center justify-center rounded border border-primary bg-primary px-1 text-xs font-medium leading-none text-primary-foreground">
                        {percentile ? 'Top' : 'Mean'}
                      </span>
                    </div>
                    <dl className="flex flex-col justify-center">
                      <dt className="flex items-center gap-1">
                        <span>Queue Pax</span>
                        <HomeTooltip content={getTooltipText(percentile ? 'top' : 'mean', percentile, 'queue passengers')}>
                          <span className="ml-1 size-3 cursor-pointer">ⓘ</span>
                        </HomeTooltip>
                      </dt>
                      <dd className="text-lg font-semibold">
                        {formatNumberWithComma(overview?.queuePax || 0)}
                        {formatUnit('pax')}
                      </dd>
                    </dl>
                  </div>
                </div>
                {/* Facility Effi. */}
                <div className="flex min-h-[50px] flex-col justify-center rounded-md border border-input bg-white p-1 xl:min-h-[60px] xl:p-2">
                  <div className="flex h-full flex-row items-center justify-center gap-3">
                    {formatImageSize(<RatioIcon01 />, 30)}
                    <dl className="flex flex-col justify-center">
                      <dt className="flex items-center">
                        <span>Facility Effi.</span>
                        <HomeTooltip content="The ratio of activated capacity to total installed capacity.">
                          <span className="ml-1 size-3 cursor-pointer">ⓘ</span>
                        </HomeTooltip>
                      </dt>
                      <dd className="text-lg font-semibold">
                        {Math.round(Number(overview?.facility_effi || 0))}
                        {formatUnit('%')}
                      </dd>
                    </dl>
                  </div>
                </div>
                {/* Workforce Effi. */}
                <div className="flex min-h-[50px] flex-col justify-center rounded-md border border-input bg-white p-1 xl:min-h-[60px] xl:p-2">
                  <div className="flex h-full flex-row items-center justify-center gap-3">
                    {formatImageSize(<RatioIcon02 />, 30)}
                    <dl className="flex flex-col justify-center">
                      <dt className="flex items-center">
                        <span>Workforce Effi.</span>
                        <HomeTooltip content="The ratio of processed capacity to total activated capacity.">
                          <span className="ml-1 size-3 cursor-pointer">ⓘ</span>
                        </HomeTooltip>
                      </dt>
                      <dd className="text-lg font-semibold">
                        {Math.round(Number(overview?.workforce_effi || 0))}
                        {formatUnit('%')}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>

              {openIndexes.includes(i) && components && (
                <div className="scroll-list">
                  {components.map((comp, j) => {
                    const parts = comp?.title?.split('_') || [];
                    // NOTE: 코드 순서가 중요
                    const facility = parts.pop() || '';
                    const zone = parts.join('_') || '';

                    return (
                      <div className={cn('scroll-item', comp?.opened?.[0] === 0 && 'closed')} key={j}>
                        <div className="scroll-item-head">
                          <h5>
                            <em>
                              {pascalCase(zone)} {facility}
                            </em>
                            {comp?.opened?.[0] === 0 ? (
                              <span className="stats-close">CLOSED</span>
                            ) : (
                              <span className="stats-open">OPEN</span>
                            )}
                          </h5>
                        </div>

                        <div className="scroll-item-body">
                          <div className="summary-sm disabled">
                            <div>
                              {formatImageSize(<LockOpen />, 24)}
                              <dl>
                                <dt>Opened</dt>
                                <dd className="!font-semibold">
                                  {comp?.opened?.[0] || 0} / {comp?.opened?.[1] || 0}
                                  {formatUnit('EA')}
                                </dd>
                              </dl>
                            </div>

                            <div>
                              {formatImageSize(<PassengerThroughput />, 24)}
                              <dl>
                                <dt>Throughput</dt>
                                <dd className="!font-semibold">
                                  {formatNumberWithComma(comp?.throughput || 0)}
                                  {formatUnit('pax')}
                                </dd>
                              </dl>
                            </div>

                            <div>
                              <div className="relative inline-block">
                                {formatImageSize(<PassengerQueue />, 24)}
                                <span className="absolute -top-3 left-1/2 z-10 inline-flex h-3 min-w-4 -translate-x-1/2 items-center justify-center rounded border border-primary bg-primary px-0.5 text-xs font-medium leading-none text-primary-foreground">
                                  {percentile ? 'Top' : 'Mean'}
                                </span>
                              </div>
                              <dl>
                                <dt>Queue Pax</dt>
                                <dd className="!font-semibold">
                                  {formatNumberWithComma(comp?.queuePax || 0)}
                                  {formatUnit('pax')}
                                </dd>
                              </dl>
                            </div>

                            <div>
                              <div className="relative inline-block">
                                {formatImageSize(<WaitTime />, 24)}
                                <span className="absolute -top-3 left-1/2 z-10 inline-flex h-3 min-w-4 -translate-x-1/2 items-center justify-center rounded border border-primary bg-primary px-0.5 text-xs font-medium leading-none text-primary-foreground">
                                  {percentile ? 'Top' : 'Mean'}
                                </span>
                              </div>
                              <dl>
                                <dt>Wait Time</dt>
                                <dd className="!font-semibold">{formatTimeTaken(comp?.waitTime || 0)}</dd>
                              </dl>
                            </div>

                            <div>
                              {formatImageSize(<RatioIcon01 />, 24)}
                              <dl>
                                <dt>Facility Effi.</dt>
                                <dd className="!font-semibold">
                                  {Math.round(Number(comp?.facility_effi || 0))}
                                  {formatUnit('%')}
                                </dd>
                              </dl>
                            </div>

                            <div>
                              {formatImageSize(<RatioIcon02 />, 24)}
                              <dl>
                                <dt>Workforce Effi.</dt>
                                <dd className="!font-semibold">
                                  {Math.round(Number(comp?.workforce_effi || 0))}
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
