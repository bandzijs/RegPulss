/**
 * Duplicate Email Management Utilities
 * 
 * Provides functions for checking and logging duplicate email subscription attempts.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase credentials not configured');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Check if an email is already subscribed
 *
 * @param {string} email - Email address to check
 * @returns {Promise<boolean>} True if email exists in subscriptions
 */
export const isEmailSubscribed = async (email: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('email_subscriptions')
    .select('email')
    .eq('email', email)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error checking subscription:', error);
    return false;
  }

  return !!data;
};

/**
 * Get duplicate attempt count for an email
 *
 * @param {string} email - Email address to check
 * @returns {Promise<number>} Number of duplicate attempts
 */
export const getDuplicateCount = async (email: string): Promise<number> => {
  const { data, error } = await supabase
    .from('email_duplicates')
    .select('id', { count: 'exact' })
    .eq('email', email);

  if (error) {
    console.error('Error getting duplicate count:', error);
    return 0;
  }

  return data?.length || 0;
};

/**
 * Log a duplicate subscription attempt
 *
 * @param {string} email - Email address of the duplicate attempt
 * @param {string} reason - Reason for rejection
 * @param {string} userAgent - User agent string (optional)
 * @returns {Promise<boolean>} True if logged successfully
 */
export const logDuplicateAttempt = async (
  email: string,
  reason: string = 'Already subscribed',
  userAgent?: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('email_duplicates')
      .insert([{
        email,
        reason,
        user_agent: userAgent || 'unknown',
      }]);

    if (error) {
      console.error('Failed to log duplicate:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error logging duplicate:', error);
    return false;
  }
};

/**
 * Get duplicate statistics for dashboard
 *
 * @returns {Promise<Array>} Array of duplicate statistics by email
 */
export const getDuplicateStats = async () => {
  try {
    const { data, error } = await supabase
      .from('duplicate_statistics')
      .select('*')
      .order('duplicate_count', { ascending: false });

    if (error) {
      console.error('Error fetching duplicate stats:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error getting duplicate stats:', error);
    return [];
  }
};

/**
 * Get all duplicate attempts for a specific email
 *
 * @param {string} email - Email address to get duplicates for
 * @returns {Promise<Array>} Array of duplicate attempts
 */
export const getDuplicatesForEmail = async (email: string) => {
  try {
    const { data, error } = await supabase
      .from('email_duplicates')
      .select('*')
      .eq('email', email)
      .order('attempted_at', { ascending: false });

    if (error) {
      console.error('Error fetching duplicates:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error getting duplicates:', error);
    return [];
  }
};

/**
 * Get duplicate attempts in a date range
 *
 * @param {Date} startDate - Start date for the range
 * @param {Date} endDate - End date for the range
 * @returns {Promise<Array>} Array of duplicate attempts
 */
export const getDuplicatesByDateRange = async (startDate: Date, endDate: Date) => {
  try {
    const { data, error } = await supabase
      .from('email_duplicates')
      .select('*')
      .gte('attempted_at', startDate.toISOString())
      .lte('attempted_at', endDate.toISOString())
      .order('attempted_at', { ascending: false });

    if (error) {
      console.error('Error fetching duplicates by date:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error getting duplicates by date:', error);
    return [];
  }
};

/**
 * Clear old duplicate records (older than X days)
 *
 * @param {number} daysOld - Delete records older than this many days
 * @returns {Promise<number>} Number of records deleted
 */
export const clearOldDuplicates = async (daysOld: number = 90): Promise<number> => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { data, error } = await supabase
      .from('email_duplicates')
      .delete()
      .lt('attempted_at', cutoffDate.toISOString());

    if (error) {
      console.error('Error clearing old duplicates:', error);
      return 0;
    }

    return data?.length || 0;
  } catch (error) {
    console.error('Error clearing duplicates:', error);
    return 0;
  }
};
