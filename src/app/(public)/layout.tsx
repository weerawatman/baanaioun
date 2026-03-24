import { AuthProvider } from '@/shared/contexts/AuthContext';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthProvider>{children}</AuthProvider>;
}
