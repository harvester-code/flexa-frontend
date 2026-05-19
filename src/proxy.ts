import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser()로 토큰 검증 및 세션 갱신 (Supabase 공식 권장 방식)
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // 비인증 사용자가 protected/viewer 라우트 접근 시 로그인으로 리다이렉트
  const isProtectedRoute =
    pathname.startsWith('/home') ||
    pathname.startsWith('/simulation') ||
    pathname.startsWith('/components') ||
    pathname.startsWith('/viewer');

  if (!user && isProtectedRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/auth/login';
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * 아래 경로는 제외:
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화)
     * - favicon.ico, 이미지/폰트 등 정적 에셋
     * - /auth/* (로그인, 회원가입, 비밀번호 재설정 등 공개 라우트)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2)$|auth/).*)',
  ],
};
