'use client';

import { useActionState, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { signInAction } from '@/actions/auth';
import { Checkbox } from '@/components/ui/Checkbox';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { SubmitButton } from '@/components/ui/SubmitButton';

export default function LoginPage() {
  const [state, formAction] = useActionState(signInAction, { error: null });
  const [savedEmail, setSavedEmail] = useState('');
  const searchParams = useSearchParams();
  const message = searchParams?.get('message');

  // 저장된 이메일 로드 (클라이언트 사이드)
  useEffect(() => {
    // 쿠키에서 savedEmail을 가져오는 클라이언트 사이드 로직
    const cookies = document.cookie.split(';');
    const savedEmailCookie = cookies.find(cookie => cookie.trim().startsWith('savedEmail='));
    if (savedEmailCookie) {
      const email = savedEmailCookie.split('=')[1];
      setSavedEmail(decodeURIComponent(email));
    }
  }, []);

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
        <div>
          <h2 className="mb-2 text-2xl font-bold text-primary" style={{ lineHeight: '100%' }}>
            Log in
          </h2>

          <p className="mb-10 whitespace-nowrap">Enter your login information to access the solution.</p>

          <form action={formAction}>
            {/* Success Message Display */}
            {message === 'email-verified' && (
              <div className="mb-6 rounded-lg bg-green-50 border border-green-200 p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      Email Verified Successfully
                    </p>
                    <p className="text-sm text-green-700">
                      Your email has been verified. You can now sign in to your account.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {message === 'already-verified' && (
              <div className="mb-6 rounded-lg bg-blue-50 border border-blue-200 p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">
                      Email Already Verified
                    </p>
                    <p className="text-sm text-blue-700">
                      Your email verification link has already been used. Please sign in with your credentials.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message Display */}
            {state?.error && (
              <div className="mb-6 rounded-lg bg-destructive/10 border border-destructive/20 p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-destructive">
                      Authentication Error
                    </p>
                    <p className="text-sm text-destructive/80">
                      {state.error.message}
                    </p>
                    {state.error.details && process.env.NODE_ENV === 'development' && (
                      <p className="text-xs text-destructive/60 mt-1">
                        Debug: {state.error.details}
                      </p>
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

              <Link
                href="/auth/forgot-password"
                className="font-semibold text-primary underline underline-offset-2"
              >
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
              <Link
                href="/auth/register"
                className="font-semibold text-primary underline underline-offset-2"
              >
                Create account
              </Link>
            </p>
          </div>
        </div>

        <p className="absolute bottom-4 left-0 right-0 text-center text-sm text-secondary">
          © Flexa all rights reserved
        </p>
      </div>
    </div>
  );
}
