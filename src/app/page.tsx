import Link from 'next/link';
import { getSavedEmail, signInAction } from '@/api/auth';
import { SubmitButton } from '@/components/SubmitButton';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default async function LoginPage() {
  const savedEmail = await getSavedEmail();

  return (
    <div className="loginContainer">
      <div className="loginImg"></div>
      <div className="loginBlock">
        <div>
          <h2 className="login-title">Log in</h2>
          <p className="mt-[10px] whitespace-nowrap">Enter your login information to access the solution.</p>
          <form>
            <Label htmlFor="email" className="mt-[60px] flex text-sm">
              Email
            </Label>
            <Input
              className="mt-[5px] flex h-[40px] items-center justify-center whitespace-nowrap rounded-md bg-default-50 pl-[10px]"
              name="email"
              defaultValue={savedEmail}
              placeholder="Enter your Email"
              required
            />
            <Label htmlFor="password" className="mt-[20px] flex text-sm">
              Password
            </Label>
            <Input
              className="mt-[5px] flex h-[40px] items-center justify-center whitespace-nowrap rounded-md bg-default-50 pl-[10px]"
              type="password"
              name="password"
              placeholder="Enter your password"
              minLength={6}
              required
            />
            <div className="mt-[25px] flex justify-between">
              <div className="flex items-center gap-[2px]">
                <Checkbox
                  id="rememberMe"
                  name="rememberMe"
                  defaultChecked={!!savedEmail}
                  className="h-[15px] w-[15px]"
                />
                <Label htmlFor="rememberMe" className="pl-[5px] text-sm">
                  Save Account
                </Label>
              </div>
              <Link href="/forgot-password" className="text-sm font-semibold text-brand underline">
                Forgot Password?
              </Link>
            </div>
            <SubmitButton formAction={signInAction}>Sign In</SubmitButton>
          </form>

          <div className="mt-[30px] flex justify-center">
            <p className="flex gap-[10px] text-sm">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="font-semibold text-brand underline">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
        <p className="copyright mt-auto">© Flexa all rights reserved</p>
      </div>
    </div>
  );
}
