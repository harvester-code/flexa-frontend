import { ClipLoader } from 'react-spinners';

function HomeLoading() {
  return (
    <div className="mt-4 flex min-h-64 items-center justify-center gap-2 rounded-md border border-input bg-white">
      <ClipLoader
        color="hsl(var(--primary-500))"
        size={50}
        speedMultiplier={1.2}
        cssOverride={{
          borderWidth: '4px',
        }}
      />
    </div>
  );
}

export default HomeLoading;
