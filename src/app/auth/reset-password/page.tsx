import Image from 'next/image';
import { resetPasswordAction } from '@/api/auth';
import { BackToLogin } from '@/components/BackToLogin';
import { SubmitButton } from '@/components/SubmitButton';
import { Input } from '@/components/UIs/Input';
import { Label } from '@/components/UIs/Label';

export default function ResetPassword() {
  return (
    <div className="signUpContainer">
      <h1>
        <Image src="/image/img-logo.svg" alt="logo" width={100} height={100} />
      </h1>
      <h2 className="title mt-60">Set a new password</h2>
      <p className="mt-10 font-medium">Your new Password must be different from your previous password.</p>
      <form className="signUpForm">
        <Label htmlFor="password" className="mt-[25px] flex text-sm">
          New Password<span className="ml-5 text-brand">*</span>
        </Label>
        <Input
          className="mt-[5px] flex h-[40px] items-center justify-center whitespace-nowrap rounded-md"
          type="password"
          name="password"
          placeholder="New Password"
          minLength={6}
          required
        />
        <Label htmlFor="confirmPassword" className="mt-[25px] flex text-sm">
          Confirm Password<span className="ml-5 text-brand">*</span>
        </Label>
        <Input
          className="mt-[5px] flex h-[40px] items-center justify-center whitespace-nowrap rounded-md"
          type="password"
          name="confirmPassword"
          placeholder="Confirm password"
          minLength={6}
          required
        />
        <ul className="password-Feedback">
          <li>
            <span>
              <Image src="/image/ico-feedback-03.svg" alt="" width={10} height={10} />
            </span>
            Minimum 8 characters
          </li>
          <li>
            <span>
              <Image src="/image/ico-feedback-02.svg" alt="" width={10} height={10} />
            </span>
            Including letters and numbers
          </li>
        </ul>
        <SubmitButton formAction={resetPasswordAction}>Reset password</SubmitButton>
      </form>
      <BackToLogin className="mt-30" />
    </div>
  );
}
