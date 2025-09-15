'use client';

import { useActionState, useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { signInAction } from '@/actions/auth';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { SubmitButton } from '@/components/ui/SubmitButton';

function LoginForm() {
  const [state, formAction] = useActionState(signInAction, null);
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
        <div>
          <h2 className="mb-2 text-2xl font-bold leading-none text-primary">Log in</h2>

          <p className="mb-10 text-sm text-muted-foreground">Enter your login information to access the solution.</p>

          <form action={formAction}>
            {/* Success Message Display */}
            {mounted && searchParams?.get('message') === 'email-verified' && (
              <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 flex-shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-primary">Email Verified Successfully</p>
                    <p className="text-sm text-primary/80">
                      Your email has been verified. You can now sign in to your account.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {mounted && searchParams?.get('message') === 'already-verified' && (
              <div className="mb-6 rounded-lg border border-muted bg-muted/50 p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-default-900">Email Already Verified</p>
                    <p className="text-sm text-muted-foreground">
                      Your email verification link has already been used. Please sign in with your credentials.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message Display */}
            {state?.error?.message && (
              <div className="mb-6 rounded-lg border border-destructive/20 bg-destructive/5 p-4 backdrop-blur-sm">
                <div className="flex items-start space-x-3">
                  <div className="mt-0.5 rounded-full bg-destructive/10 p-1">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-destructive mb-1">Unable to sign in</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{state.error.message}</p>
                  </div>
                </div>
              </div>
            )}

            <Label htmlFor="email" className="mb-1 block text-sm">
              Email
            </Label>
            <Input
              name="email"
              type="email"
              placeholder="Enter your Email"
              required
            />

            <Label htmlFor="password" className="mb-1 mt-4 block text-sm">
              Password
            </Label>
            <Input
              type="password"
              name="password"
              placeholder="Enter your password"
              minLength={6}
              required
            />

            <div className="mt-4 flex justify-end text-sm">
              <Link href="/auth/forgot-password" className="font-semibold text-primary underline underline-offset-2">
                Forgot Password?
              </Link>
            </div>

            <SubmitButton className="mt-10 w-full font-bold" variant="primary" pendingText="Signing in...">
              Sign In
            </SubmitButton>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm font-medium text-primary">
              Don't have an account?{' '}
              <Link href="/auth/register" className="font-semibold text-primary underline underline-offset-2">
                Create account
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

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="relative flex min-h-svh items-center justify-center bg-gradient-to-b from-primary/15 via-background to-primary/10 xl:justify-between" />}>
      <LoginForm />
    </Suspense>
  );
}
