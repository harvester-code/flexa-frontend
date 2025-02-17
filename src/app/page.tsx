import { getSavedEmail, signInAction } from '@/api/auth';
import Link from 'next/link';
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
          <p className="mt-10 whitespace-nowrap">Enter your login information to access the solution.</p>
          <form>
            <Label htmlFor="email" className="mt-60 flex text-sm">
              Email
            </Label>
            <Input
              className="bg-default-50 mt-5 flex h-40 items-center justify-center whitespace-nowrap rounded-md pl-10"
              name="email"
              defaultValue={savedEmail}
              placeholder="Enter your Email"
              required
            />
            <Label htmlFor="password" className="mt-20 flex text-sm">
              Password
            </Label>
            <Input
              className="bg-default-50 mt-5 flex h-40 items-center justify-center whitespace-nowrap rounded-md pl-10"
              type="password"
              name="password"
              placeholder="Enter your password"
              minLength={6}
              required
            />
            <div className="mt-25 flex justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="rememberMe"
                  name="rememberMe"
                  defaultChecked={!!savedEmail}
                  className="h-15 w-15"
                />
                <Label htmlFor="rememberMe" className="pl-5 text-sm">
                  Save Account
                </Label>
              </div>
              <Link href="/forgot-password" className="text-brand text-sm font-semibold underline">
                Forgot Password?
              </Link>
            </div>
            <SubmitButton formAction={signInAction}>Sign In</SubmitButton>
          </form>

          <div className="mt-30 flex justify-center">
            <p className="flex gap-10 text-sm">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-brand font-semibold underline">
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
