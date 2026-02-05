import Sidebar from "@/components/Sidebar";
import { AuthProvider } from "@/contexts/AuthContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <Sidebar />
      <main className="bg-warm-50 dark:bg-warm-950 min-h-screen pt-14 pb-16 lg:pt-0 lg:pb-0 lg:ml-64">
        {children}
      </main>
    </AuthProvider>
  );
}
