import { CheckCircle2, Shield } from 'lucide-react';
import { BackToLogin } from '@/components/BackToLogin';

export default function ResetPasswordSuccess() {
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
          <CheckCircle2 className="h-24 w-24 text-green-500" />
        </div>
        <BackToLogin className="mt-55" />
      </div>
    </div>
  );
}
