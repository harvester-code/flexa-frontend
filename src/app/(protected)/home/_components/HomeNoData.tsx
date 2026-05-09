import { Ban } from 'lucide-react';
import HomeEmptyState from './HomeEmptyState';

function HomeNoData() {
  return (
    <HomeEmptyState>
      <Ban className="h-8 w-8 text-muted-foreground" />
      <p className="text-sm font-medium text-muted-foreground">
        There are no data to show. Please run a simulation first.
      </p>
    </HomeEmptyState>
  );
}

export default HomeNoData;
