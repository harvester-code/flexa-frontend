import { ScanFace } from 'lucide-react';

function HomeNoScenario() {
  return (
    <div className="mt-4 flex min-h-40 items-center justify-center gap-2 rounded-md border border-default-200 text-lg text-default-400">
      <ScanFace /> You need to select scenario first.
    </div>
  );
}

export default HomeNoScenario;
