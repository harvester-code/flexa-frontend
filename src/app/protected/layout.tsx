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
  const userInfo = {
    fullName: user?.user_metadata?.full_name || 'User',
    email: user?.email || '',
    firstName: user?.user_metadata?.first_name,
    lastName: user?.user_metadata?.last_name,
    profileImage: user?.user_metadata?.profile_image,
    initials:
      `${user?.user_metadata?.last_name?.[0] || ''}${user?.user_metadata?.first_name?.[0] || ''}` || '-',
  };

  const {
    data: { session }
  } = await supabase.auth.getSession();
  
  return (
    <div>
      <SideNavigation userInfo={userInfo} session={session} />
      <div id="container">
        <section id="content">{children}</section>
        <Footer />
      </div>
    </div>
  );
}
