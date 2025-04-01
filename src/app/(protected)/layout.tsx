import AppFooter from '@/components/AppFooter';
import AppSidebar from '@/components/AppSidebar';

async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppSidebar />
      <main className="relative ml-[100px]">
        <section className="mb-[20px] min-h-svh">{children}</section>
        <AppFooter />
      </main>
    </>
  );
}

export default ProtectedLayout;
