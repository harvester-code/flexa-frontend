import Image from 'next/image';
import Link from 'next/link';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { resetPasswordAction } from '@/actions/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { SubmitButton } from '@/components/ui/SubmitButton';

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
          New Password<span className="ml-5 text-primary">*</span>
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
          Confirm Password<span className="ml-5 text-primary">*</span>
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
        <SubmitButton variant="primary" formAction={resetPasswordAction}>
          Reset password
        </SubmitButton>
      </form>
      <Button asChild variant="link" className="mt-30">
        <Link href="/">
          <FontAwesomeIcon className="nav-icon" icon={faArrowLeft} />
          Back to Login
        </Link>
      </Button>
    </div>
  );
}
