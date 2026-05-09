import { type ReactNode } from 'react';

interface HomeEmptyStateProps {
  children: ReactNode;
}

function HomeEmptyState({ children }: HomeEmptyStateProps) {
  return (
    <div className="mt-4 flex min-h-40 items-center justify-center gap-2 rounded-md border border-input bg-white p-6 text-center">
      <div className="flex flex-col items-center gap-2">{children}</div>
    </div>
  );
}

export default HomeEmptyState;
