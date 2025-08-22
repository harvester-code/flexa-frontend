'use server';

import { cookies } from 'next/headers';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/auth/server';

// 저장된 이메일 가져오기
export async function getSavedEmail() {
  const cookieStore = await cookies();
  const savedEmail = cookieStore.get('savedEmail');
  return savedEmail?.value || '';
}

export const signInAction = async (formData: FormData) => {
  if (!formData.get('email') || !formData.get('password')) {
    return redirect('/auth/login?error-message=email-and-password-are-required');
  }
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const rememberMe = formData.get('rememberMe') === 'on';

  const supabase = await createClient();
  const cookieStore = await cookies();

  // 이메일 저장 처리
  if (rememberMe) {
    cookieStore.set('savedEmail', email, {
      maxAge: 30 * 24 * 60 * 60, // 30일
      path: '/',
    });
  } else {
    cookieStore.delete('savedEmail');
  }

  // 이메일 형식 검증
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return redirect('/auth/login?error-message=invalid-email-format');
  }
  // 비밀번호 최소 길이 검증
  if (password.length < 6) {
    return redirect('/auth/login?error-message=password-must-be-at-least-6-characters');
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  // TODO: 에러 케이스에 따른 핸들링 추가하기
  if (error) {

    return redirect('/auth/login?error-message=login-failed');
  }

  return redirect('/home');
};

export const signUpAction = async (formData: FormData) => {
  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const supabase = await createClient();
  const origin = (await headers()).get('origin');
  const formattedFirstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
  const formattedLastName = lastName.charAt(0).toUpperCase() + lastName.slice(1).toLowerCase();

  // 필수 필드 검증
  if (!firstName || !lastName || !email || !password) {
    return redirect('/auth/register?error-message=All fields are required');
  }

  // 이름 길이 검증
  if (firstName.length < 2 || lastName.length < 2) {
    return redirect('/auth/register?error-message=Names must be at least 2 characters');
  }

  // 이름에 공백이 있는지 검증
  if (firstName.includes(' ') || lastName.includes(' ')) {
    return redirect('/auth/register?error-message=Name cannot contain spaces');
  }

  // 비밀번호 길이 검증
  if (password.length < 6) {
    return redirect('/auth/register?error-message=Password must be at least 6 characters');
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/auth/register/success`,
      data: {
        first_name: formattedFirstName,
        last_name: formattedLastName,
        full_name: `${formattedFirstName} ${formattedLastName}`,
      },
    },
  });

  if (error) {
    console.error(error.code + ' ' + error.message);
    return redirect('/auth/register?error-message=' + error.message);
  }

  return redirect('/auth/register/success/?email=' + email);
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
