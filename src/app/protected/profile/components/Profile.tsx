'use client';

import { createClient } from '@/lib/supabase-client';
import { useUserInfo } from '@/store/zustand';
import { useState } from 'react';
import Button from '@/components/Button';
import Input from '@/components/Input';

export default function Profile() {
  const { userInfo, setUserInfo } = useUserInfo();

  const [firstName, setFirstName] = useState(userInfo?.firstName || '');
  const [lastName, setLastName] = useState(userInfo?.lastName || '');
  const [initials, setInitials] = useState(userInfo?.initials || '');
  const [email, setEmail] = useState(userInfo?.email || '');

  const [position, setPosition] = useState('');
  const [introduction, setIntroduction] = useState('');
  const [isActiveBold, setIsActiveBold] = useState(false);
  const [isActiveItalic, setIsActiveItalic] = useState(false);
  const [isActiveUnderline, setIsActiveUnderline] = useState(false);
  const [isActiveList, setIsActiveList] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();

    const { data, error } = await supabase
      .from('user_info')
      .update({
        first_name: firstName,
        last_name: lastName,
      })
      .eq('user_id', userInfo?.id)
      .select()
      .single();

    if (!error && data) {
      setUserInfo({
        ...userInfo!,
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`.trim(),
      });
      alert('Successfully updated!');
    } // 여기에 Supabase에 저장하는 로직 추가
    console.log('저장할 데이터:', { firstName, lastName, email, position, introduction });
  };

  const handleCancel = () => {
    // 취소 로직 (예: 초기값으로 되돌리기)
    setFirstName(userInfo?.firstName || '');
    setLastName(userInfo?.lastName || '');
    setPosition('');
    setIntroduction('');
    setInitials(userInfo?.initials || '');
  };

  return (
    <>
      <div className="mt-20 flex items-start justify-between">
        <dl className="flex flex-col gap-2">
          <dt className="text-lg font-semibold text-default-900">Personal Information</dt>
          <dd className="text-sm">Update your detailed personal information.</dd>
        </dl>
        <div className="flex items-center gap-10">
          <Button className="btn-md btn-default" text="Cancel" onClick={handleCancel} />
          <Button className="btn-md btn-primary" text="Save" onClick={(e) => handleSubmit(e)} />
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
            <div className="grid grid-cols-2 items-center justify-between gap-10">
              <div className="flex flex-col gap-1">
                <p>First Name</p>
                <Input
                  type="text"
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFirstName(e.target.value)}
                  className="mt-5 text-default-400"
                />
              </div>
              <div className="flex flex-col gap-1">
                <p>Last Name</p>
                <Input
                  type="text"
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLastName(e.target.value)}
                  className="mt-5 text-default-400"
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
          <div className="form-item-content">
            <Input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              className="input-mail text-default-400"
              readOnly
            />
          </div>
        </div>
        <div className="form-item">
          <div className="form-item-title">
            <dl>
              <dt>
                Profile Picture
                <button>
                  <img src="/image/ico-help.svg" alt="help" />
                </button>
              </dt>
              <dd>Your uploaded photo will appear in your profile.</dd>
            </dl>
          </div>
          <div className="form-item-content">
            <div className="flex items-start gap-20">
              <p className="flex h-60 w-60 items-center justify-center overflow-hidden rounded-full border border-default-300 bg-default-25 text-lg font-semibold text-default-600">
                {initials}
                {/* <img
                  src="https://picsum.photos/200"
                  alt="thumbnail"
                  className="h-full w-full object-cover"
                /> */}
              </p>
              <button className="upload-button" type="button">
                <p>
                  <img src="/image/ico-cloud.svg" alt="upload" />
                </p>
                <p className="mt-10">
                  <span className="text-md font-semibold text-accent-700">Click to Upload</span> or Drag & Drop
                </p>
                <p className="text-xs">SVG, PNG, JPG or GIF (max. 800x400px)</p>
              </button>
            </div>
          </div>
        </div>
        <div className="form-item">
          <div className="form-item-title">
            <dl>
              <dt>Position</dt>
            </dl>
          </div>
          <div className="form-item-content">
            <Input
              type="text"
              placeholder="Position"
              value={position}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPosition(e.target.value)}
              className="text-default-400"
            />
          </div>
        </div>
        <div className="form-item">
          <div className="form-item-title">
            <dl>
              <dt>Introduction</dt>
              <dd>Write a brief summary of the purpose of using the solution and your responsibilities.</dd>
            </dl>
          </div>
          <div className="form-item-content">
            <p className="text-editor flex items-center gap-4">
              <button
                type="button"
                title="Bold"
                className={isActiveBold ? 'active' : ''}
                onClick={() => setIsActiveBold(!isActiveBold)}
              >
                <img src="/image/ico-bold.svg" alt="bold" />
              </button>
              <button
                type="button"
                title="Italic"
                className={isActiveItalic ? 'active' : ''}
                onClick={() => setIsActiveItalic(!isActiveItalic)}
              >
                <img src="/image/ico-italic.svg" alt="italic" />
              </button>
              <button
                type="button"
                title="Underline"
                className={isActiveUnderline ? 'active' : ''}
                onClick={() => setIsActiveUnderline(!isActiveUnderline)}
              >
                <img src="/image/ico-underline.svg" alt="underline" />
              </button>
              <button
                type="button"
                title="List"
                className={isActiveList ? 'active' : ''}
                onClick={() => setIsActiveList(!isActiveList)}
              >
                <img src="/image/ico-list.svg" alt="list" />
              </button>
            </p>
            <textarea
              placeholder="Write a brief summary..."
              value={introduction}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setIntroduction(e.target.value)}
              className="textarea-field h-155 mt-10"
            ></textarea>
            <p className="text-default-500">275 characters remaining</p>
          </div>
        </div>
      </div>
    </>
  );
}
