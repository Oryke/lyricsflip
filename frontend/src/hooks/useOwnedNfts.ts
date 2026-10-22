'use client';

import { useEffect, useState } from 'react';
import { useStellar } from '@/lib/stellar/hooks/useStellar';
import type { OwnedNft } from '@/lib/stellar/client';

/**
 * Badges owned by `owner` (defaults to the connected wallet). Uses the NFT
 * contract's `tokens_of_owner` index, so loading costs two contract calls
 * regardless of how many tokens have been minted in total.
 */
export function useOwnedNfts(owner?: string | null) {
  const { systemCalls, account } = useStellar();
  const address = owner ?? account?.address ?? null;
  const [nfts, setNfts] = useState<OwnedNft[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!systemCalls || !address) {
      setNfts([]);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    systemCalls
      .getOwnedNfts(address)
      .then((result) => !cancelled && setNfts(result))
      .catch((err: unknown) => !cancelled && setError(err instanceof Error ? err : new Error(String(err))))
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [systemCalls, address]);

  return { nfts, isLoading, error };
}
