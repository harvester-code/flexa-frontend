export default function ViewerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 h-screen w-screen overflow-hidden bg-black">
      {children}
    </div>
  );
}
