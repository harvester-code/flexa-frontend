import { Ban } from 'lucide-react';

function HomeErrors() {
  return (
    <div className="mt-4 flex min-h-40 items-center justify-center gap-2 rounded-md border border-input text-lg text-default-500">
      <Ban /> Error loading data. Please try again later.
    </div>
  );
}

export default HomeErrors;
