import AppFooter from '@/components/AppFooter';
import AppSidebar from '@/components/AppSidebar';

async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <main className="flex flex-1 flex-col overflow-auto">
        <section className="flex-1">{children}</section>
        <AppFooter />
      </main>
    </div>
  );
}

export default ProtectedLayout;
