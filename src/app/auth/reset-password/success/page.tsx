'use client';

import { useRouter } from 'next/navigation';
import { CheckCircle2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function ResetPasswordSuccess() {
  const router = useRouter();
  return (
    <div className="signUpContainer">
      <h1>
        <Shield className="mx-auto h-24 w-24 text-primary" />
      </h1>
      <h2 className="title mt-60">Password reset Comlete</h2>
      <p className="mt-10 font-medium">Your password has been successfully reset!</p>
      <p className="mt-15 font-medium">Click below to log in</p>
      <div className="w-360 mt-20">
        <div className="flex justify-center">
          <CheckCircle2 className="h-24 w-24 text-primary" />
        </div>
        <Button className="mt-55 w-full" variant="primary" onClick={() => router.push('/auth/login')}>
          Back to Login
        </Button>
      </div>
    </div>
  );
}
