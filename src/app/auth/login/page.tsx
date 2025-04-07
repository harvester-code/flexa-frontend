import Image from 'next/image';
import Link from 'next/link';
import { getSavedEmail, signInAction } from '@/actions/auth';
import { SubmitButton } from '@/components/SubmitButton';
import { Checkbox } from '@/components/ui/Checkbox';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

// TODO: 로그인 에러에 대해서 사용자에게 안내하는 UI 필요
export default async function LoginPage() {
  const savedEmail = await getSavedEmail();

  return (
    <div
      className="relative flex min-h-svh items-center justify-center xl:justify-between"
      style={{
        background: 'linear-gradient(180deg, rgba(175, 82, 222, 0.15) 0%, rgba(0, 122, 255, 0.15) 100%), #fff',
      }}
    >
      <div className="-mt-16 hidden flex-1 xl:block">
        <div className="mb-16 flex justify-center">
          <Image src="/image/img-logo.svg" alt="logo" width={120} height={100} />
        </div>

        <video autoPlay muted playsInline loop className="mx-auto w-full max-w-[90%] rounded-lg shadow">
          <source
            src="https://flexa-dev-ap-northeast-2-data-storage.s3.ap-northeast-2.amazonaws.com/videos/flexa-hero-video-long.webm"
            type="video/webm"
          />
          <source
            src="https://flexa-dev-ap-northeast-2-data-storage.s3.ap-northeast-2.amazonaws.com/videos/flexa-hero-video-long.mp4"
            type="video/mp4"
          />
          Your browser does not support video.
        </video>
      </div>

      <div
        className="rounded-lg px-10 pb-28 pt-14 shadow-md xl:flex xl:min-h-svh xl:w-full xl:max-w-[35rem] xl:flex-col xl:justify-center xl:rounded-none xl:border-l-2 xl:border-white xl:px-20 xl:shadow-none"
        style={{
          background: 'rgba(255, 255, 255, 0.4)',
          backdropFilter: 'blur(45px)',
        }}
      >
        <div>
          <h2 className="mb-2 text-[2.5rem] font-bold text-brand" style={{ lineHeight: '100%' }}>
            Log in
          </h2>

          <p className="mb-10 whitespace-nowrap">Enter your login information to access the solution.</p>

          <form>
            <Label htmlFor="email" className="mb-1 block text-sm">
              Email
            </Label>
            <Input
              className="mb-4 h-10 whitespace-nowrap rounded-md bg-default-50"
              name="email"
              defaultValue={savedEmail}
              placeholder="Enter your Email"
              required
            />

            <Label htmlFor="password" className="mb-1 block text-sm">
              Password
            </Label>
            <Input
              className="mb-4 h-10 whitespace-nowrap rounded-md bg-default-50"
              type="password"
              name="password"
              placeholder="Enter your password"
              minLength={6}
              required
            />

            <div className="flex justify-between text-sm">
              <div className="flex items-center gap-1">
                <Checkbox className="size-4" id="rememberMe" name="rememberMe" defaultChecked={!!savedEmail} />
                <Label htmlFor="rememberMe" className="cursor-pointer text-brand">
                  Save Account
                </Label>
              </div>

              <Link
                href="/auth/forgot-password"
                className="font-semibold text-brand underline underline-offset-2"
              >
                Forgot Password?
              </Link>
            </div>

            <SubmitButton className="mt-10" formAction={signInAction}>
              Sign In
            </SubmitButton>
          </form>

          {/* <div className="mt-[30px] flex justify-center">
            <p className="flex gap-[10px] text-sm">
              Don&apos;t have an account?{' '}
              <Link href="/auth/register" className="font-semibold text-brand underline">
                Sign Up
              </Link>
            </p>
          </div> */}
        </div>

        <p className="absolute bottom-4 left-0 right-0 text-center text-sm text-secondary">
          © Flexa all rights reserved
        </p>
      </div>
    </div>
  );
}
