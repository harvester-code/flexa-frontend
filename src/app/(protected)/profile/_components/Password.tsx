'use client';

import { useState } from 'react';
import { CheckCircle2, Circle, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ToastAction } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import { createClient } from '@/lib/auth/client';

export default function Password() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();
  const [isPasswordValid, setIsPasswordValid] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleUpdatePassword();
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        variant: 'destructive',
        title: '비밀번호 변경 실패',
        description: '모든 필드를 입력해주세요.',
        action: <ToastAction altText="확인">확인</ToastAction>,
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: '비밀번호 변경 실패',
        description: '새 비밀번호가 일치하지 않습니다.',
        action: <ToastAction altText="확인">확인</ToastAction>,
      });
      return;
    }

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
      const {
        data: { session: authSession },
      } = await supabase.auth.getSession();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: authSession?.user?.email || '',
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

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw error;
      }

      toast({
        variant: 'default',
        title: '비밀번호 변경 완료',
        description: '비밀번호가 성공적으로 변경되었습니다.',
      });
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

  const handleCancel = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const validatePassword = (password: string) => {
    const hasMinLength = password.length >= 6;
    const hasLetterAndNumber = /^(?=.*[A-Za-z])(?=.*\d)/.test(password);
    return hasMinLength && hasLetterAndNumber;
  };

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
          <dd className="text-sm font-normal">Enter your current password to update it.</dd>
        </dl>
        <div className="flex flex-shrink-0 items-center gap-3">
          <Button variant="outline" size="default" onClick={handleCancel}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button variant="primary" size="default" onClick={handleUpdatePassword} disabled={isLoading}>
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? 'Updating...' : 'Update Password'}
          </Button>
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
            <div className="form-item-content">
              <Input
                type="password"
                placeholder="Current Password"
                value={currentPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentPassword(e.target.value)}
              />
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
            <div className="form-item-content">
              <Input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={handleNewPasswordChange}
                className={`${!isPasswordValid && newPassword.length > 0 ? 'border-destructive focus:border-destructive' : ''}`}
              />
              <ul className="mt-2.5 flex flex-col gap-2.5">
                <li
                  className={`flex items-center gap-2 ${newPassword.length >= 6 ? 'text-primary' : 'text-muted-foreground'}`}
                >
                  {newPassword.length >= 6 ? (
                    <CheckCircle2 className="h-4 w-4 transition-all duration-200" />
                  ) : (
                    <Circle className="h-4 w-4 transition-all duration-200" />
                  )}
                  Minimum 6 characters
                </li>
                <li
                  className={`flex items-center gap-2 ${/^(?=.*[A-Za-z])(?=.*\d)/.test(newPassword) ? 'text-primary' : 'text-muted-foreground'}`}
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
            <div className="form-item-content">
              <Input
                type="password"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
        </div>
      </form>
    </>
  );
}
