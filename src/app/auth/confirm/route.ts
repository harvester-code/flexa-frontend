import { type NextRequest, NextResponse } from 'next/server';
import { type EmailOtpType } from '@supabase/supabase-js';
import { createClient } from '@/lib/auth/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;

  if (token_hash && type) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error) {
      // 인증 성공 - 로그인 페이지로 성공 메시지와 함께
      return NextResponse.redirect(new URL('/auth/login?message=email-verified', request.url));
    }
  }

  // 에러 시 에러 페이지로 리다이렉트
  return NextResponse.redirect(new URL('/auth/error', request.url));
}
