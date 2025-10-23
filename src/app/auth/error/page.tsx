'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertTriangle, ArrowLeft, Mail, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const message = searchParams.get('message') || 'unknown';

  const getErrorInfo = (errorType: string) => {
    switch (errorType) {
      case 'email-verification-failed':
        return {
          title: 'Email Verification Failed',
          description:
            'The verification link is invalid or has expired. Please try requesting a new verification email.',
          icon: Mail,
          showResendOption: true,
        };
      case 'session-expired':
        return {
          title: 'Session Expired',
          description: 'Your session has expired for security reasons. Please sign in again.',
          icon: RefreshCw,
          showResendOption: false,
        };
      case 'access-denied':
        return {
          title: 'Access Denied',
          description: 'You do not have permission to access this resource.',
          icon: AlertTriangle,
          showResendOption: false,
        };
      default:
        return {
          title: 'Authentication Error',
          description: 'Something went wrong during authentication. Please try again.',
          icon: AlertTriangle,
          showResendOption: false,
        };
    }
  };

  const errorInfo = getErrorInfo(message);
  const Icon = errorInfo.icon;

  return (
    <div className="relative flex min-h-svh items-center justify-center bg-gradient-to-b from-primary/15 via-background to-primary/10 xl:justify-between">
      <div className="hidden xl:block">
        <video autoPlay muted playsInline loop className="min-h-svh w-full object-cover">
          <source
            src="https://flexa-dev-ap-northeast-2-data-storage.s3.ap-northeast-2.amazonaws.com/videos/flexa-hero-video-long.webm"
            type="video/webm"
          />
          <source
            src="https://flexa-dev-ap-northeast-2-data-storage.s3.ap-northeast-2.amazonaws.com/videos/flexa-hero-video-long.mp4"
            type="video/mp4"
          />
          Your browser does not support video.
        </video>
      </div>

      <div className="rounded-lg bg-background/40 px-10 pb-28 pt-14 shadow-md backdrop-blur-3xl xl:flex xl:min-h-svh xl:w-full xl:max-w-[30rem] xl:flex-col xl:justify-center xl:rounded-none xl:border-l-2 xl:border-background xl:px-10 xl:shadow-none">
        <div className="text-center">
          {/* Error Icon */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <Icon className="h-8 w-8 text-destructive" />
          </div>

          <h2 className="mb-2 text-lg font-semibold leading-none text-default-900">{errorInfo.title}</h2>

          <p className="mb-8 text-sm text-default-900">{errorInfo.description}</p>

          <div className="space-y-4">
            {errorInfo.showResendOption && (
              <Button asChild variant="primary">
                <Link href="/auth/register">Request New Verification Email</Link>
              </Button>
            )}

            <Button asChild variant="ghost">
              <Link href="/auth/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Link>
            </Button>
          </div>

          <div className="mt-6">
            <p className="text-xs text-default-900/70">
              Need help?{' '}
              <Link href="/contact" className="text-primary underline">
                Contact Support
              </Link>
            </p>
          </div>
        </div>

        <p className="absolute bottom-4 left-0 right-0 text-center text-sm text-muted-foreground">
          © Flexa all rights reserved
        </p>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center">
          <div className="text-center">
            <Spinner size={32} className="mx-auto" />
            <p className="mt-2 text-default-900">Loading...</p>
          </div>
        </div>
      }
    >
      <AuthErrorContent />
    </Suspense>
  );
}
