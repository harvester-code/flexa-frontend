import { ScanFace } from 'lucide-react';

function HomeNoScenario() {
  return (
    <div className="mt-4 flex min-h-40 items-center justify-center gap-2 rounded-md border border-input bg-white p-6 text-center">
      <div className="flex flex-col items-center gap-2">
        <ScanFace className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium text-muted-foreground">You need to select scenario first.</p>
      </div>
    </div>
  );
}

export default HomeNoScenario;
