import { Ban } from 'lucide-react';

function HomeNoData() {
  return (
    <div className="mt-4 flex min-h-40 items-center justify-center gap-2 rounded-md border border-default-300 text-lg text-default-500">
      <Ban /> There are no data to show. Please run a simulation first.
    </div>
  );
}

export default HomeNoData;
