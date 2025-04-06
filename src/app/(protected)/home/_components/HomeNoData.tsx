import { Ban } from 'lucide-react';

function HomeNoData() {
  return (
    <div className="mt-4 flex min-h-40 items-center justify-center gap-2 rounded-md border border-default-200 text-lg text-default-400">
      <Ban /> There are some troubles to get data. Try again.
    </div>
  );
}

export default HomeNoData;
