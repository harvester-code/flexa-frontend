import { createBrowserClient } from '@supabase/ssr';

let client: ReturnType<typeof createBrowserClient> | undefined;

/**
 * Supabase 브라우저 클라이언트
 * 
 * 기능:
 * - 클라이언트 재사용 (싱글톤 패턴)
 * - 세션 지속성 비활성화 (자동 로그인 방지)
 */
function createClient() {
  if (client) {
    return client;
  }

  // 개발 환경인지 확인
  const isDevelopment = process.env.NODE_ENV === 'development';

  client = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: {
      // 토큰 자동 새로고침 비활성화
      autoRefreshToken: false,

      // 세션 지속성 비활성화 (브라우저 재시작시 로그인 필요)
      persistSession: false,

      // URL에서 세션 감지
      detectSessionInUrl: true,
      
      // 세션 저장소를 메모리로 설정 (브라우저 세션 저장소 사용 안함)
      storage: {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      },
    },

    // 실시간 설정
    realtime: isDevelopment
      ? {
          heartbeatIntervalMs: 30000,
          reconnectAfterMs: function (tries: number) {
            return Math.min(tries * 1000, 5000);
          },
        }
      : undefined,

    // 글로벌 설정
    global: {
      headers: {
        'X-Client-Info': `flexa-nextjs-${isDevelopment ? 'dev' : 'prod'}`,
      },
    },
  });


  return client!;
}

export { createClient };
