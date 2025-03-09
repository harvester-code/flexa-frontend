import { redirect } from 'next/navigation';
import Footer from '@/components/Footer';
import SideNavigation from '@/components/SideNavigation';
import { createClient } from '@/lib/supabase-server';

// FIXME: 레이아웃 통일하기
async function ProtectedLayout({ children }: { children: React.ReactNode }) {
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
    id: userInfo.user_id,
    email: userInfo?.email || '',
    firstName: userInfo?.first_name,
    lastName: userInfo?.last_name,
    fullName: `${userInfo.first_name} ${userInfo.last_name}`.trim(),
    initials: `${userInfo.last_name?.[0] || ''}${userInfo.first_name?.[0] || ''}` || '-',
    profileImageUrl: userInfo?.profile_image_url,
    position: userInfo?.position,
    introduction: userInfo?.bio,
    groupId: userInfo.group_id,
    roleId: userInfo.role_id,
    createdAt: userInfo.created_at,
    updatedAt: userInfo.updated_at,
  };

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return (
    <>
      <SideNavigation userInfo={enrichedUserInfo} session={session} />
      <div className="ml-[100px]">
        <section className="mx-auto max-w-[1340px] px-[30px]">{children}</section>
        <Footer />
      </div>
    </>
  );
}

export default ProtectedLayout;
