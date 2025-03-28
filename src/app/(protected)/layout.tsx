import Footer from '@/components/Footer';
import SideNavigation from '@/components/SideNavigation';

async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SideNavigation />
      <main className="relative ml-[100px] px-[30px]">
        <section className="mb-[20px] min-h-svh">{children}</section>
        <Footer />
      </main>
    </>
  );
}

export default ProtectedLayout;
