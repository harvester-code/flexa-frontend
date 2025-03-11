'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { signUpAction } from '@/api/auth';
import { SubmitButton } from '@/components/SubmitButton';

export default function RegisterSuccess() {
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
        <SubmitButton formAction={signUpAction}>Resend Code</SubmitButton>
      </form>
      <Link href="/" className="btn-link mt-10">
        <FontAwesomeIcon className="nav-icon" icon={faArrowLeft} />
        Back to Login
      </Link>
    </div>
  );
}
