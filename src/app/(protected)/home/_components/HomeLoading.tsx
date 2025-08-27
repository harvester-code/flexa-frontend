import { ClipLoader } from 'react-spinners';

function HomeLoading() {
  return (
    <div className="mt-4 flex min-h-64 items-center justify-center gap-2 rounded-md border border-input">
      <ClipLoader
        color="#8B5CF6"
        size={50}
        speedMultiplier={1.2}
        cssOverride={{
          borderWidth: '5px',
        }}
      />
    </div>
  );
}

export default HomeLoading;
