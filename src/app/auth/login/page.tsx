'use client';

import { Suspense, useActionState, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { signInAction } from '@/actions/auth';
import { Checkbox } from '@/components/ui/Checkbox';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { SubmitButton } from '@/components/ui/SubmitButton';

// Message display component that uses useSearchParams
function MessageDisplay() {
  const searchParams = useSearchParams();
  const message = searchParams?.get('message');

  if (message === 'email-verified') {
    return (
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
    );
  }

  if (message === 'already-verified') {
    return (
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
    );
  }

  return null;
}

export default function LoginPage() {
  const [state, formAction] = useActionState(signInAction, { error: { message: '' } });
  const [savedEmail, setSavedEmail] = useState('');

  // 저장된 이메일 로드 (클라이언트 사이드)
  useEffect(() => {
    // 쿠키에서 savedEmail을 가져오는 클라이언트 사이드 로직
    const cookies = document.cookie.split(';');
    const savedEmailCookie = cookies.find((cookie) => cookie.trim().startsWith('savedEmail='));
    if (savedEmailCookie) {
      const email = savedEmailCookie.split('=')[1];
      setSavedEmail(decodeURIComponent(email));
    }
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

          <p className="mb-10 whitespace-nowrap">Enter your login information to access the solution.</p>

          <form action={formAction}>
            {/* Success Message Display with Suspense */}
            <Suspense fallback={null}>
              <MessageDisplay />
            </Suspense>

            {/* Error Message Display */}
            {state?.error && (
              <div className="mb-6 rounded-lg border border-destructive/20 bg-destructive/10 p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 text-destructive" />
                  <div>
                    <p className="text-sm font-medium text-destructive">Authentication Error</p>
                    <p className="text-sm text-destructive/80">{state.error.message}</p>
                    {(state.error as any)?.details && process.env.NODE_ENV === 'development' && (
                      <p className="mt-1 text-xs text-destructive/60">Debug: {(state.error as any)?.details}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <Label htmlFor="email" className="mb-1 block text-sm">
              Email
            </Label>
            <Input
              className="mb-4 h-10 whitespace-nowrap rounded-md"
              name="email"
              type="email"
              defaultValue={savedEmail}
              placeholder="Enter your Email"
              required
            />

            <Label htmlFor="password" className="mb-1 block text-sm">
              Password
            </Label>
            <Input
              className="mb-4 h-10 whitespace-nowrap rounded-md"
              type="password"
              name="password"
              placeholder="Enter your password"
              minLength={6}
              required
            />

            <div className="flex justify-between text-sm">
              <div className="flex items-center gap-1">
                <Checkbox className="size-4" id="rememberMe" name="rememberMe" defaultChecked={!!savedEmail} />
                <Label htmlFor="rememberMe" className="cursor-pointer font-bold text-primary">
                  Save Account
                </Label>
              </div>

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
