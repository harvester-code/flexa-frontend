import { ComponentType } from 'react';
import { formatImageSize } from './HomeFormat';
import { badgeBtn } from './HomeKpiSelector';

interface HomeSummaryCardProps {
  icon: ComponentType<unknown>;
  title: React.ReactNode;
  value: React.ReactNode;
  kpiType?: 'mean' | 'top'; // for Wait Time/Queue Pax badge
  percentile?: number;
}

function HomeSummaryCard({ title, value, icon: IconComponent, kpiType, percentile }: HomeSummaryCardProps) {
  return (
    <div className="rounded border border-default-300 px-4 py-3">
      <p className="mb-4 flex items-center gap-2">
        {title}
        {kpiType && (
          <span className={badgeBtn(true)}>
            {kpiType === 'mean' ? 'Mean' : percentile ? `Top ${percentile}%` : 'Top N%'}
          </span>
        )}
      </p>
      <div className="flex items-center justify-between">
        {formatImageSize(<IconComponent />, 32)}
        <div className="text-4xl font-semibold">{value}</div>
      </div>
    </div>
  );
}

export default HomeSummaryCard;
