'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useUser } from '@/queries/userQueries';
import TabDefault from '@/components/TabDefault';
import Password from './_components/Password';
import Profile from './_components/Profile';

export default function ProfilePage() {
  const tabs: { text: string; number?: number }[] = [{ text: 'Profile' }, { text: 'Password' }];

  const { data: userInfo, isLoading } = useUser();

  const [currentTab, setCurrentTab] = useState(0);

  // background: linear-gradient(180deg, #f9f5ff 0%, #d6bbfb 100%);
  return (
    <>
      <div className="-z-50 max-h-52 w-full overflow-hidden">
        <Image src="https://picsum.photos/2000" alt="thumbnail" width={2440} height={210} />
      </div>

      <div className="profile-wrap -m-9 mx-auto max-w-[1340px] px-[30px] pb-24">
        <div className="profile-header">
          <div className="profile-img">
            <p>
              <Image
                src={userInfo?.profileImageUrl || 'https://picsum.photos/200'}
                alt="thumbnail"
                width={200}
                height={200}
              />
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
