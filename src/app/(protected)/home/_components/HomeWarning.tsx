'use client';

import { useEffect, useMemo, useState } from 'react';
import { pascalCase } from 'change-case';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { ChevronDown } from 'lucide-react';
import { Option } from '@/types/commons';
import { ScenarioData } from '@/types/simulations';
import { useAlertIssues } from '@/queries/homeQueries';
import TheDropdownMenu from '@/components/TheDropdownMenu';
import { Button, ButtonGroup } from '@/components/ui/Button';
import { capitalizeFirst, formatNumberWithComma, formatTimeTaken, formatUnit } from './HomeFormat';
import HomeLoading from './HomeLoading';
import HomeNoData from './HomeNoData';
import HomeNoScenario from './HomeNoScenario';

dayjs.extend(customParseFormat);

interface HomeWarningProps {
  scenario: ScenarioData | null;
}

function HomeWarning({ scenario }: HomeWarningProps) {
  const { data: alertIssueData, isLoading } = useAlertIssues({ scenarioId: scenario?.id });

  // Build options directly from alertIssueData keys
  const facilityOptions = useMemo(() => {
    if (!alertIssueData) return [];
    return Object.keys(alertIssueData).map((key) => ({
      label: capitalizeFirst(key),
      value: key,
    }));
  }, [alertIssueData]);

  // Static select options for the second dropdown
  const SELECT_OPTIONS = [
    { label: 'Wait Time', value: 'waiting_time' },
    { label: 'Queue Pax', value: 'queue_length' },
  ];

  // Track selected facility key only
  const [selectedFacilityKey, setSelectedFacilityKey] = useState<string | undefined>(facilityOptions[0]?.value);
  useEffect(() => {
    setSelectedFacilityKey(facilityOptions[0]?.value);
  }, [facilityOptions.length]);

  // Track selected target option
  const [target, setTarget] = useState(SELECT_OPTIONS[0]);
  useEffect(() => {
    setTarget(SELECT_OPTIONS[0]);
  }, []);

  if (!scenario) {
    return <HomeNoScenario />;
  }

  if (isLoading) {
    return <HomeLoading />;
  }

  if (!alertIssueData) {
    return <HomeNoData />;
  }

  return (
    <>
      <div className="my-3.5 ml-5 mr-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full justify-center md:w-auto md:flex-1 md:justify-start">
          <TheDropdownMenu
            className="w-full md:w-60 md:min-w-60 md:max-w-[240px] [&>*]:justify-start"
            items={facilityOptions}
            icon={<ChevronDown />}
            label={facilityOptions.find((opt) => opt.value === selectedFacilityKey)?.label || ''}
            onSelect={(opt) => setSelectedFacilityKey(opt.value)}
          />
        </div>
        <div className="flex w-full items-center justify-center md:w-auto md:justify-end">
          <ButtonGroup>
            {SELECT_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                className={
                  target.value === opt.value
                    ? 'bg-default-200 font-bold shadow-[inset_0px_-1px_4px_0px_rgba(185,192,212,0.80)]'
                    : ''
                }
                variant="outline"
                onClick={() => setTarget(opt)}
              >
                {opt.label}
              </Button>
            ))}
          </ButtonGroup>
        </div>
      </div>

      <div className="grid grid-cols-1 grid-rows-8 gap-4 rounded-md bg-default-50 p-5 md:grid-cols-2 md:grid-rows-4 xl:grid-cols-4 xl:grid-rows-2">
        {selectedFacilityKey &&
          alertIssueData[selectedFacilityKey]?.map((item, i) => {
            const { node, time } = item;
            const parts = node.split('_');
            // NOTE: 코드 순서가 중요
            const facility = parts.pop();
            const zone = parts.join('_');
            const displayZone = capitalizeFirst(zone.replace('_', '-'));

            return (
              <div
                className="relative flex flex-col overflow-hidden rounded-md border border-default-200 bg-white"
                key={i}
              >
                <div className="bg-default-100 px-4 py-2">
                  <dl className="flex items-center justify-between">
                    <dt className="flex items-center gap-2">
                      <span className="text-brand-500 rounded px-3 py-1 text-base font-semibold">
                        {displayZone} {facility}
                      </span>
                    </dt>
                    <dd>
                      <span className="text-brand-500 rounded px-3 py-1 text-base font-semibold">
                        {dayjs(time, 'HH:mm:ss').format('hh:mm a')}
                      </span>
                    </dd>
                  </dl>
                </div>

                <div className="flex justify-end px-4 py-3 text-4xl font-semibold text-default-900">
                  {target?.value && item[target.value] !== undefined ? (
                    target.value === 'waiting_time' ? (
                      <p>{formatTimeTaken(item[target.value])}</p>
                    ) : (
                      <p>
                        {target.value === 'queue_length'
                          ? formatNumberWithComma(item[target.value])
                          : item[target.value]}
                        {target.value === 'queue_length' ? formatUnit('pax') : ''}
                      </p>
                    )
                  ) : (
                    'Error'
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </>
  );
}

export default HomeWarning;
