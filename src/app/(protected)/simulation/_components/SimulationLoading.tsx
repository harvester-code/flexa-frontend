import { ClipLoader } from 'react-spinners';

interface SimulationLoadingProps {
  size?: number;
  minHeight?: string;
}

function SimulationLoading({ size = 60, minHeight = 'min-h-[300px]' }: SimulationLoadingProps) {
  return (
    <div className={`flex ${minHeight} flex-1 items-center justify-center overflow-hidden`}>
      <div className="relative" style={{ width: size, height: size }}>
        <ClipLoader
          color="#8B5CF6"
          size={size}
          speedMultiplier={1.2}
          cssOverride={{
            borderWidth: '6px',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        />
      </div>
    </div>
  );
}

export default SimulationLoading;
