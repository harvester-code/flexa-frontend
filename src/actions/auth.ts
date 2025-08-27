'use server';

import { cookies } from 'next/headers';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/auth/server';
import { handleAuthError, validateCredentials, validateSignUpData } from '@/lib/auth/error-handler';

// 저장된 이메일 가져오기
export async function getSavedEmail() {
  const cookieStore = await cookies();
  const savedEmail = cookieStore.get('savedEmail');
  return savedEmail?.value || '';
}

export const signInAction = async (prevState: any, formData: FormData) => {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const rememberMe = formData.get('rememberMe') === 'on';

  // 입력 검증
  const validation = validateCredentials(email, password);
  if (!validation.valid) {
    return { error: validation.error };
  }

  try {
    const supabase = await createClient();
    const cookieStore = await cookies();

    // 이메일 저장 처리 (Remember Me 기능)
    if (rememberMe) {
      cookieStore.set('savedEmail', email, {
        maxAge: 30 * 24 * 60 * 60, // 30일
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
    } else {
      cookieStore.delete('savedEmail');
    }

    // Supabase Auth를 통한 로그인
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const authError = handleAuthError(error);
      return { error: authError };
    }

    // 이메일 확인 여부 체크
    if (data.user && !data.user.email_confirmed_at) {
      // 이메일 확인이 안 된 사용자는 로그아웃 처리
      await supabase.auth.signOut();
      
      return { 
        error: {
          type: 'unverified' as const,
          message: 'Please verify your email address before signing in. Check your inbox for the verification link.',
          details: 'Email verification required'
        }
      };
    }

    // 성공 시 캐시 무효화 및 리다이렉트
    revalidatePath('/', 'layout');
  } catch (error) {
    const authError = handleAuthError(error);
    return { error: authError };
  }

  // 성공 시 홈으로 리다이렉트
  redirect('/home');
};

export const signUpAction = async (prevState: any, formData: FormData) => {
  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  // 입력 검증
  const validation = validateSignUpData({ firstName, lastName, email, password });
  if (!validation.valid) {
    return { error: validation.error };
  }

  try {
    const supabase = await createClient();
    const origin = (await headers()).get('origin');
    
    // 이름 포맷팅
    const formattedFirstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
    const formattedLastName = lastName.charAt(0).toUpperCase() + lastName.slice(1).toLowerCase();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/confirm?next=/home`,
        data: {
          first_name: formattedFirstName,
          last_name: formattedLastName,
          full_name: `${formattedFirstName} ${formattedLastName}`,
        },
        // 이메일 확인이 필수임을 명시
        shouldCreateUser: true,
      },
    });

    if (error) {
      const authError = handleAuthError(error);
      return { error: authError };
    }

    // 회원가입 성공 - 임시 세션을 제거하여 자동 로그인 방지
    // (이메일 확인이 필수이므로 즉시 로그아웃)
    await supabase.auth.signOut();
    
    // 성공 시 캐시 무효화
    revalidatePath('/', 'layout');
  } catch (error) {
    const authError = handleAuthError(error);
    return { error: authError };
  }

  // 회원가입 성공 시 이메일 확인 안내 페이지로
  redirect('/auth/register/success?email=' + encodeURIComponent(email));
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect('/auth/login');
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get('email')?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get('origin');
  const callbackUrl = formData.get('callbackUrl')?.toString();

  // 이메일 필수값 검증
  if (!email) {
    return redirect('/auth/forgot-password?error-message=Email is required');
  }
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?redirect_to=/auth/reset-password`,
  });
  if (error) {
    console.error(error.message);
    return redirect('/auth/forgot-password?error-message=Could not reset password');
  }
  if (callbackUrl) {
    return redirect(callbackUrl);
  }
  return redirect(
    '/auth/forgot-password/success?email=' +
      email +
      '&success-message=Check your email for a link to reset your password.'
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  // 필수 필드 검증
  if (!password || !confirmPassword) {
    redirect('/auth/reset-password?error-message=Password and confirm password are required');
  }

  // 비밀번호 일치 검증
  if (password !== confirmPassword) {
    redirect('/auth/reset-password?error-message=Passwords do not match');
  }
  const { error } = await supabase.auth.updateUser({
    password: password,
  });
  if (error) {
    redirect('/auth/reset-password?error-message=Password update failed');
  }
  await supabase.auth.signOut();
  redirect('/auth/reset-password/success?success-message=Password updated');
};
