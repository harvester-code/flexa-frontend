import React from 'react';
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
        <button
          key={index}
          className={cn('tab-button', index === currentTab ? 'active' : '', index > availableTabs ? 'opacity-50' : '')}
          onClick={() => {
            if (index > availableTabs) return;
            if (onTabChange) onTabChange(index);
          }}
        >
          {tab.text} {tab.number ? <span>{tab.number}</span> : null}
        </button>
      ))}
    </div>
  );
}
