import { redirect } from 'next/navigation';

// `/sign-in` is the single auth entry point.
export default function LegacySignInPage() {
  redirect('/sign-in');
}
