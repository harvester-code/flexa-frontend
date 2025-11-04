'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/auth/server';

interface AuthActionState {
  error?: {
    message: string;
  };
}

export const signInAction = async (
  _prevState: AuthActionState | null,
  formData: FormData
): Promise<AuthActionState | null> => {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: { message: error.message } };
  }

  revalidatePath('/', 'layout');
  redirect('/home');
};

export const signUpAction = async (
  _prevState: AuthActionState | null,
  formData: FormData
): Promise<AuthActionState | null> => {
  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const supabase = await createClient();
  const origin = (await headers()).get('origin');

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/confirm?next=/home`,
      data: {
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`,
      },
    },
  });

  if (error) {
    return { error: { message: error.message } };
  }

  // 이메일 확인이 필수이므로 즉시 로그아웃
  await supabase.auth.signOut();

  revalidatePath('/', 'layout');
  redirect('/auth/register/success?email=' + encodeURIComponent(email));
};

export const signOutAction = async () => {
  const supabase = await createClient();
  
  // 세션 완전히 제거
  await supabase.auth.signOut();
  
  // 모든 쿠키 제거를 위한 추가 처리
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  
  // Supabase 관련 쿠키 모두 제거
  const allCookies = cookieStore.getAll();
  allCookies.forEach(cookie => {
    if (cookie.name.includes('supabase') || cookie.name.includes('sb-')) {
      cookieStore.delete(cookie.name);
    }
  });
  
  revalidatePath('/', 'layout');
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
