'use client';

import { createClient } from '@/lib/supabase-client';
import { useUserInfo } from '@/store/zustand';
import { useRef, useState } from 'react';
import { useEffect } from 'react';
import Button from '@/components/Button';
import Input from '@/components/Input';

export default function Profile() {
  const { userInfo } = useUserInfo();

  const [firstName, setFirstName] = useState(userInfo?.firstName || '');
  const [lastName, setLastName] = useState(userInfo?.lastName || '');
  const [initials, setInitials] = useState(userInfo?.initials || '');
  const [email, setEmail] = useState(userInfo?.email || '');

  const [position, setPosition] = useState(userInfo?.position || '');
  const [introduction, setIntroduction] = useState(userInfo?.introduction || '');
  const [isActiveBold, setIsActiveBold] = useState(false);
  const [isActiveItalic, setIsActiveItalic] = useState(false);
  const [isActiveUnderline, setIsActiveUnderline] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  // 서식 적용 함수
  const applyFormat = (command: string) => {
    document.execCommand(command, false);
    // 서식 적용 후 현재 상태 확인하여 버튼 상태 업데이트
    if (command === 'bold') {
      setIsActiveBold(document.queryCommandState('bold'));
    } else if (command === 'italic') {
      setIsActiveItalic(document.queryCommandState('italic'));
    } else if (command === 'underline') {
      setIsActiveUnderline(document.queryCommandState('underline'));
    }

    // 포커스 유지
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  // contentEditable div의 내용이 변경될 때 호출
  const handleEditorChange = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;

      // HTML 태그를 제외한 순수 텍스트 길이 계산
      const textLength = content.replace(/<[^>]*>/g, '').length;

      // 글자수 제한 (275자)
      if (textLength > 275) {
        // 이전 상태로 되돌리기
        editorRef.current.innerHTML = introduction;
        return; // 함수 종료
      }

      // 글자수가 제한 이내인 경우 상태 업데이트
      setIntroduction(content);

      // 내용이 비어있는지 확인하는 조건
      const isEmpty =
        !content ||
        content === '<br>' ||
        content === '' ||
        content === '<u></u>' ||
        content === '<u><br></u>' ||
        content.replace(/<(?!br\s*\/?)[^>]+>/g, '').trim() === '';

      if (isEmpty) {
        // 모든 서식 버튼 비활성화
        setIsActiveBold(false);
        setIsActiveItalic(false);
        setIsActiveUnderline(false);

        // 에디터 내용 완전히 비우기
        editorRef.current.innerHTML = '';
      }
    }
  };
  // userInfo가 변경될 때마다 상태 업데이트
  useEffect(() => {
    if (userInfo) {
      setFirstName(userInfo.firstName || '');
      setLastName(userInfo.lastName || '');
      setInitials(userInfo.initials || '');
      setEmail(userInfo.email || '');
      setPosition(userInfo.position || '');
      setIntroduction(userInfo.introduction || '');

      // 에디터 내용도 업데이트
      if (editorRef.current) {
        editorRef.current.innerHTML = userInfo.introduction || '';
      }
    }
  }, [userInfo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();

    const { data, error } = await supabase
      .from('user_info')
      .update({
        first_name: firstName,
        last_name: lastName,
        position: position,
        bio: introduction,
      })
      .eq('user_id', userInfo?.id)
      .select()
      .single();

    if (!error && data) {
      alert('Successfully updated!');
    }
  };

  const handleCancel = () => {
    // 취소 로직 (예: 초기값으로 되돌리기)
    setFirstName(userInfo?.firstName || '');
    setLastName(userInfo?.lastName || '');
    setPosition(userInfo?.position || '');
    setIntroduction(userInfo?.introduction || '');
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
                onClick={() => {
                  setIsActiveBold(!isActiveBold);
                  applyFormat('bold');
                }}
              >
                <img src="/image/ico-bold.svg" alt="bold" />
              </button>
              <button
                type="button"
                title="Italic"
                className={isActiveItalic ? 'active' : ''}
                onClick={() => {
                  setIsActiveItalic(!isActiveItalic);
                  applyFormat('italic');
                }}
              >
                <img src="/image/ico-italic.svg" alt="italic" />
              </button>
              <button
                type="button"
                title="Underline"
                className={isActiveUnderline ? 'active' : ''}
                onClick={() => {
                  setIsActiveUnderline(!isActiveUnderline);
                  applyFormat('underline');
                }}
              >
                <img src="/image/ico-underline.svg" alt="underline" />
              </button>
            </p>
            <div
              ref={editorRef}
              contentEditable
              onInput={handleEditorChange}
              className="textarea-field h-155 mt-10 overflow-auto p-2"
              data-placeholder="Write a brief summary..."
              style={{
                minHeight: '155px',
                maxHeight: '150px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                display: 'block',
              }}
            />
            <p className="text-default-500">
              {275 - (introduction.replace(/<[^>]*>/g, '').length || 0)} characters remaining
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
