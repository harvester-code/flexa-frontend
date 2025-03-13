import Footer from '@/components/Footer';
import SideNavigation from '@/components/SideNavigation';

async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SideNavigation />
      <main className="relative ml-[100px]">
        <section className="mx-auto min-h-[100svh] max-w-[1340px] px-[30px] pb-24">{children}</section>
        <Footer />
      </main>
    </>
  );
}

export default ProtectedLayout;
