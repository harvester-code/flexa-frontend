'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const ErrorPage: React.FC = () => {
  const router = useRouter();

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted text-center">
      <div>
        <AlertCircle className="mx-auto h-20 w-20 text-red-500" />
        <p className="mt-2 text-lg font-semibold text-muted-foreground">OOPS...</p>
      </div>

      <div>
        <p className="text-accent-700 text-lg font-semibold leading-tight">404</p>
        <h1 className="text-default-900">We can&apos;t find that page</h1>
        <p className="mt-1.5 font-medium text-default-900">
          Sorry, the page you are looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="mx-auto mt-5 flex w-80 gap-2.5">
          <Button variant="secondary" size="btn-lg" onClick={() => router.back()}>
            <ChevronLeft className="size-4" />
            Go back
          </Button>
          <Button variant="primary" size="btn-lg" onClick={() => router.push('/home')}>
            Take me home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
