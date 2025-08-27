'use client';

import { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Mail } from 'lucide-react';
import { signUpAction } from '@/actions/auth';
import { Button } from '@/components/ui/Button';
import { SubmitButton } from '@/components/ui/SubmitButton';

function RegisterSuccessContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  return (
    <div
      className="relative flex min-h-svh items-center justify-center xl:justify-between"
      style={{
        background: 'linear-gradient(180deg, rgba(175, 82, 222, 0.15) 0%, rgba(0, 122, 255, 0.15) 100%), #fff',
      }}
    >
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

      <div
        className="rounded-lg px-10 pb-28 pt-14 shadow-md xl:flex xl:min-h-svh xl:w-full xl:max-w-[30rem] xl:flex-col xl:justify-center xl:rounded-none xl:border-l-2 xl:border-white xl:px-10 xl:shadow-none"
        style={{
          background: 'rgba(255, 255, 255, 0.4)',
          backdropFilter: 'blur(45px)',
        }}
      >
        <div className="text-center">
          {/* Success Icon */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-8 w-8 text-primary" />
          </div>

          <h2 className="mb-2 text-lg font-semibold text-primary-900" style={{ lineHeight: '100%' }}>
            Check your email
          </h2>

          <div className="mb-8 space-y-2">
            <p className="text-sm text-primary-900">A verification link has been sent to</p>
            <p className="font-semibold text-primary">{email}</p>
            <p className="text-sm text-primary-900">Please check your inbox and click the link to verify your account.</p>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-primary-900">Didn't receive the email?</p>
            <form>
              <input type="hidden" name="email" value={email || ''} />
              <SubmitButton 
                variant="primary" 
                formAction={signUpAction} 
                className="w-full"
                pendingText="Resending..."
              >
                Resend Verification Email
              </SubmitButton>
            </form>
          </div>

          <Button asChild variant="ghost" className="mt-6 text-primary-900 hover:text-primary">
            <Link href="/auth/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Link>
          </Button>
        </div>

        <p className="absolute bottom-4 left-0 right-0 text-center text-sm text-secondary">
          © Flexa all rights reserved
        </p>
      </div>
    </div>
  );
}

// TODO: Suspense 개선하기
export default function RegisterSuccess() {
  return (
    <Suspense>
      <RegisterSuccessContent />
    </Suspense>
  );
}
