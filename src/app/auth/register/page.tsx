import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { RegisterForm } from './_components/register-form';

export default function RegisterPage() {
  return (
    <div className="relative flex min-h-svh items-center justify-center bg-gradient-to-b from-primary/15 via-background to-primary/10 xl:justify-between">
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

      <div className="w-full max-w-md rounded-lg bg-background/40 px-10 pb-28 pt-14 shadow-md backdrop-blur-3xl xl:flex xl:min-h-svh xl:max-w-[35rem] xl:flex-col xl:justify-center xl:rounded-none xl:border-l-2 xl:border-background xl:px-10 xl:shadow-none">
        <div>
          <div className="mb-6">
            <Button asChild variant="outline">
              <Link href="/auth/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Link>
            </Button>

            <h2 className="mb-2 text-lg font-semibold leading-none text-default-900">Create your account</h2>
            <p className="text-sm text-default-900">Join Flexa to optimize your airport operations.</p>
          </div>

          <RegisterForm />

          <div className="mt-6 text-center">
            <p className="text-sm text-default-900">
              Already have an account?{' '}
              <Link href="/auth/login" className="font-semibold text-primary underline underline-offset-2">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <p className="absolute bottom-4 left-0 right-0 text-center text-sm text-muted-foreground">
          © Flexa all rights reserved
        </p>
      </div>
    </div>
  );
}
