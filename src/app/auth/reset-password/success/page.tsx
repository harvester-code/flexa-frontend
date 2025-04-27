import Image from 'next/image';
import { BackToLogin } from '@/components/BackToLogin';

export default function ResetPasswordSuccess() {
  return (
    <div className="signUpContainer">
      <h1>
        <Image src="/image/img-logo.svg" alt="logo" width={100} height={100} />
      </h1>
      <h2 className="title mt-60">Password reset Comlete</h2>
      <p className="mt-10 font-medium">Your password has been successfully reset!</p>
      <p className="mt-15 font-medium">Click below to log in</p>
      <div className="w-360 mt-20">
        <div className="flex justify-center">
          <Image src="/image/ico-complete.svg" alt="" width={100} height={100} />
        </div>
        <BackToLogin className="mt-55" />
      </div>
    </div>
  );
}
