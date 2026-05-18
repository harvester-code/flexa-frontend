import { redirect } from 'next/navigation';
import { createClient } from '@/lib/auth/server';

export default async function Page() {
  const supabase = await createClient();
  // middleware가 이미 getUser()로 토큰 검증 완료 → 여기서는 getSession() (쿠키 읽기)로 충분
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.user) {
    redirect('/home');
  }

  redirect('/auth/login');
}
