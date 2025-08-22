'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const ErrorPage: React.FC = () => {
  const router = useRouter();

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-default-25 text-center">
      <div>
        <Image src="/image/ico-oops.svg" width={100} height={86} alt="oops-image" />
        <p className="mt-2 text-3xl font-medium text-default-300">OOPS...</p>
      </div>

      <div>
        <p className="text-[10rem] font-semibold leading-tight text-accent-700">404</p>
        <h1 className="text-default-600">We can&apos;t find that page</h1>
        <p className="mt-1.5 font-medium text-default-700">
          Sorry, the page you are looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="mx-auto mt-5 flex w-80 gap-2.5">
          <Button
            variant="btn-default"
            size="btn-lg"
            onClick={() => router.back()}
          >
            <ChevronLeft className="size-4" />
            Go back
          </Button>
          <Button variant="btn-primary" size="btn-lg" onClick={() => router.push('/home')}>
            Take me home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
