import Image from 'next/image';
import Link from 'next/link';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { forgotPasswordAction } from '@/actions/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { SubmitButton } from '@/components/ui/SubmitButton';

export default function ForgotPasswordPage() {
  return (
    <div className="signUpContainer">
      <h1>
        <Image src="/image/img-logo.svg" alt="logo" width={100} height={100} />
      </h1>
      <h2 className="title mt-60">Find Password</h2>
      <p className="mt-10 font-medium">Don&apos;t worry. we&apos;ll send you a link to reset it.</p>
      <form className="signUpForm">
        <Label htmlFor="email" className="text-sm">
          Email
        </Label>
        <Input
          className="mt-[25px] flex h-[40px] items-center justify-center whitespace-nowrap rounded-md"
          name="email"
          placeholder="Enter your Email"
          required
        />
        <SubmitButton variant="btn-brand" formAction={forgotPasswordAction}>
          Send Request
        </SubmitButton>
      </form>
      <Button asChild variant="btn-link" className="mt-30">
        <Link href="/">
          <FontAwesomeIcon className="nav-icon" icon={faArrowLeft} />
          Back to Login
        </Link>
      </Button>
    </div>
  );
}
