import React from 'react';

interface TabDefaultProps {
  currentTab: number; // 현재 페이지
  availableTabs?: number; // 0 ~ availableTabs 까지 탭 버튼 활성화
  className?: string;
  tabs: {
    text: React.ReactNode;
    number?: number;
  }[];
  tabCount: number; // 탭의 갯수 추가
  onTabChange?: (tabIndex: number) => void;
}

export default function TabDefault({
  currentTab,
  availableTabs,
  className,
  tabs,
  tabCount,
  onTabChange,
}: TabDefaultProps) {
  return (
    <div className={`tab-default ${className}`}>
      {tabs.slice(0, tabCount).map((tab, index) => (
        <button
          key={index}
          className={`${currentTab === index ? 'active' : ''} ${availableTabs != null && index > availableTabs ? 'opacity-50' : ''}`}
          onClick={() => {
            if (availableTabs && index > availableTabs) return;
            if (onTabChange) onTabChange(index);
          }}
        >
          {tab.text} {tab.number ? <span>{tab.number}</span> : null}
        </button>
      ))}
    </div>
  );
}
