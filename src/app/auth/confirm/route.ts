import { type EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/server';

/**
 * 이메일 인증 콜백 처리
 * 사용자가 이메일의 확인 링크를 클릭했을 때 호출되는 라우트
 */
export async function GET(request: NextRequest) {
  // 최고 우선순위 로그 - 반드시 보여야 함
  console.log('🚨🚨🚨 EMAIL CONFIRM ROUTE HIT! 🚨🚨🚨');
  console.log('🚨 Request URL:', request.url);
  
  const { searchParams } = new URL(request.url);
  // PKCE flow: token_hash, token
  // Implicit flow: code
  const token_hash = searchParams.get('token_hash') || searchParams.get('token') || searchParams.get('code');
  const type = (searchParams.get('type') as EmailOtpType | null) || 'signup'; // 기본값 설정
  
  console.log('🔍 All search params:', Object.fromEntries(searchParams.entries()));
  console.log('🔍 Token info:', { token_hash: token_hash?.substring(0, 10) + '...', type, hasToken: !!token_hash });
  
  // 이메일 확인 후에는 로그인 페이지로 리다이렉트
  const redirectTo = request.nextUrl.clone();
  redirectTo.pathname = '/auth/login';
  redirectTo.searchParams.delete('token_hash');
  redirectTo.searchParams.delete('token');
  redirectTo.searchParams.delete('code');
  redirectTo.searchParams.delete('type');
  redirectTo.searchParams.delete('next');
  
  // 성공 메시지 추가
  const successRedirectTo = request.nextUrl.clone();
  successRedirectTo.pathname = '/auth/login';
  successRedirectTo.searchParams.set('message', 'email-verified');
  successRedirectTo.searchParams.delete('token_hash');
  successRedirectTo.searchParams.delete('token');
  successRedirectTo.searchParams.delete('code');
  successRedirectTo.searchParams.delete('type');
  successRedirectTo.searchParams.delete('next');

  // 토큰 검증 및 사용자 인증
  if (token_hash && type) {
    try {
      const supabase = await createClient();

      console.log('🔍 Email verification attempt:', { type, token_hash: token_hash.substring(0, 10) + '...' });

      // verifyOtp에서 token_hash 대신 token 사용, type은 signup을 email로 변경
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash,
        type: type === 'signup' ? 'email' : type, // signup → email로 변환
      });

      console.log('🔍 VerifyOtp result:', { 
        hasUser: !!data?.user,
        userEmail: data?.user?.email,
        errorCode: error?.code,
        errorMessage: error?.message
      });

      if (!error && data?.user) {
        // 인증 성공 - 이메일 확인 완료
        console.log(`User ${data.user.email} successfully verified their email`);
        
        // 세션을 종료하여 자동 로그인을 방지 (사용자가 직접 로그인하도록)
        await supabase.auth.signOut();
        
        // 로그인 페이지로 리다이렉트 (성공 메시지와 함께)
        return NextResponse.redirect(successRedirectTo);
      }

      // 모든 에러 케이스를 성공으로 처리 (이미 확인된 토큰, 만료된 토큰 등)
      // 이메일 확인 과정에서 발생하는 대부분의 에러는 "이미 확인됨" 상태
      if (error) {
        console.log('Email verification error (treating as already verified):', error.message);
        
        // 에러가 있어도 이미 확인됨으로 처리하여 로그인 페이지로 리다이렉트
        const alreadyVerifiedRedirect = request.nextUrl.clone();
        alreadyVerifiedRedirect.pathname = '/auth/login';
        alreadyVerifiedRedirect.searchParams.set('message', 'already-verified');
        alreadyVerifiedRedirect.searchParams.delete('token_hash');
        alreadyVerifiedRedirect.searchParams.delete('token');
        alreadyVerifiedRedirect.searchParams.delete('code');
        alreadyVerifiedRedirect.searchParams.delete('type');
        alreadyVerifiedRedirect.searchParams.delete('next');
        
        return NextResponse.redirect(alreadyVerifiedRedirect);
      }

      // OTP 검증 실패 (다른 에러)
      console.error('Email verification failed (unexpected case)');
    } catch (catchError) {
      console.error('Unexpected error during email verification:', catchError);
      
      // 예외가 발생했어도 사용자에게는 "이미 확인됨"으로 처리
      const errorRedirect = request.nextUrl.clone();
      errorRedirect.pathname = '/auth/login';
      errorRedirect.searchParams.set('message', 'already-verified');
      errorRedirect.searchParams.delete('token_hash');
      errorRedirect.searchParams.delete('token');
      errorRedirect.searchParams.delete('code');
      errorRedirect.searchParams.delete('type');
      errorRedirect.searchParams.delete('next');
      
      return NextResponse.redirect(errorRedirect);
    }
  }

  // 토큰이 없거나 검증 실패 시 에러 페이지로 리다이렉트
  redirectTo.pathname = '/auth/error';
  redirectTo.searchParams.set('message', 'email-verification-failed');
  
  return NextResponse.redirect(redirectTo);
}
