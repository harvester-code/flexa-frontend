import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export const updateSession = async (request: NextRequest) => {
  try {
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

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

            response = NextResponse.next({ request });

            cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isPublicRoute = request.nextUrl.pathname.startsWith('/auth') || request.nextUrl.pathname === '/';
    const isProtectedRoute = request.nextUrl.pathname.startsWith('/home') || 
                             request.nextUrl.pathname.startsWith('/profile') ||
                             request.nextUrl.pathname.startsWith('/admin');

    // 보호된 라우트에 비로그인 상태로 접근하는 경우만 리다이렉트
    if (isProtectedRoute && !user) {
      return NextResponse.redirect(new URL('/auth/login', request.nextUrl));
    }

    // 자동 로그인 리다이렉션 제거 - 사용자가 명시적으로 로그인할 때만 리다이렉트
    // if (isPublicRoute && user) {
    //   return NextResponse.redirect(new URL('/home', request.nextUrl));
    // }

    return response;
  } catch (e) {
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
};
