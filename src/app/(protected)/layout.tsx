import Footer from '@/components/Footer';
import SideNavigation from '@/components/SideNavigation';

async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SideNavigation />
      <main className="relative ml-[100px]">
        <section className="min-h-svh">{children}</section>
        <Footer />
      </main>
    </>
  );
}

export default ProtectedLayout;
