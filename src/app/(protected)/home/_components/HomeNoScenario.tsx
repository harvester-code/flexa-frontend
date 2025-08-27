import { ScanFace } from 'lucide-react';

function HomeNoScenario() {
  return (
    <div className="mt-4 flex min-h-40 items-center justify-center gap-2 rounded-md border border-input text-sm font-normal text-default-500">
      <ScanFace /> You need to select scenario first.
    </div>
  );
}

export default HomeNoScenario;
