import { Ban } from 'lucide-react';

function HomeNoData() {
  return (
    <div className="mt-4 flex min-h-40 items-center justify-center gap-2 rounded-md border border-input bg-white p-6 text-center">
      <div className="flex flex-col items-center gap-2">
        <Ban className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium text-muted-foreground">
          There are no data to show. Please run a simulation first.
        </p>
      </div>
    </div>
  );
}

export default HomeNoData;
