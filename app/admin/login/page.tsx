'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.push('/admin/dashboard');
    router.refresh();
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-[var(--color-background)]">
      <div className="container max-w-md w-full">
        <h1 className="hero-title text-center text-3xl md:text-4xl mb-2">
          Admin sign in
        </h1>
        <p className="text-center text-[var(--color-text-secondary)] text-sm mb-8">
          RegPulss
        </p>

        <form className="email-form" onSubmit={handleSubmit} noValidate>
          <label htmlFor="admin-email" className="sr-only">
            Email
          </label>
          <input
            id="admin-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="email-input"
            placeholder="Email"
            disabled={loading}
          />

          <label htmlFor="admin-password" className="sr-only">
            Password
          </label>
          <input
            id="admin-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="email-input"
            placeholder="Password"
            disabled={loading}
          />

          {error ? (
            <p
              className="text-sm mb-4"
              style={{ color: 'var(--color-accent)' }}
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <button type="submit" className="cta-button" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </main>
  );
}
