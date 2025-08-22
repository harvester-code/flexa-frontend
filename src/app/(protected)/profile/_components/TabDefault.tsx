import React from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface TabDefaultProps {
  currentTab: number; // 현재 페이지
  availableTabs?: number; // 0 ~ availableTabs 까지 탭 버튼 활성화
  className?: string;
  tabs: { text: string; number?: number }[];
  tabCount: number; // 탭의 갯수 추가
  onTabChange?: (tabIndex: number) => void;
}

export default function TabDefault({
  currentTab,
  availableTabs = 999, // 기본값을 999로 설정하여 모든 탭이 활성화
  className,
  tabs,
  tabCount,
  onTabChange,
}: TabDefaultProps) {
  return (
    <div className={cn('tab-default', className)}>
      {tabs.slice(0, tabCount).map((tab, index) => (
        <Button
          key={index}
          variant="ghost"
          size="default"
          className={cn(
            index === currentTab ? 'active' : '',
            index > availableTabs ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
          )}
          onClick={() => {
            if (!onTabChange) return;

            // 개발 모드에서는 모든 탭 활성화
            if (availableTabs === 999) {
              onTabChange(index);
              return;
            }

            // isCompleted 기반 탭 접근성 제어
            // availableTabs 이하의 탭만 클릭 가능
            if (index <= availableTabs) {
              onTabChange(index);
            }
          }}
        >
          {tab.text} {tab.number ? <span>{tab.number}</span> : null}
        </Button>
      ))}
    </div>
  );
}
