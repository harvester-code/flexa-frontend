import { type SupabaseClient, createBrowserClient } from '@supabase/ssr';

let client: SupabaseClient | undefined;

/**
 * 개발 환경 장시간 사용 최적화된 Supabase 브라우저 클라이언트
 *
 * 개선사항:
 * - 클라이언트 재사용 (싱글톤 패턴)
 * - 개발 환경 최적화 설정
 * - 장시간 세션 유지 설정
 */
function createClient(): SupabaseClient {
  if (client) {
    return client;
  }

  // 개발 환경인지 확인
  const isDevelopment = process.env.NODE_ENV === 'development';

  client = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    // 개발 환경 최적화 설정
    auth: {
      // 자동 새로고침 활성화 (장시간 개발시 세션 유지)
      autoRefreshToken: true,

      // 토큰 새로고침 시간 여유 (개발 환경에서 더 짧게)
      refreshTokenMargin: isDevelopment ? 60 : 30, // 60초 vs 30초

      // 세션 지속성 (브라우저 재시작 시에도 세션 유지)
      persistSession: true,

      // 세션 검증 (개발 환경에서 더 자주)
      detectSessionInUrl: true,
    },

    // 실시간 설정 최적화 (개발 환경)
    realtime: isDevelopment
      ? {
          // 개발 환경에서 실시간 연결 끊김 방지
          heartbeatIntervalMs: 30000, // 30초마다 heartbeat
          reconnectAfterMs: function (tries: number) {
            // 개발 환경에서는 빠른 재연결
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

  // 개발 환경에서 디버깅을 위한 이벤트 리스너
  if (isDevelopment && typeof window !== 'undefined') {
    client.auth.onAuthStateChange((event, session) => {
      console.debug(`[Supabase Auth] ${event}`, {
        userId: session?.user?.id,
        expiresAt: session?.expires_at,
      });
    });
  }

  return client;
}

export { createClient };
