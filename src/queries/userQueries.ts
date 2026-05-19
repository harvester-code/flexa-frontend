import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/auth/client';
import type { User, UserRole } from '@/types/userTypes';

const supabase = createClient();

const fetchUser = async () => {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    throw new Error(sessionError.message);
  }

  const userId = session?.user?.id;

  if (!userId) {
    throw new Error('존재하지 않는 유저입니다.');
  }

  const { data, error } = await supabase
    .from('user_information')
    .select('user_id, email, role')
    .eq('user_id', userId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const user: User = {
    id: data.user_id,
    email: data.email || '',
    role: (data.role || 'operator') as UserRole,
  };

  return user;
};

const useUser = () => {
  return useQuery({
    queryKey: ['user'],
    queryFn: fetchUser,
    refetchOnWindowFocus: false,
  });
};

export { useUser };
