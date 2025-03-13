'use client';

import { useRef, useState } from 'react';
import { useEffect } from 'react';
import Image from 'next/image';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/hooks/useUser';
import { createClient } from '@/utils/supabase/browser';

export default function Profile() {
  const { toast } = useToast();

  const { data: userInfo, isLoading } = useUser();

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

  // 이미지 업로드 관련 상태 추가
  const [profileImage, setProfileImage] = useState<string | null | undefined>(userInfo?.profileImageUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setProfileImage(userInfo.profileImageUrl || '');

      // 에디터 내용도 업데이트
      if (editorRef.current) {
        editorRef.current.innerHTML = userInfo.introduction || '';
      }
    }
  }, [userInfo]);

  // 파일 선택 핸들러
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  // 드래그 앤 드롭 핸들러
  const handleDragOver = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  // 이미지 업로드 처리 함수
  const handleImageUpload = async (file: File) => {
    // 파일 유형 검증
    const validTypes = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setUploadError('지원되지 않는 파일 형식입니다. SVG, PNG, JPG 또는 GIF 파일만 업로드 가능합니다.');
      return;
    }

    // 파일 크기 검증 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('파일 크기가 너무 큽니다. 최대 5MB까지 업로드 가능합니다.');
      return;
    }

    // 이미지 크기 검증 (800x400px 제한)
    const img = new window.Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = async () => {
      URL.revokeObjectURL(objectUrl);

      if (img.width > 800 || img.height > 400) {
        setUploadError('이미지 크기가 너무 큽니다. 최대 800x400px까지 업로드 가능합니다.');
        return;
      }

      try {
        setIsUploading(true);
        setUploadError(null);

        // Supabase 스토리지에 업로드
        const supabase = createClient();
        const userId = userInfo?.id;

        if (!userId) {
          setUploadError('사용자 정보를 찾을 수 없습니다.');
          setIsUploading(false);
          return;
        }

        // 기존 이미지가 있으면 삭제
        if (profileImage) {
          const filePathMatch = profileImage.match(/\/profile_image\/(.+)$/);

          if (filePathMatch && filePathMatch[1]) {
            const oldFilePath = decodeURIComponent(filePathMatch[1]);

            // 스토리지에서 기존 파일 삭제
            const { error: removeError } = await supabase.storage.from('profile_image').remove([oldFilePath]);

            if (removeError) {
              console.error('기존 이미지 삭제 오류:', removeError);
              // 기존 이미지 삭제 실패해도 새 이미지 업로드는 계속 진행
            }
          }
        }

        // 파일 이름 생성 (중복 방지를 위해 타임스탬프 추가)
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        // 스토리지에 업로드
        const { error: uploadError } = await supabase.storage.from('profile_image').upload(filePath, file);

        if (uploadError) {
          throw new Error(uploadError.message);
        }

        // 업로드된 이미지의 공개 URL 가져오기
        const { data: publicUrlData } = supabase.storage.from('profile_image').getPublicUrl(filePath);

        const imageUrl = publicUrlData.publicUrl;

        // 사용자 정보 업데이트
        const { data, error } = await supabase
          .from('user_info')
          .update({
            profile_image_url: imageUrl,
          })
          .eq('user_id', userId)
          .select()
          .single();

        if (error) {
          throw new Error(error.message);
        }

        // 상태 업데이트
        setProfileImage(imageUrl);

        // 전역 상태 업데이트
        // FIXME: 아래 코드 다시 작성
        // if (userInfo) {
        //   setUserInfo({
        //     ...userInfo,
        //     profileImageUrl: imageUrl,
        //   });
        // }
      } catch (error) {
        console.error('이미지 업로드 오류:', error);
        setUploadError('이미지 업로드 중 오류가 발생했습니다. 다시 시도해 주세요.');
      } finally {
        setIsUploading(false);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setUploadError('이미지를 로드할 수 없습니다. 유효한 이미지 파일인지 확인해 주세요.');
    };

    img.src = objectUrl;
  };

  // 업로드 버튼 클릭 핸들러
  const handleUploadButtonClick = () => {
    fileInputRef.current?.click();
  };

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
    setInitials(userInfo?.initials || '');
    // FIXME: 느낌표 없애기
    setProfileImage(userInfo?.profileImageUrl);
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
                  <Image width={16} height={16} src="/image/ico-help.svg" alt="help" />
                </button>
              </dt>
              <dd>Your uploaded photo will appear in your profile.</dd>
            </dl>
          </div>
          <div className="form-item-content">
            <div className="flex items-start gap-20">
              <div className="flex flex-col gap-4">
                {/* 숨겨진 파일 입력 */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/svg+xml,image/png,image/jpeg,image/gif"
                  className="hidden"
                />

                {/* 업로드 버튼 */}
                <button
                  className="upload-button"
                  type="button"
                  onClick={handleUploadButtonClick}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <p className="text-base font-semibold text-accent-700">업로드 중...</p>
                  ) : (
                    <>
                      <p>
                        <Image width={70} height={70} src="/image/ico-cloud.svg" alt="upload" />
                      </p>
                      <p className="mt-1">
                        <span className="text-base font-semibold text-accent-700">Click to Upload</span> or Drag
                        & Drop
                      </p>
                      <p className="text-xs">SVG, PNG, JPG or GIF (max. 800x400px)</p>
                    </>
                  )}
                </button>

                {/* 오류 메시지 */}
                {uploadError && <p className="text-red-500 text-sm">{uploadError}</p>}

                {/* 이미지가 있을 경우 삭제 버튼 */}
                {profileImage && (
                  <button
                    type="button"
                    className="text-red-500 text-sm hover:underline"
                    onClick={async () => {
                      if (confirm('프로필 이미지를 삭제하시겠습니까?')) {
                        const supabase = createClient();

                        try {
                          // 1. 먼저 현재 프로필 이미지 URL에서 파일 경로 추출
                          const filePathMatch = profileImage.match(/\/profile_image\/(.+)$/);

                          if (filePathMatch && filePathMatch[1]) {
                            const filePath = decodeURIComponent(filePathMatch[1]);

                            // 2. 스토리지에서 파일 삭제
                            const { error: storageError } = await supabase.storage
                              .from('profile_image')
                              .remove([filePath]);

                            if (storageError) {
                              console.error('스토리지 파일 삭제 오류:', storageError);
                              // 스토리지 삭제 실패해도 DB 업데이트는 계속 진행
                            }
                          }

                          // 3. 사용자 정보에서 이미지 URL 제거
                          const { error } = await supabase
                            .from('user_info')
                            .update({ profile_image_url: null })
                            // FIXME: 느낌표 없애기
                            .eq('user_id', userInfo!.id);

                          if (error) {
                            throw error;
                          }

                          // 4. 상태 업데이트
                          setProfileImage(undefined);

                          // 5. 전역 상태 업데이트
                          // FIXME: 아래 코드 다시 작성
                          // if (userInfo) {
                          //   setUserInfo({
                          //     ...userInfo,
                          //     profileImageUrl: undefined,
                          //   });
                          // }
                        } catch (error) {
                          console.error('이미지 삭제 오류:', error);
                          alert('이미지 삭제 중 오류가 발생했습니다.');
                        }
                      }
                    }}
                  >
                    이미지 삭제
                  </button>
                )}
              </div>
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
                <Image width={35} height={35} src="/image/ico-bold.svg" alt="bold" />
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
                <Image width={35} height={35} src="/image/ico-italic.svg" alt="italic" />
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
                <Image width={35} height={35} src="/image/ico-underline.svg" alt="underline" />
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
