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
import { capitalizeFirst, formatTimeTaken, formatUnit } from './HomeFormat';
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

  // Build target options dynamically from the first facility's first item
  const targetOptions = useMemo(() => {
    if (!alertIssueData) return [];
    const firstFacilityKey = Object.keys(alertIssueData)[0];
    const firstItem = alertIssueData[firstFacilityKey]?.[0];
    if (!firstItem) return [];
    return Object.keys(firstItem)
      .filter((key) => !['time', 'node'].includes(key))
      .map((key) => ({
        label: capitalizeFirst(key),
        value: key,
      }));
  }, [alertIssueData]);

  // Track selected facility key only
  const [selectedFacilityKey, setSelectedFacilityKey] = useState<string | undefined>(facilityOptions[0]?.value);
  useEffect(() => {
    setSelectedFacilityKey(facilityOptions[0]?.value);
  }, [facilityOptions.length]);

  // Track selected target option
  const [target, setTarget] = useState(targetOptions[0]);
  useEffect(() => {
    setTarget(targetOptions[0]);
  }, [targetOptions.length]);

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
      <div className="my-3.5 flex justify-end gap-3.5">
        <TheDropdownMenu
          className="min-w-60 [&>*]:justify-start"
          items={facilityOptions}
          icon={<ChevronDown />}
          label={facilityOptions.find((opt) => opt.value === selectedFacilityKey)?.label || ''}
          onSelect={(opt) => setSelectedFacilityKey(opt.value)}
        />

        <div className="min-w-60">
          <TheDropdownMenu
            className="min-w-60 [&>*]:justify-start"
            items={targetOptions}
            icon={<ChevronDown />}
            label={target?.label}
            onSelect={(opt) => setTarget(opt)}
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 rounded-md bg-default-50 p-5">
        {selectedFacilityKey &&
          alertIssueData[selectedFacilityKey]?.map((item, i) => {
            const { node, time } = item;
            const parts = node.split('_');
            // NOTE: 코드 순서가 중요
            const facility = parts.pop();
            const zone = parts.join('_');

            return (
              <div className="relative flex flex-col rounded-md border border-default-200 bg-white px-4 py-3" key={i}>
                <dl className="flex justify-between">
                  <dt className="font-semibold text-default-700">
                    {pascalCase(zone)} {facility} · {dayjs(time, 'HH:mm:ss').format('hh:mm a')}
                  </dt>
                </dl>

                <div className="mt-2 flex justify-end text-4xl font-semibold text-default-900">
                  {target?.value && item[target.value] !== undefined ? (
                    target.value === 'waiting_time' ? (
                      <p>{formatTimeTaken(item[target.value])}</p>
                    ) : (
                      <p>
                        {item[target.value]}
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
