'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { CheckCircle2, Circle } from 'lucide-react';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { ToastAction } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import { createClient } from '@/utils/supabase/browser';

// TODO: 헤당 컴포넌트 다시 점검하기
export default function Password() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const { toast } = useToast();
  const supabase = createClient();
  const [isPasswordValid, setIsPasswordValid] = useState(true);

  // 현재 세션 조회
  useEffect(() => {
    const getCurrentSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          // 현재 활성화된 세션 목록 조회
          const { data: sessionData } = await supabase
            .from('user_login_history')
            .select('session_id')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (sessionData) {
            setCurrentSession(sessionData.session_id);
          }
        } else {
          setCurrentSession(null);
        }
      } catch (error) {
        console.error('세션 정보 조회 실패:', error);
        setCurrentSession(null);
      }
    };
    getCurrentSession();
  }, []);

  // 로그인 히스토리 가져오기
  const fetchLoginHistory = async () => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      console.log('로그인 기록 쿼리 user.id:', user?.id); // user.id 값 확인

      if (userError) {
        console.error('사용자 정보 조회 실패:', userError.message);
        toast({
          variant: 'destructive',
          title: '로그인 기록 조회 실패',
          description: '사용자 정보를 가져올 수 없습니다.',
        });
        return;
      }

      if (!user) {
        console.error('사용자 정보 없음');
        toast({
          variant: 'destructive',
          title: '로그인 기록 조회 실패',
          description: '로그인이 필요합니다.',
        });
        return;
      }

      const { data, error } = await supabase
        .from('user_login_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('로그인 기록 조회 실패:', error.message);
        toast({
          variant: 'destructive',
          title: '로그인 기록 조회 실패',
          description: error.message,
        });
        return;
      }

      setLoginHistory(data || []);
    } catch (error: any) {
      console.error('로그인 히스토리 조회 실패:', error.message);
      toast({
        variant: 'destructive',
        title: '로그인 기록 조회 실패',
        description: error.message || '로그인 기록을 가져오는 중 오류가 발생했습니다.',
      });
    }
  };

  // 컴포넌트 마운트 시와 세션 변경 시 로그인 히스토리 가져오기
  useEffect(() => {
    fetchLoginHistory();
  }, [currentSession]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // 폼 기본 동작 방지
    handleUpdatePassword();
  };

  const handleUpdatePassword = async () => {
    // 유효성 검사
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        variant: 'destructive',
        title: '비밀번호 변경 실패',
        description: '모든 필드를 입력해주세요.',
        action: <ToastAction altText="확인">확인</ToastAction>,
      });
      return;
    }

    // 비밀번호 일치 여부 검사
    if (newPassword !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: '비밀번호 변경 실패',
        description: '새 비밀번호가 일치하지 않습니다.',
        action: <ToastAction altText="확인">확인</ToastAction>,
      });
      return;
    }

    // 비밀번호 유효성 검사 추가
    if (!validatePassword(newPassword)) {
      toast({
        variant: 'destructive',
        title: '비밀번호 변경 실패',
        description: '비밀번호는 최소 6자 이상이며, 문자와 숫자를 모두 포함해야 합니다.',
        action: <ToastAction altText="확인">확인</ToastAction>,
      });
      return;
    }

    setIsLoading(true);

    try {
      // 먼저 현재 비밀번호로 로그인 시도하여 확인
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: (await supabase.auth.getUser()).data.user?.email || '',
        password: currentPassword,
      });

      if (signInError) {
        toast({
          variant: 'destructive',
          title: '비밀번호 변경 실패',
          description: '현재 비밀번호가 올바르지 않습니다.',
          action: <ToastAction altText="확인">확인</ToastAction>,
        });
        setIsLoading(false);
        return;
      }
      // 비밀번호 변경
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw error;
      }
      // 성공 메시지
      toast({
        variant: 'default',
        title: '비밀번호 변경 완료',
        description: '비밀번호가 성공적으로 변경되었습니다.',
      });
      // 입력 필드 초기화
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: '오류 발생',
        description: error.message || '비밀번호 변경 중 오류가 발생했습니다.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 입력값 초기화 함수
  const handleCancel = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  // 비밀번호 유효성 검사 함수
  const validatePassword = (newPassword: string) => {
    const hasMinLength = newPassword.length >= 6;
    const hasLetterAndNumber = /^(?=.*[A-Za-z])(?=.*\d)/.test(newPassword);
    return hasMinLength && hasLetterAndNumber;
  };

  // 비밀번호 입력 핸들러
  const handleNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setNewPassword(newValue);
    setIsPasswordValid(validatePassword(newValue));
  };

  return (
    <>
      <div className="mt-20 flex flex-col items-start justify-between gap-4 sm:flex-row">
        <dl className="flex flex-col gap-2">
          <dt className="text-lg font-semibold text-default-900">Password</dt>
          <dd className="text-sm">Enter your current password to update it.</dd>
        </dl>
        <div className="flex flex-shrink-0 items-center gap-4">
          <Button className="btn-md btn-default" text="Cancel" onClick={handleCancel} />
          <Button
            className="btn-md btn-primary"
            text={isLoading ? 'Updating...' : 'Update Password'}
            onClick={handleUpdatePassword}
            disabled={isLoading}
          />
        </div>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="profile-form mt-20">
          <div className="form-item">
            <div className="form-item-title">
              <dl>
                <dt>
                  Current Password<span>*</span>
                </dt>
              </dl>
            </div>
            <div className="form-item-content pr-500">
              <Input
                type="password"
                placeholder="Current Password"
                value={currentPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentPassword(e.target.value)}
              />
              <p className="msg-error">The entered password does not match. Please check and confirm.</p>
            </div>
          </div>
          <div className="form-item">
            <div className="form-item-title">
              <dl>
                <dt>
                  New Password<span>*</span>
                </dt>
              </dl>
            </div>
            <div className="form-item-content pr-500">
              <Input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={handleNewPasswordChange}
                className={`${!isPasswordValid && newPassword.length > 0 ? 'border-red-500 focus:border-red-500' : ''}`}
              />
              <ul className="password-Feedback">
                <li className={`flex items-center gap-2 ${newPassword.length >= 6 ? 'text-brand' : 'text-gray-400'}`}>
                  {newPassword.length >= 6 ? (
                    <CheckCircle2 className="h-4 w-4 transition-all duration-200" />
                  ) : (
                    <Circle className="h-4 w-4 transition-all duration-200" />
                  )}
                  Minimum 6 characters
                </li>
                <li
                  className={`flex items-center gap-2 ${/^(?=.*[A-Za-z])(?=.*\d)/.test(newPassword) ? 'text-brand' : 'text-gray-400'}`}
                >
                  {/^(?=.*[A-Za-z])(?=.*\d)/.test(newPassword) ? (
                    <CheckCircle2 className="h-4 w-4 transition-all duration-200" />
                  ) : (
                    <Circle className="h-4 w-4 transition-all duration-200" />
                  )}
                  Including letters and numbers
                </li>
              </ul>
            </div>
          </div>
          <div className="form-item">
            <div className="form-item-title">
              <dl>
                <dt>
                  Confirm New Password<span>*</span>
                </dt>
              </dl>
            </div>
            <div className="form-item-content pr-500">
              <Input
                type="password"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
              />
              <p className="msg-error">The entered password does not match. Please check and confirm.</p>
            </div>
          </div>
        </div>
        <div className="mt-16 flex items-start justify-between">
          <dl className="flex flex-col gap-2">
            <dt className="text-lg font-semibold text-default-900">로그인 기록</dt>
            <dd className="text-sm">최근 로그인한 기기 목록입니다.</dd>
          </dl>
        </div>
      </form>
      <div className="profile-form mt-20">
        {loginHistory.map((history) => (
          <div key={history.id} className="form-item pl-20">
            <div className="flex items-center gap-20">
              <Image width={30} height={30} src="/image/ico-desktop.svg" alt="desktop" />
              <dl className="flex flex-col gap-2">
                <dt className="flex items-center gap-8 text-lg font-semibold text-default-900">
                  {history.user_agent?.split('/')?.[0] || '알 수 없는 기기'}
                  {history.session_id === currentSession && (
                    <span className="current-device">
                      <Image width={16} height={16} src="/image/ico-dot-green.svg" alt="" />
                      <span>현재 기기</span>
                    </span>
                  )}
                </dt>
                <dd className="text-sm">
                  {history.ip_address}, {history.user_agent} •{' '}
                  {new Date(history.created_at).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </dd>
              </dl>
            </div>
            {/* {history.session_id !== currentSession && (
              <button
                onClick={() => handleDeviceLogout(history.session_id)}
                className="gap-15 mt-10 flex items-center font-medium text-default-400 hover:text-accent-700"
              >
                <span>이 기기에서 로그아웃</span>
                <Image width={20} height={20} src="/image/ico-logout-device.svg" alt="logout" />
              </button>
            )} */}
          </div>
        ))}
      </div>
    </>
  );
}
