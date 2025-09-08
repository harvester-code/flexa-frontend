import { ComponentType } from 'react';
import { formatImageSize } from './HomeFormat';

interface HomeSummaryCardProps {
  icon: ComponentType<unknown>;
  title: React.ReactNode;
  value: React.ReactNode;
  kpiType?: 'mean' | 'top'; // for Wait Time/Queue Pax badge
  percentile?: number;
}

function HomeSummaryCard({ title, value, icon: IconComponent, kpiType, percentile }: HomeSummaryCardProps) {
  return (
    <div className="rounded border border-input bg-white px-4 py-3">
      <p className="mb-4 flex items-center gap-2 text-sm font-medium text-default-900">
        {title}
        {kpiType && (
          <span className="inline-flex h-5 items-center rounded border border-primary bg-primary px-2 text-xs font-medium text-primary-foreground">
            {kpiType === 'mean' ? 'Mean' : percentile ? `Top ${percentile}%` : 'Top N%'}
          </span>
        )}
      </p>
      <div className="flex items-center justify-between">
        {formatImageSize(<IconComponent />, 32)}
        <div className="text-lg font-semibold text-default-900">{value}</div>
      </div>
    </div>
  );
}

export default HomeSummaryCard;
