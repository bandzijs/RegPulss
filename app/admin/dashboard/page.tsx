import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import DashboardClient from './dashboard-client';

interface Subscriber {
  id: string;
  email: string;
  created_at: string;
}

export default async function AdminDashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/admin/login');
  }

  const { data, error } = await supabase
    .from('email_subscriptions')
    .select('id, email, created_at')
    .order('created_at', { ascending: false });

  const subscribers: Subscriber[] = data ?? [];
  const loadError = error
    ? 'Could not load subscribers. Check database access for authenticated users.'
    : undefined;

  return (
    <DashboardClient
      userEmail={user.email ?? 'Unknown user'}
      subscribers={subscribers}
      loadError={loadError}
    />
  );
}
