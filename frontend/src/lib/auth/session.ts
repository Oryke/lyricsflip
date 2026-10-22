import { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit';
import apiClient from '@/services/api';

// The access token lives in memory only. The refresh token is an HttpOnly
// cookie set by the backend, so a page reload restores the session through
// `refreshSession()` and no auth token ever touches Web Storage.
let accessToken: string | null = null;

export const getAccessToken = () => accessToken;
export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

/** Exchanges the refresh cookie for a new access token. */
export async function refreshSession(): Promise<boolean> {
  try {
    const { data } = await apiClient.post<{ accessToken: string }>('/auth/refresh');
    setAccessToken(data.accessToken);
    return true;
  } catch {
    setAccessToken(null);
    return false;
  }
}

/** Signs the backend challenge (LF-228) with the connected wallet. */
export async function signInWithWallet(address: string): Promise<void> {
  const { data } = await apiClient.post<{ challenge: string }>('/auth/challenge', { address });
  const { signedMessage } = await StellarWalletsKit.signMessage(data.challenge, { address });
  const { data: tokens } = await apiClient.post<{ accessToken: string }>('/auth/verify', {
    address,
    signedChallenge: signedMessage,
  });
  setAccessToken(tokens.accessToken);
}

export async function signOut(): Promise<void> {
  setAccessToken(null);
  await apiClient.post('/auth/sign-out').catch(() => undefined);
}

// Not a credential: only records that this wallet already picked a username
// so returning users skip that step.
const usernameKey = (address: string) => `lf:username-set:${address}`;

export function hasUsername(address: string): boolean {
  try {
    return localStorage.getItem(usernameKey(address)) === '1';
  } catch {
    return false;
  }
}

export function markUsernameSet(address: string) {
  try {
    localStorage.setItem(usernameKey(address), '1');
  } catch {
    // Storage unavailable: the user is just asked again next time.
  }
}
