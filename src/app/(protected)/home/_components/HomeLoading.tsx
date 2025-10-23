import Spinner from '@/components/ui/Spinner';

function HomeLoading() {
  return (
    <div className="mt-4 flex min-h-64 items-center justify-center gap-2 rounded-md border border-input bg-white overflow-hidden">
      <div className="relative flex items-center justify-center" style={{ width: 50, height: 50 }}>
        <Spinner size={50} />
      </div>
    </div>
  );
}

export default HomeLoading;
