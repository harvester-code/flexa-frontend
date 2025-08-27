'use client';

import { useEffect, useMemo, useState } from 'react';
import { pascalCase } from 'change-case';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { ChevronDown } from 'lucide-react';
import { Option } from '@/types/homeTypes';
import { ScenarioData } from '@/types/homeTypes';
import { Button } from '@/components/ui/Button';
import ToggleButtonGroup from '@/components/ui/ToggleButtonGroup';
import { capitalizeFirst, formatNumberWithComma, formatTimeTaken, formatUnit } from './HomeFormat';
import HomeLoading from './HomeLoading';
import HomeNoData from './HomeNoData';
import HomeNoScenario from './HomeNoScenario';
import TheDropdownMenu from './TheDropdownMenu';

dayjs.extend(customParseFormat);

interface HomeWarningProps {
  scenario: ScenarioData | null;
  data?: any; // 배치 API에서 받은 alert_issues 데이터
  isLoading?: boolean; // 배치 API 로딩 상태
}

function HomeWarning({ scenario, data, isLoading: propIsLoading }: HomeWarningProps) {
  // 부모 컴포넌트에서 데이터를 받아서 사용 (개별 API 호출 제거)
  const alertIssueData = data;
  const isLoading = propIsLoading || false;

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
          <ToggleButtonGroup
            options={SELECT_OPTIONS}
            selectedValue={target.value}
            onSelect={(opt) => setTarget(opt)}
            labelExtractor={(opt) => opt.label}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 grid-rows-8 gap-4 rounded-md bg-muted p-5 md:grid-cols-2 md:grid-rows-4 xl:grid-cols-4 xl:grid-rows-2">
        {selectedFacilityKey &&
          alertIssueData[selectedFacilityKey]?.map((item, i) => {
            const { node, time } = item;
            const parts = node.split('_');
            // NOTE: 코드 순서가 중요
            const facility = parts.pop();
            const zone = parts.join('_');
            const displayZone = capitalizeFirst(zone.replace('_', '-'));

            return (
              <div className="relative flex flex-col overflow-hidden rounded-md border border-input bg-white" key={i}>
                <div className="bg-muted px-4 py-2">
                  <dl className="flex items-center justify-between">
                    <dt className="flex items-center gap-2">
                      <span className="rounded px-3 py-1 text-sm font-medium text-primary-500">
                        {displayZone} {facility}
                      </span>
                    </dt>
                    <dd>
                      <span className="rounded px-3 py-1 text-sm font-medium text-primary-500">
                        {dayjs(time, 'HH:mm:ss').format('hh:mm a')}
                      </span>
                    </dd>
                  </dl>
                </div>

                <div className="flex justify-end px-4 py-3 text-lg font-semibold text-default-900">
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
