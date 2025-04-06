import { OrbitProgress } from 'react-loading-indicators';

function HomeLoading() {
  return (
    <div className="mt-4 flex min-h-40 items-center justify-center gap-2 rounded-md border border-default-200">
      <OrbitProgress color="#dcdfea" size="small" />
    </div>
  );
}

export default HomeLoading;
