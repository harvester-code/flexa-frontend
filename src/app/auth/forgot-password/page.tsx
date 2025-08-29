'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { AlertCircle, Mail, Shield } from 'lucide-react';
import { forgotPasswordAction } from '@/actions/auth';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { SubmitButton } from '@/components/ui/SubmitButton';

export default function ForgotPasswordPage() {
  const [state, formAction] = useActionState(forgotPasswordAction, { error: null });

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
            src="https://flexa-dev-ap-northeast-2-data-storage.s3.ap-northeast-2.amazonaws.com/videos/flexa-hero-video.mp4"
            type="video/mp4"
          />
        </video>
      </div>

      <div className="mx-auto flex w-full max-w-md flex-col justify-center xl:mx-0 xl:mr-[120px]">
        <div
          className="relative w-full rounded-xl p-6 xl:p-8"
          style={{
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <div className="mb-8 flex items-center justify-center">
            <Shield className="h-12 w-12 text-primary" />
          </div>

          <div>
            <div className="mb-6 flex flex-col items-center text-center">
              <Mail className="mb-3 h-12 w-12 text-primary" />
              <h2 className="mb-2 text-lg font-semibold text-primary-900" style={{ lineHeight: '100%' }}>
                Forgot Password?
              </h2>
              <p className="text-sm text-primary-900/70">
                Don't worry, we'll send you a link to reset it.
              </p>
            </div>

            <form action={formAction} className="space-y-4">
              {/* Error Message Display */}
              {state?.error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-destructive">
                        Error
                      </p>
                      <p className="text-sm text-destructive/80">
                        {state.error.message}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="email" className="mb-1 block text-sm">
                  Email
                </Label>
                <Input
                  className="h-10 rounded-md"
                  name="email"
                  type="email"
                  placeholder="Enter your email address"
                  required
                />
              </div>

              <SubmitButton 
                className="mt-6 w-full" 
                variant="primary"
                pendingText="Sending..."
              >
                Send Reset Link
              </SubmitButton>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-primary-900">
                Remember your password?{' '}
                <Link
                  href="/auth/login"
                  className="font-semibold text-primary underline underline-offset-2"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>

        <p className="absolute bottom-4 left-0 right-0 text-center text-sm text-secondary">
          © Flexa all rights reserved
        </p>
      </div>
    </div>
  );
}
