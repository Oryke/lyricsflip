'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useStellar } from '@/lib/stellar/hooks/useStellar';
import { getAccessToken, hasUsername, refreshSession } from '@/lib/auth/session';

interface RequireAccountProps {
  children: ReactNode;
  /** Set on the username page itself, which is reached before a username exists. */
  allowMissingUsername?: boolean;
}

/** Sends visitors without a wallet, session, or username to `/sign-in`. */
export default function RequireAccount({ children, allowMissingUsername }: RequireAccountProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { account, isLoading } = useStellar();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    const address = account?.address;
    const toSignIn = () => router.replace(`/sign-in?next=${encodeURIComponent(pathname)}`);
    if (!address) {
      toSignIn();
      return;
    }
    (async () => {
      const hasSession = !!getAccessToken() || (await refreshSession());
      if (!hasSession || (!allowMissingUsername && !hasUsername(address))) {
        toSignIn();
        return;
      }
      setAllowed(true);
    })();
  }, [account, isLoading, allowMissingUsername, pathname, router]);

  return allowed ? <>{children}</> : null;
}
