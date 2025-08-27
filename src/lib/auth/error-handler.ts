/**
 * Supabase Auth 에러 핸들링 유틸리티
 * URL 파라미터 대신 안전한 에러 처리를 위한 시스템
 */

export interface AuthErrorResult {
  type: 'invalid_credentials' | 'rate_limit' | 'unverified' | 'network' | 'generic';
  message: string;
  details?: string;
}

export function handleAuthError(error: any): AuthErrorResult {
  // Supabase Auth 에러 코드에 따른 사용자 친화적 메시지
  switch (error?.code) {
    case 'invalid_credentials':
      return {
        type: 'invalid_credentials',
        message: 'Invalid email or password. Please check your credentials and try again.',
      };

    case 'too_many_requests':
      return {
        type: 'rate_limit',
        message: 'Too many login attempts. Please wait a moment and try again.',
      };

    case 'email_not_confirmed':
      return {
        type: 'unverified',
        message: 'Please check your email and click the verification link to complete your account setup.',
      };

    case 'signup_disabled':
      return {
        type: 'generic',
        message: 'Account registration is currently disabled. Please contact support.',
      };

    case 'email_address_not_authorized':
      return {
        type: 'generic',
        message: 'This email address is not authorized. Please contact support.',
      };

    case 'weak_password':
      return {
        type: 'generic',
        message: 'Password is too weak. Please choose a stronger password.',
      };

    default:
      // 네트워크 에러 또는 기타 에러
      if (error?.message?.includes('fetch')) {
        return {
          type: 'network',
          message: 'Network error. Please check your connection and try again.',
        };
      }

      return {
        type: 'generic',
        message: 'Something went wrong. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      };
  }
}

/**
 * 입력 검증 유틸리티
 */
export interface ValidationResult {
  valid: boolean;
  error?: AuthErrorResult;
}

export function validateCredentials(email: string, password: string): ValidationResult {
  // 필수 필드 검증
  if (!email || !password) {
    return {
      valid: false,
      error: {
        type: 'generic',
        message: 'Email and password are required.',
      },
    };
  }

  // 이메일 형식 검증
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      valid: false,
      error: {
        type: 'generic',
        message: 'Please enter a valid email address.',
      },
    };
  }

  // 비밀번호 길이 검증
  if (password.length < 6) {
    return {
      valid: false,
      error: {
        type: 'generic',
        message: 'Password must be at least 6 characters long.',
      },
    };
  }

  return { valid: true };
}

/**
 * 회원가입 입력 검증
 */
export function validateSignUpData(formData: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}): ValidationResult {
  const { firstName, lastName, email, password } = formData;

  // 필수 필드 검증
  if (!firstName || !lastName || !email || !password) {
    return {
      valid: false,
      error: {
        type: 'generic',
        message: 'All fields are required.',
      },
    };
  }

  // 이름 길이 검증
  if (firstName.length < 2 || lastName.length < 2) {
    return {
      valid: false,
      error: {
        type: 'generic',
        message: 'Names must be at least 2 characters long.',
      },
    };
  }

  // 이름에 공백이 있는지 검증
  if (firstName.includes(' ') || lastName.includes(' ')) {
    return {
      valid: false,
      error: {
        type: 'generic',
        message: 'Names cannot contain spaces.',
      },
    };
  }

  // 이메일과 비밀번호 검증 재사용
  return validateCredentials(email, password);
}
