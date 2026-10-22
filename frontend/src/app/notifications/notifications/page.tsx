import { redirect } from 'next/navigation';

// Old doubled path; the page now lives at /notifications.
export default function LegacyNotificationsPage() {
  redirect('/notifications');
}
