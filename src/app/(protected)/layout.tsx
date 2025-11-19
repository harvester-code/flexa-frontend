import AppFooter from '@/components/AppFooter';
import AppSidebar from '@/components/AppSidebar';

async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  // 쿼리 키에 user_id가 포함되어 있으므로 사용자별 캐시가 자동으로 분리됨
  // 별도의 캐시 관리 불필요
  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <main className="flex flex-1 flex-col overflow-y-auto" style={{ scrollbarGutter: 'stable' }}>
        <section className="flex-1">{children}</section>
        <AppFooter />
      </main>
    </div>
  );
}

export default ProtectedLayout;
