'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { handleAuthError, validateCredentials, validateSignUpData } from '@/lib/auth/error-handler';
import { createClient } from '@/lib/auth/server';

// 저장된 이메일 가져오기
export async function getSavedEmail() {
  const cookieStore = await cookies();
  const savedEmail = cookieStore.get('savedEmail');
  return savedEmail?.value || '';
}

export const signInAction = async (prevState: any, formData: FormData) => {
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

export const signUpAction = async (prevState: any, formData: FormData) => {
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
