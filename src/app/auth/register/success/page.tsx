'use client';

import { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { signUpAction } from '@/actions/auth';
import { Button } from '@/components/ui/Button';
import { SubmitButton } from '@/components/ui/SubmitButton';

function RegisterSuccessContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  return (
    <div className="signUpContainer">
      <h1>
        <Image src="/image/img-logo.svg" alt="logo" width={100} height={100} />
      </h1>
      <h2 className="title mt-60">Email Send</h2>
      <p className="mt-10 font-medium">A verification link has been sent to</p>
      <p className="mt-15 font-medium text-brand">{email}</p>
      <p className="mt-10 font-medium">Didn&apos;t receive the email?</p>
      <form>
        <input type="hidden" name="email" value={email || ''} />
        <SubmitButton variant="btn-brand" formAction={signUpAction}>
          Resend Code
        </SubmitButton>
      </form>
      <Button asChild variant="btn-link" className="mt-10">
        <Link href="/">
          <FontAwesomeIcon className="nav-icon" icon={faArrowLeft} />
          Back to Login
        </Link>
      </Button>
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
