'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useUser } from '@/queries/userQueries';
import Password from './_components/Password';
import Profile from './_components/Profile';
import TabDefault from './_components/TabDefault';

export default function ProfilePage() {
  const tabs: { text: string; number?: number }[] = [{ text: 'Profile' }, { text: 'Password' }];

  const { data: userInfo, isLoading } = useUser();

  const [currentTab, setCurrentTab] = useState(0);

  // background: linear-gradient(180deg, #f9f5ff 0%, #d6bbfb 100%);
  return (
    <>
      <div className="profile-wrap max-w-page px-page-x pb-page-b -m-9 mx-auto">
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

        <TabDefault
          tabCount={2}
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          tabs={tabs.map((tab) => ({ text: tab.text }))}
          className={`mt-16 grid-cols-2`}
        />
        {currentTab === 0 ? <Profile /> : <Password />}
      </div>
    </>
  );
}
