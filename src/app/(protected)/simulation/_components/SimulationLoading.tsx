import Spinner from '@/components/ui/Spinner';

interface SimulationLoadingProps {
  size?: number;
  minHeight?: string;
}

function SimulationLoading({ size = 60, minHeight = 'min-h-[300px]' }: SimulationLoadingProps) {
  return (
    <div className={`flex ${minHeight} flex-1 items-center justify-center overflow-hidden`}>
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <Spinner size={size} />
      </div>
    </div>
  );
}

export default SimulationLoading;
