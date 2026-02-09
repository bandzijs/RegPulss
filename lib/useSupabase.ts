import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

/**
 * useAuth Hook
 *
 * Manages user authentication state and session lifecycle.
 * Automatically syncs with Supabase authentication events.
 *
 * @hook
 * @returns {Object} Authentication state
 * @returns {User | null} user - Currently authenticated user or null
 * @returns {boolean} loading - Whether auth state is still loading
 *
 * @example
 * const { user, loading } = useAuth();
 * if (loading) return <Spinner />;
 * return user ? <Dashboard /> : <Login />;
 */
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      console.warn('Supabase client not initialized');
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  return { user, loading };
};

/**
 * Sign up a new user with email and password
 *
 * @async
 * @param {string} email - User email address
 * @param {string} password - User password
 * @returns {Promise} Sign up result with data or error
 *
 * @example
 * const { data, error } = await signUp('user@example.com', 'password123');
 */
export const signUp = async (email: string, password: string) => {
  if (!supabase) {
    return { data: null, error: { message: 'Supabase client not initialized' } };
  }
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
};

/**
 * Sign in user with email and password
 *
 * @async
 * @param {string} email - User email address
 * @param {string} password - User password
 * @returns {Promise} Sign in result with session or error
 *
 * @example
 * const { data, error } = await signIn('user@example.com', 'password123');
 */
export const signIn = async (email: string, password: string) => {
  if (!supabase) {
    return { data: null, error: { message: 'Supabase client not initialized' } };
  }
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

/**
 * Sign out current user
 *
 * @async
 * @returns {Promise} Sign out result
 *
 * @example
 * const { error } = await signOut();
 */
export const signOut = async () => {
  if (!supabase) {
    return { error: { message: 'Supabase client not initialized' } };
  }
  const { error } = await supabase.auth.signOut();
  return { error };
};

/**
 * Subscribe email to newsletter via API route
 *
 * @async
 * @param {string} email - Email address to subscribe
 * @returns {Promise} Subscription result
 *
 * @example
 * const { data, error } = await subscribeEmail('legal@example.com');
 *
 * @deprecated Call /api/subscribe directly for better control
 */
export const subscribeEmail = async (email: string) => {
  if (!supabase) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { data: null, error: { message: 'Supabase client not initialized' } as any };
  }
  const { data, error } = await supabase
    .from("email_subscriptions")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert({ email } as any);
  return { data, error };
};
