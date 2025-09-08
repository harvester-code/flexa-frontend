'use client';

import { useEffect, useState } from 'react';
import { Briefcase, FileText, Mail, Save, User, X } from 'lucide-react';
import { useUser } from '@/queries/userQueries';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useToast } from '@/hooks/useToast';
import { createClient } from '@/lib/auth/client';

export default function Profile() {
  const { toast } = useToast();

  const { data: userInfo, isLoading } = useUser();

  const [firstName, setFirstName] = useState(userInfo?.firstName || '');
  const [lastName, setLastName] = useState(userInfo?.lastName || '');
  const [email, setEmail] = useState(userInfo?.email || '');

  const [position, setPosition] = useState(userInfo?.position || '');
  const [introduction, setIntroduction] = useState(userInfo?.introduction || '');

  // userInfo가 변경될 때마다 상태 업데이트
  useEffect(() => {
    if (userInfo) {
      setFirstName(userInfo.firstName || '');
      setLastName(userInfo.lastName || '');
      setEmail(userInfo.email || '');
      setPosition(userInfo.position || '');
      setIntroduction(userInfo.introduction || '');
    }
  }, [userInfo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();

    const { data, error } = await (supabase as any)
      .from('user_information')
      .update({
        first_name: firstName,
        last_name: lastName,
        position: position,
        introduction: introduction,
      })
      // FIXME: 느낌표 없애기
      .eq('user_id', userInfo!.id)
      .select()
      .single();

    if (!error && data) {
      toast({
        title: 'Successfully updated!',
        description: 'Your profile information has been updated successfully.',
      });
    }
  };

  const handleCancel = () => {
    // 취소 로직 (예: 초기값으로 되돌리기)
    setFirstName(userInfo?.firstName || '');
    setLastName(userInfo?.lastName || '');
    setPosition(userInfo?.position || '');
    setIntroduction(userInfo?.introduction || '');
  };

  return (
    <>
      <div className="mt-20 flex items-start justify-between">
        <dl className="flex flex-col gap-2">
          <dt className="text-lg font-semibold text-default-900">Personal Information</dt>
          <dd className="text-sm">Update your detailed personal information.</dd>
        </dl>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="default" onClick={handleCancel}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button variant="primary" size="default" onClick={(e) => handleSubmit(e)}>
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
        </div>
      </div>
      <div className="profile-form mt-20">
        <div className="form-item">
          <div className="form-item-title">
            <dl>
              <dt>
                Name<span>*</span>
              </dt>
            </dl>
          </div>
          <div className="form-item-content">
            <div className="grid grid-cols-2 items-start justify-between gap-6">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLastName(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="form-item">
          <div className="form-item-title">
            <dl>
              <dt>
                Email Address<span>*</span>
              </dt>
              <dd>You cannot change your email address.</dd>
            </dl>
          </div>
          <div className="form-item-content space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                className="pl-10"
                readOnly
              />
            </div>
          </div>
        </div>

        <div className="form-item">
          <div className="form-item-title">
            <dl>
              <dt>Position</dt>
            </dl>
          </div>
          <div className="form-item-content space-y-2">
            <Label htmlFor="position">Position</Label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="position"
                type="text"
                placeholder="Position"
                value={position}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPosition(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
        <div className="form-item">
          <div className="form-item-title">
            <dl>
              <dt>Introduction</dt>
              <dd>Write a brief summary of the purpose of using the solution and your responsibilities.</dd>
            </dl>
          </div>
          <div className="form-item-content space-y-2">
            <Label htmlFor="introduction" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Introduction
            </Label>
            <textarea
              id="introduction"
              placeholder="Write a brief summary..."
              value={introduction}
              onChange={(e) => setIntroduction((e.target as HTMLInputElement | HTMLTextAreaElement).value)}
              rows={4}
              maxLength={275}
              className="flex min-h-[80px] w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <p className="text-xs text-muted-foreground">{275 - introduction.length} characters remaining</p>
          </div>
        </div>
      </div>
    </>
  );
}
