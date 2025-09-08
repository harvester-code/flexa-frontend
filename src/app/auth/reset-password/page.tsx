'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { AlertCircle, Check, Key, Shield } from 'lucide-react';
import { resetPasswordAction } from '@/actions/auth';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { SubmitButton } from '@/components/ui/SubmitButton';

export default function ResetPasswordPage() {
  const [state, formAction] = useActionState(resetPasswordAction, { error: null });

  return (
    <div className="relative flex min-h-svh items-center justify-center bg-gradient-to-b from-primary/15 via-background to-primary/10 xl:justify-between">
      <div className="hidden xl:block">
        <video autoPlay muted playsInline loop className="min-h-svh w-full object-cover">
          <source
            src="https://flexa-dev-ap-northeast-2-data-storage.s3.ap-northeast-2.amazonaws.com/videos/flexa-hero-video.mp4"
            type="video/mp4"
          />
        </video>
      </div>

      <div className="mx-auto flex w-full max-w-md flex-col justify-center xl:mx-0 xl:mr-[120px]">
        <div className="relative w-full rounded-xl bg-background/80 p-6 backdrop-blur-lg xl:p-8">
          <div className="mb-8 flex items-center justify-center">
            <Shield className="h-12 w-12 text-primary" />
          </div>

          <div>
            <div className="mb-6 flex flex-col items-center text-center">
              <Key className="mb-3 h-12 w-12 text-primary" />
              <h2 className="mb-2 text-lg font-semibold leading-none text-default-900">Set New Password</h2>
              <p className="text-sm text-default-900/70">
                Your new password must be different from your previous password.
              </p>
            </div>

            <form action={formAction} className="space-y-4">
              {/* Error Message Display */}
              {state?.error && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 text-destructive" />
                    <div>
                      <p className="text-sm font-medium text-destructive">Error</p>
                      <p className="text-sm text-destructive/80">{state.error.message}</p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="password" className="mb-1 block text-sm">
                  New Password <span className="text-destructive">*</span>
                </Label>
                <Input
                  className="h-10 rounded-md"
                  name="password"
                  type="password"
                  placeholder="Enter new password"
                  minLength={8}
                  required
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="mb-1 block text-sm">
                  Confirm Password <span className="text-destructive">*</span>
                </Label>
                <Input
                  className="h-10 rounded-md"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  minLength={8}
                  required
                />
              </div>

              {/* Password Requirements */}
              <div className="mt-4 rounded-lg bg-primary/5 p-3">
                <p className="mb-2 text-xs font-medium text-default-900">Password requirements:</p>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Check className="h-3 w-3 text-primary" />
                    <span className="text-xs text-default-900/70">Minimum 8 characters</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="h-3 w-3 text-primary" />
                    <span className="text-xs text-default-900/70">Including letters and numbers</span>
                  </div>
                </div>
              </div>

              <SubmitButton className="mt-6 w-full" variant="primary" pendingText="Resetting password...">
                Reset Password
              </SubmitButton>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-default-900">
                Remember your password?{' '}
                <Link href="/auth/login" className="font-semibold text-primary underline underline-offset-2">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>

        <p className="absolute bottom-4 left-0 right-0 text-center text-sm text-muted-foreground">
          © Flexa all rights reserved
        </p>
      </div>
    </div>
  );
}
