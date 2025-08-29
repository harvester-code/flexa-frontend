import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { RegisterForm } from './_components/register-form';

export default function RegisterPage() {
  return (
    <div
      className="relative flex min-h-svh items-center justify-center xl:justify-between"
      style={{
        background: 'linear-gradient(180deg, rgba(175, 82, 222, 0.15) 0%, rgba(0, 122, 255, 0.15) 100%), #fff',
      }}
    >
      <div className="hidden xl:block">
        <video autoPlay muted playsInline loop className="min-h-svh w-full object-cover">
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
        className="w-full max-w-md rounded-lg px-10 pb-28 pt-14 shadow-md xl:flex xl:min-h-svh xl:max-w-[35rem] xl:flex-col xl:justify-center xl:rounded-none xl:border-l-2 xl:border-white xl:px-10 xl:shadow-none"
        style={{
          background: 'rgba(255, 255, 255, 0.4)',
          backdropFilter: 'blur(45px)',
        }}
      >
        <div>
          <div className="mb-6">
            <Button asChild variant="ghost">
              <Link href="/auth/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Link>
            </Button>
            
            <h2 className="mb-2 text-lg font-semibold text-primary-900" style={{ lineHeight: '100%' }}>
              Create your account
            </h2>
            <p className="text-sm text-primary-900">Join Flexa to optimize your airport operations.</p>
          </div>

          <RegisterForm />

          <div className="mt-6 text-center">
            <p className="text-sm text-primary-900">
              Already have an account?{' '}
              <Link href="/auth/login" className="font-semibold text-primary underline underline-offset-2">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <p className="absolute bottom-4 left-0 right-0 text-center text-sm text-secondary">
          © Flexa all rights reserved
        </p>
      </div>
    </div>
  );
}
