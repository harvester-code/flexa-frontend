import { redirect } from 'next/navigation';
import Footer from '@/components/Footer';
import SideNavigation from '@/components/SideNavigation';
import { createClient } from '@/lib/supabase-server';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  // 인증된 사용자 정보 가져오기
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

  return (
    <div>
      <SideNavigation userInfo={enrichedUserInfo} />
      <div id="container">
        <section id="content">{children}</section>
        <Footer />
      </div>
    </div>
  );
}
