# Supabase 이메일 인증 설정 가이드

## ✅ 완료된 작업들

1. **Group 테이블 삭제** - 불필요한 테이블 제거됨
2. **백엔드 코드 수정** - 이메일 확인 체크 로직 추가
3. **회원가입 플로우 개선** - 이메일 확인 링크 자동 발송

## 🔧 Supabase 대시보드에서 설정해야 할 항목들

### 1. Authentication 설정
**경로**: Supabase Dashboard > Authentication > Settings

#### ✅ 필수 설정들:
```
✅ Enable email confirmations: ON
✅ Enable signup: ON  
✅ Disable signup: OFF
```

#### ✅ URL 설정:
```
Site URL: https://flexa.com (또는 현재 도메인)
Redirect URLs:
- http://localhost:3000/auth/confirm/**
- http://localhost:3943/auth/confirm/**
- https://dev.flexa.com/auth/confirm/**
- https://staging.flexa.com/auth/confirm/**
- https://flexa.com/auth/confirm/**
```

### 2. 이메일 템플릿 설정
**경로**: Authentication > Email Templates

#### ✅ Confirm Signup 템플릿:
```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="text-align: center; padding: 40px 0;">
    <img src="https://flexa.com/logo.svg" alt="Flexa" style="height: 40px;">
  </div>
  
  <div style="background: #f8f9fa; padding: 40px; border-radius: 12px;">
    <h2 style="color: #1f2937; margin: 0 0 20px 0;">Welcome to Flexa!</h2>
    <p style="color: #6b7280; margin: 0 0 30px 0;">
      Thank you for signing up. Please click the button below to verify your email address and complete your registration.
    </p>
    
    <a href="{{ .ConfirmationURL }}" 
       style="display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; 
              border-radius: 6px; text-decoration: none; font-weight: 500;">
      Confirm Email Address
    </a>
    
    <p style="color: #9ca3af; font-size: 14px; margin: 30px 0 0 0;">
      If you didn't sign up for Flexa, you can safely ignore this email.
    </p>
  </div>
</div>
```

### 3. Rate Limiting 설정
**경로**: Authentication > Rate Limits

```
Email sends: 3/hour (사용자당)
Sign up: 2/hour (IP당)  
```

## 🔄 개선된 회원가입 플로우

### 1. 사용자가 회원가입
```
POST /auth/register
→ Supabase signUp with emailRedirectTo
→ 이메일 발송
→ /auth/register/success 페이지 표시
```

### 2. 이메일 확인
```
사용자가 이메일의 링크 클릭
→ /auth/confirm?token_hash=xxx&type=email
→ 이메일 확인 완료
→ /home으로 리다이렉트
```

### 3. 로그인 시 검증
```
POST /auth/login
→ signInWithPassword
→ email_confirmed_at 체크
→ 확인되지 않았다면 로그아웃 + 에러 메시지
→ 확인됐다면 /home으로 진행
```

## 🚀 테스트 방법

1. **새로운 계정으로 회원가입**
2. **이메일 확인 링크 클릭 전에 로그인 시도**
   - "Please verify your email address" 메시지 확인
3. **이메일 확인 후 로그인**
   - 정상적으로 로그인 되는지 확인

## 🛠️ 추가 개선사항 (선택)

### 1. 이메일 재발송 기능
```typescript
export const resendConfirmationAction = async (email: string) => {
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
  });
  // ...
};
```

### 2. 회원가입 시 user_information 테이블 자동 생성
```sql
-- 트리거 함수로 자동화 가능
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_information (user_id, email, first_name, last_name, group_id)
  VALUES (
    NEW.id, 
    NEW.email, 
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    1
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 생성
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();
```
