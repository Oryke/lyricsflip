import type { ReactNode } from 'react';
import RequireAccount from '@/components/auth/RequireAccount';

export default function NotificationsLayout({ children }: { children: ReactNode }) {
  return <RequireAccount>{children}</RequireAccount>;
}
