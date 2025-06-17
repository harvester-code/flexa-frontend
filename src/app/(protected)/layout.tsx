import AppFooter from '@/components/AppFooter';
import AppSidebar from '@/components/AppSidebar';

async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppSidebar />
      <main className="relative ml-[100px] flex min-h-screen flex-col">
        <section className="flex-1">{children}</section>
        <AppFooter />
      </main>
    </>
  );
}

export default ProtectedLayout;
