'use client';

import { useState } from 'react';
import TabDefault from '@/components/TabDefault';
import { useUserInfo } from '@/store/zustand';
import Password from './_components/Password';
import Profile from './_components/Profile';

export default function ProfilePage() {
  const tabs: { text: string; number?: number }[] = [{ text: 'Profile' }, { text: 'Password' }];

  const { userInfo } = useUserInfo();
  const [currentTab, setCurrentTab] = useState(0);

  return (
    <>
      <div className="profile-top">
        <img src="https://picsum.photos/2000" alt="thumbnail" />
      </div>
      <div className="profile-wrap">
        <div className="profile-header">
          <div className="profile-img">
            <p>
              <img src={userInfo?.profileImageUrl || 'https://picsum.photos/200'} alt="thumbnail" />
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
          tabs={tabs.map((tab) => ({ text: tab.text, number: tab.number || 0 }))}
          className={`mt-16 grid-cols-2`}
        />
        {currentTab === 0 ? <Profile /> : <Password />}
      </div>
    </>
  );
}
