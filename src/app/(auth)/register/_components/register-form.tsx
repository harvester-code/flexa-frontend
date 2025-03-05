'use client';

import { useState } from 'react';
import { signUpAction } from '@/api/auth';
import { SubmitButton } from '@/components/SubmitButton';
import { Input } from '@/components/UIs/Input';
import { Label } from '@/components/UIs/Label';
import { AgreementForm } from './agreement-form';

export function RegisterForm() {
  const [isAgreed, setIsAgreed] = useState(false);

  return (
    <form className="signUpForm">
      <div className="flex justify-between gap-5">
        <div className="w-140 flex-none">
          <Label htmlFor="lastName" className="text-sm">
            Last name<span className="ml-5 text-brand">*</span>
          </Label>
          <Input type="text" name="lastName" placeholder="Last Name" required />
        </div>
        <div>
          <Label htmlFor="firstName" className="text-sm">
            First name<span className="ml-5 text-brand">*</span>
          </Label>
          <Input type="text" name="firstName" placeholder="First Name" required />
        </div>
      </div>
      <div>
        <Label htmlFor="email" className="flex text-sm">
          Email<span className="ml-5 text-brand">*</span>
        </Label>
        <Input type="email" name="email" placeholder="Enter your email" required />
        <Label htmlFor="password" className="flex text-sm">
          Password<span className="ml-5 text-brand">*</span>
        </Label>
        <Input type="password" name="password" placeholder="Enter your Password" required minLength={6} />
      </div>
      <AgreementForm onAgreeAll={setIsAgreed} />
      <SubmitButton formAction={signUpAction} disabled={!isAgreed} pendingText="Signing up...">
        Sign Up
      </SubmitButton>
    </form>
  );
}
