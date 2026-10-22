import type { ReactNode } from 'react';
import RequireAccount from '@/components/auth/RequireAccount';

export default function SetUsernameLayout({ children }: { children: ReactNode }) {
  return <RequireAccount allowMissingUsername>{children}</RequireAccount>;
}
