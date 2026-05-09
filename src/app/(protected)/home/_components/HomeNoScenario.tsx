import { ScanFace } from 'lucide-react';
import HomeEmptyState from './HomeEmptyState';

function HomeNoScenario() {
  return (
    <HomeEmptyState>
      <ScanFace className="h-8 w-8 text-muted-foreground" />
      <p className="text-sm font-medium text-muted-foreground">You need to select scenario first.</p>
    </HomeEmptyState>
  );
}

export default HomeNoScenario;
