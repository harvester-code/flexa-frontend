'use client';

import { useActionState, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { signUpAction } from '@/actions/auth';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { AgreementForm } from './agreement-form';

export function RegisterForm() {
  const [state, formAction] = useActionState(signUpAction, { error: { message: '' } });
  const [isAgreed, setIsAgreed] = useState(false);

  return (
    <form action={formAction} className="space-y-6">
      {/* Error Message Display */}
      {state?.error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-destructive" />
            <div>
              <p className="text-sm font-medium text-destructive">Registration Error</p>
              <p className="text-sm text-destructive/80">{state.error.message}</p>
              {(state.error as any)?.details && process.env.NODE_ENV === 'development' && (
                <p className="mt-1 text-xs text-destructive/60">Debug: {(state.error as any)?.details}</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="lastName" className="mb-1 block text-sm text-default-900">
            Last name<span className="ml-1 text-primary">*</span>
          </Label>
          <Input
            type="text"
            name="lastName"
            placeholder="Last Name"
            required
            className="h-10 whitespace-nowrap rounded-md"
          />
        </div>
        <div>
          <Label htmlFor="firstName" className="mb-1 block text-sm text-default-900">
            First name<span className="ml-1 text-primary">*</span>
          </Label>
          <Input
            type="text"
            name="firstName"
            placeholder="First Name"
            required
            className="h-10 whitespace-nowrap rounded-md"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="email" className="mb-1 block text-sm text-default-900">
          Email<span className="ml-1 text-primary">*</span>
        </Label>
        <Input
          type="email"
          name="email"
          placeholder="Enter your email"
          required
          className="mb-4 h-10 whitespace-nowrap rounded-md"
        />
      </div>

      <div>
        <Label htmlFor="password" className="mb-1 block text-sm text-default-900">
          Password<span className="ml-1 text-primary">*</span>
        </Label>
        <Input
          type="password"
          name="password"
          placeholder="Enter your password"
          required
          minLength={6}
          className="h-10 whitespace-nowrap rounded-md"
        />
      </div>

      <AgreementForm onAgreeAll={setIsAgreed} />

      <SubmitButton variant="primary" disabled={!isAgreed} pendingText="Creating account..." className="w-full">
        Create Account
      </SubmitButton>
    </form>
  );
}
