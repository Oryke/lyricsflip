'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStellar } from '@/lib/stellar/hooks/useStellar';
import { getAccessToken, hasUsername, refreshSession, signInWithWallet } from '@/lib/auth/session';

/**
 * Single auth entry point: connect wallet -> sign the backend challenge ->
 * pick a username (first login only) -> continue to `next`.
 * See docs/architecture.md.
 */
function SignInFlow() {
  const router = useRouter();
  const next = useSearchParams().get('next') || '/';
  const { account, connect, error: walletError } = useStellar();
  const address = account?.address ?? null;
  const [signedIn, setSignedIn] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A valid refresh cookie skips the signing step after a reload.
  useEffect(() => {
    if (!address) return;
    if (getAccessToken()) {
      setSignedIn(true);
      return;
    }
    refreshSession().then(setSignedIn);
  }, [address]);

  useEffect(() => {
    if (!address || !signedIn) return;
    if (hasUsername(address)) {
      router.replace(next);
    } else {
      router.replace(`/set-username?next=${encodeURIComponent(next)}`);
    }
  }, [address, signedIn, next, router]);

  const sign = async () => {
    if (!address) return;
    setIsBusy(true);
    setError(null);
    try {
      await signInWithWallet(address);
      setSignedIn(true);
    } catch {
      setError('Signing failed. Please try again.');
    } finally {
      setIsBusy(false);
    }
  };

  const step = !address ? 'connect' : 'sign';

  return (
    <div className="flex h-screen">
      <div className="bg-white flex w-full flex-col justify-center px-8 md:w-1/2 md:px-16 lg:px-24">
        <div className="mx-auto w-full max-w-md">
          <h1 className="text-[#090909] text-2xl font-bold leading-tight tracking-tight md:text-3xl">
            Have fun guessing the lyrics to your favourite song
          </h1>
          <p className="text-[#121212] mt-4 text-sm text-muted-foreground md:text-base">
            {step === 'connect'
              ? 'Step 1 of 3: connect your Stellar wallet.'
              : 'Step 2 of 3: sign a message to prove you own this wallet.'}
          </p>
          <div className="mt-8 w-full mx-auto">
            {step === 'connect' ? (
              <button
                onClick={connect}
                className="w-full cursor-pointer rounded-full bg-purple-600 py-6 text-white hover:bg-purple-700"
              >
                Connect Wallet
              </button>
            ) : (
              <button
                onClick={sign}
                disabled={isBusy || signedIn}
                className="w-full cursor-pointer rounded-full bg-purple-600 py-6 text-white hover:bg-purple-700 disabled:opacity-60"
              >
                {isBusy ? 'Waiting for signature…' : 'Sign in'}
              </button>
            )}
            {(error || walletError) && (
              <p className="mt-4 text-sm text-red-600">{error ?? walletError?.message}</p>
            )}
          </div>
        </div>
      </div>

      <div className="hidden bg-purple-600 md:flex md:w-1/2 md:flex-col md:items-center md:justify-center">
        <div className="text-4xl font-bold md:text-5xl lg:text-6xl">
          <span className="text-white">Lyric</span>
          <span className="text-cyan-300">Flip</span>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInFlow />
    </Suspense>
  );
}
