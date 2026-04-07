import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import AdminLogoutButton from './logout-button';

export default async function AdminDashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/admin/login');
  }

  const { count, error } = await supabase
    .from('email_subscriptions')
    .select('*', { count: 'exact', head: true });

  return (
    <main className="min-h-screen flex flex-col items-center justify-start px-4 py-12 md:py-16 bg-[var(--color-background)]">
      <div className="container max-w-lg w-full">
        <h1 className="hero-title text-3xl md:text-4xl mb-2">Dashboard</h1>
        <p className="text-[var(--color-text-secondary)] text-sm mb-10">
          Signed in as {user.email}
        </p>

        <section
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background-alt)] p-6 md:p-8 mb-10"
          aria-labelledby="subscribers-heading"
        >
          <h2
            id="subscribers-heading"
            className="font-[family-name:var(--font-serif)] text-xl font-bold text-[var(--color-text-primary)] mb-2"
          >
            Subscribers
          </h2>
          {error ? (
            <p className="text-sm" style={{ color: 'var(--color-accent)' }}>
              Could not load subscriber count. Check database access for
              authenticated users.
            </p>
          ) : (
            <p className="text-3xl font-semibold tabular-nums text-[var(--color-text-primary)]">
              {count ?? 0}
            </p>
          )}
          <p className="form-note mt-2">Total rows in email_subscriptions</p>
        </section>

        <AdminLogoutButton />
      </div>
    </main>
  );
}
