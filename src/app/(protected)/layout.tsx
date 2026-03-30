import AppFooter from '@/components/AppFooter';
import AppSidebar from '@/components/AppSidebar';
import SimulationWatcher from '@/components/SimulationWatcher';

async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <SimulationWatcher />
      <AppSidebar />
      <main className="flex flex-1 flex-col overflow-y-auto" style={{ scrollbarGutter: 'stable' }}>
        <section className="flex-1">{children}</section>
        <AppFooter />
      </main>
    </div>
  );
}

export default ProtectedLayout;
