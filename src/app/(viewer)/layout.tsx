import { redirect } from "next/navigation";
import { createClient } from "@/lib/auth/server";

export default async function ViewerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="fixed inset-0 h-screen w-screen overflow-hidden bg-black">
      {children}
    </div>
  );
}
