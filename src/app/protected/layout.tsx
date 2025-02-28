import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import Footer from '@/components/Footer';
import SideNavigation from '@/components/SideNavigation';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  const { data: userInfo, error } = await supabase
    .from('user_info')
    .select('*')
    .eq('user_id', user.id)
    .single();

  const enrichedUserInfo = {
    ...userInfo,
    fullName: `${userInfo.first_name} ${userInfo.last_name}`.trim(),
    initials: `${userInfo.last_name?.[0] || ''}${userInfo.first_name?.[0] || ''}` || '-',
  };

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return (
    <div>
      <SideNavigation userInfo={enrichedUserInfo} session={session} />
      <div id="container">
        <section id="content">{children}</section>
        <Footer />
      </div>
    </div>
  );
}
