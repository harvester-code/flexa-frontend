'use client';

import { useState } from 'react';
import { Lock, User } from 'lucide-react';
import { useUser } from '@/queries/userQueries';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import Password from './_components/Password';
import Profile from './_components/Profile';

export default function ProfilePage() {
  const { data: userInfo, isLoading } = useUser();

  return (
    <div className="profile-wrap -m-9 mx-auto max-w-page px-page-x pb-page-b">
      <div className="profile-header">
        <div className="profile-img">
          <p className="flex h-40 w-40 items-center justify-center rounded-full bg-muted text-lg font-semibold text-default-900">
            {userInfo?.firstName?.[0]?.toUpperCase() || 'U'}
            {userInfo?.lastName?.[0]?.toUpperCase() || ''}
          </p>
        </div>
        <dl className="profile-info">
          <dt>{userInfo?.fullName}</dt>
          <dd>{userInfo?.email}</dd>
        </dl>
      </div>

      <Tabs defaultValue="profile" className="mt-16">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="password" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Password
          </TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <Profile />
        </TabsContent>
        <TabsContent value="password">
          <Password />
        </TabsContent>
      </Tabs>
    </div>
  );
}
