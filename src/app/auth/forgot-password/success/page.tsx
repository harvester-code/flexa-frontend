'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Shield } from 'lucide-react';
import { forgotPasswordAction } from '@/actions/auth';
import { Button } from '@/components/ui/Button';
import { SubmitButton } from '@/components/ui/SubmitButton';

function ForgotPasswordSuccessContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  return (
    <div className="signUpContainer">
      <h1>
        <Shield className="mx-auto h-24 w-24 text-primary" />
      </h1>
      <h2 className="title mt-60">Email Sent</h2>
      <p className="mt-10 font-medium">A password reset link has been sent to</p>
      <p className="mt-15 font-medium text-primary">{email}</p>
      <p className="mt-10 font-medium">Didn&apos;t receive the email?</p>
      <form>
        <input type="hidden" name="email" value={email || ''} />
        <SubmitButton variant="primary" formAction={forgotPasswordAction}>
          Resend Code
        </SubmitButton>
      </form>
      <Button asChild variant="link" className="mt-10">
        <Link href="/login">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Login
        </Link>
      </Button>
    </div>
  );
}

// TODO: Suspense 개선하기
export default function ForgotPasswordSuccess() {
  return (
    <Suspense>
      <ForgotPasswordSuccessContent />
    </Suspense>
  );
}
