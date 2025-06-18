import { ComponentType } from 'react';
import { CircleSmall } from 'lucide-react';
import { formatImageSize } from './HomeFormat';

interface HomeSummaryCardProps {
  showCircle?: boolean;
  icon: ComponentType<unknown>;
  title: React.ReactNode;
  value: React.ReactNode;
}

function HomeSummaryCard({ title, value, icon: IconComponent, showCircle = false }: HomeSummaryCardProps) {
  return (
    <div className="rounded border border-default-200 px-4 py-3">
      <p className="mb-4 flex items-center">
        {title}
        {showCircle && <CircleSmall className="ml-1 size-4" fill="#9E77ED" stroke="#9E77ED" />}
      </p>
      <div className="flex items-center justify-between">
        {formatImageSize(<IconComponent />, 32)}
        <div className="text-4xl font-semibold">{value}</div>
      </div>
    </div>
  );
}

export default HomeSummaryCard;
