import { createBrowserClient } from '@supabase/ssr';

let client: ReturnType<typeof createBrowserClient> | undefined;

/**
 * Supabase 브라우저 클라이언트 (싱글톤)
 *
 * NOTE: @supabase/ssr의 createBrowserClient는 아래 auth 옵션들을 무조건 덮어씁니다:
 *   - persistSession → true (cookie 기반 세션 자동 로드)
 *   - autoRefreshToken → true (브라우저 환경)
 *   - storage → document.cookie 기반 어댑터
 * 따라서 여기 설정한 auth 값들은 실제로 적용되지 않습니다.
 */
function createClient() {
  if (client) {
    return client;
  }

  const isDevelopment = process.env.NODE_ENV === 'development';

  client = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    realtime: isDevelopment
      ? {
          heartbeatIntervalMs: 30000,
          reconnectAfterMs: (tries: number) => Math.min(tries * 1000, 5000),
        }
      : undefined,

    global: {
      headers: {
        'X-Client-Info': `flexa-nextjs-${isDevelopment ? 'dev' : 'prod'}`,
      },
    },
  });

  return client!;
}

export { createClient };
