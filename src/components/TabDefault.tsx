import React from 'react';

interface TabDefaultProps {
  currentTab: number; // 현재 페이지
  // number: number;
  className?: string;
  tabs: {
    text: React.ReactNode;
    number: number;
  }[];
  tabCount: number; // 탭의 갯수 추가
  onTabChange?: (tabIndex: number) => void;
}

export default function TabDefault({ currentTab, className, tabs, tabCount, onTabChange }: TabDefaultProps) {
  return (
    <div className={`tab-default ${className}`}>
      {tabs.slice(0, tabCount).map((tab, index) => (
        <button key={index} className={`${currentTab === index ? 'active' : ''}`} onClick={() => { if(onTabChange) onTabChange(index) }}>
          {tab.text} {tab.number ? <span>{tab.number}</span> : null}
        </button>
      ))}
    </div>
  );
}
