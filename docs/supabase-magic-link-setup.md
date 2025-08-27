# Magic Link 자동화 설정 가이드

## 📝 supabase/config.toml 설정

```toml
[auth]
# Magic Link 활성화
enable_signup = true
enable_confirmations = true

# Site URL (프로덕션)
site_url = "https://flexa.com"

# 추가 허용 URL (환경별)
additional_redirect_urls = [
  # 로컬 개발
  "http://localhost:3000/**",
  "http://localhost:3943/**",
  
  # 개발 환경  
  "https://dev.flexa.com/**",
  "https://staging.flexa.com/**",
  
  # 배포 미리보기 (Vercel)
  "https://*.vercel.app/**",
  
  # 배포 미리보기 (Netlify)  
  "https://**--flexa.netlify.app/**"
]

# Magic Link 설정
[auth.email]
enable_signup = true
double_confirm_changes = true
enable_confirmations = true

# 레이트 리미트
[auth.rate_limits]
magic_link = {
  period = "1h",
  max_attempts = 10
}
```

## 🚀 자동 배포 스크립트

```bash
#!/bin/bash
# scripts/deploy-auth-config.sh

set -e

# 환경별 설정
if [ "$ENVIRONMENT" = "production" ]; then
  SUPABASE_PROJECT_REF="$PROD_SUPABASE_REF"
  SITE_URL="https://flexa.com"
elif [ "$ENVIRONMENT" = "staging" ]; then
  SUPABASE_PROJECT_REF="$STAGING_SUPABASE_REF"
  SITE_URL="https://staging.flexa.com"
else
  SUPABASE_PROJECT_REF="$DEV_SUPABASE_REF"
  SITE_URL="https://dev.flexa.com"
fi

echo "🚀 Deploying Magic Link config to $ENVIRONMENT..."

# Supabase CLI로 설정 배포
supabase link --project-ref $SUPABASE_PROJECT_REF
supabase db push
supabase functions deploy

echo "✅ Magic Link configuration deployed!"
```

## 📧 이메일 템플릿 자동화

```html
<!-- supabase/templates/magic-link.html -->
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="text-align: center; padding: 40px 0;">
    <img src="https://flexa.com/logo.svg" alt="Flexa" style="height: 40px;">
  </div>
  
  <div style="background: #f8f9fa; padding: 40px; border-radius: 12px;">
    <h2 style="color: #1f2937; margin: 0 0 20px 0;">Sign in to Flexa</h2>
    <p style="color: #6b7280; margin: 0 0 30px 0;">
      Click the button below to sign in securely. This link will expire in 1 hour.
    </p>
    
    <a href="{{ .RedirectTo }}/auth/confirm?token_hash={{ .TokenHash }}&type=email" 
       style="display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; 
              border-radius: 6px; text-decoration: none; font-weight: 500;">
      Sign In to Flexa
    </a>
    
    <p style="color: #9ca3af; font-size: 14px; margin: 30px 0 0 0;">
      If you didn't request this, you can safely ignore this email.
    </p>
  </div>
</div>
```
