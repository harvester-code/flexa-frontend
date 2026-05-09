import { type ReactNode } from 'react';

interface HomeChartSectionProps {
  title: string;
  children: ReactNode;
}

function HomeChartSection({ title, children }: HomeChartSectionProps) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between pl-5">
        <h5 className="flex h-[50px] items-center text-lg font-semibold">{title}</h5>
      </div>
      <div className="flex flex-col rounded-md border border-input bg-white p-5">
        {children}
      </div>
    </div>
  );
}

export default HomeChartSection;
