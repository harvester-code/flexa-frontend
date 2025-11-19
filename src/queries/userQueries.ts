import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/auth/client';
import type { User, UserRole } from '@/types/userTypes';

const supabase = createClient();

const fetchUserId = async () => {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw new Error(error.message);
  }
  return data.user?.id;
};

const fetchUser = async () => {
  const userId = await fetchUserId();

  if (!userId) {
    throw new Error('존재하지 않는 유저입니다.');
  }

  const { data, error } = await supabase.from('user_information').select('*').eq('user_id', userId).single();

  if (error) {
    throw new Error(error.message);
  }

  const userData = data as any;

  const user: User = {
    id: userData?.user_id,
    email: userData?.email || '',
    firstName: userData?.first_name,
    lastName: userData?.last_name,
    fullName: `${userData?.first_name} ${userData?.last_name}`.trim(),
    initials: `${userData?.last_name?.[0] || ''}${userData?.first_name?.[0] || ''}` || '-',
    profileImageUrl: userData?.profile_image_url,
    position: userData?.position,
    introduction: userData?.bio,
    groupId: userData?.group_id || undefined,
    roleId: userData?.role_id,
    role: (userData?.role || 'operator') as UserRole,
    createdAt: userData?.created_at,
    updatedAt: userData?.updated_at,
  };

  return user;
};

const useUser = () => {
  return useQuery({
    queryKey: ['user'],
    queryFn: fetchUser,
    // staleTime, gcTime은 전역 기본값 사용 (5분 캐싱)
    refetchOnWindowFocus: false, // 윈도우 포커스 시 refetch 비활성화
  });
};

export { useUser };
