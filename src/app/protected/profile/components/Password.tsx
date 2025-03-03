'use client';

import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase-client';
import { CheckCircle2, Circle } from 'lucide-react';
import { useState } from 'react';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { ToastAction } from '@/components/ui/toast';

export default function Password() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();
  const [isPasswordValid, setIsPasswordValid] = useState(true);

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
                <li
                  className={`flex items-center gap-2 ${newPassword.length >= 6 ? 'text-brand' : 'text-gray-400'}`}
                >
                  {newPassword.length >= 6 ? (
                    <CheckCircle2 className="h-7 w-7 transition-all duration-200" />
                  ) : (
                    <Circle className="h-7 w-7 transition-all duration-200" />
                  )}
                  Minimum 6 characters
                </li>
                <li
                  className={`flex items-center gap-2 ${/^(?=.*[A-Za-z])(?=.*\d)/.test(newPassword) ? 'text-brand' : 'text-gray-400'}`}
                >
                  {/^(?=.*[A-Za-z])(?=.*\d)/.test(newPassword) ? (
                    <CheckCircle2 className="h-7 w-7 transition-all duration-200" />
                  ) : (
                    <Circle className="h-7 w-7 transition-all duration-200" />
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
            <dt className="text-lg font-semibold text-default-900">Login History</dt>
          </dl>
        </div>
        <div className="profile-form mt-20">
          <div className="form-item pl-20">
            <div className="flex items-start gap-20">
              <img src="/image/ico-desktop.svg" alt="desktop" />
              <dl className="flex flex-col gap-2">
                <dt className="flex items-center gap-8 text-lg font-semibold text-default-900">
                  2018 Macbook Pro 15-inch
                  <span className="current-device">
                    <img src="/image/ico-dot-green.svg" alt="" />
                    <span>Current Device</span>
                  </span>
                </dt>
                <dd className="text-sm">193.186.4.321, Mac OS • 22 Jan at 10:40am</dd>
              </dl>
            </div>
          </div>
          <div className="form-item pl-20">
            <div className="flex items-start gap-20">
              <img src="/image/ico-desktop.svg" alt="desktop" />
              <dl className="flex flex-col gap-2">
                <dt className="flex items-center gap-8 text-lg font-semibold text-default-900">
                  2018 Macbook Pro 15-inch
                </dt>
                <dd className="text-sm">193.186.4.321, Mac OS • 22 Jan at 10:40am</dd>
              </dl>
            </div>
            <button className="gap-15 mt-10 flex items-center font-medium text-default-400 hover:text-accent-700">
              <span>Log out from this devide</span>
              <img src="/image/ico-logout-device.svg" alt="logout" />
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
