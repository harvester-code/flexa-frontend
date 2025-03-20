import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/browser';

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

  const { data, error } = await supabase.from('user_info').select('*').eq('user_id', userId).single();

  if (error) {
    throw new Error(error.message);
  }

  const user = {
    id: data?.user_id,
    email: data?.email || '',
    firstName: data?.first_name,
    lastName: data?.last_name,
    fullName: `${data?.first_name} ${data?.last_name}`.trim(),
    initials: `${data?.last_name?.[0] || ''}${data?.first_name?.[0] || ''}` || '-',
    profileImageUrl: data?.profile_image_url,
    position: data?.position,
    introduction: data?.bio,
    groupId: data?.group_id || undefined,
    roleId: data?.role_id,
    createdAt: data?.created_at,
    updatedAt: data?.updated_at,
  };

  return user;
};

const useUser = () => {
  return useQuery({
    queryKey: ['user'],
    queryFn: fetchUser,
  });
};

export { useUser };
