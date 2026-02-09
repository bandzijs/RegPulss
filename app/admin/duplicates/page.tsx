'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

/**
 * Admin dashboard for viewing duplicate email subscription attempts
 * Displays statistics and recent attempts for monitoring
 */

interface DuplicateAttempt {
  id: string;
  email: string;
  attempted_at: string;
  reason: string;
  user_agent: string;
}

interface DuplicateStatistic {
  email: string;
  duplicate_count: number;
  first_attempt: string;
  last_attempt: string;
  unique_reasons: number;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function DuplicatesAdmin() {
  const [stats, setStats] = useState<DuplicateStatistic[]>([]);
  const [recentAttempts, setRecentAttempts] = useState<DuplicateAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [emailDetails, setEmailDetails] = useState<DuplicateAttempt[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);

      // Fetch statistics
      const { data: statsData, error: statsError } = await supabase
        .from('duplicate_statistics')
        .select('*');

      if (statsError) {
        console.error('Error fetching stats:', statsError);
      } else {
        setStats(statsData || []);
      }

      // Fetch recent attempts
      const { data: attemptsData, error: attemptsError } = await supabase
        .from('email_duplicates')
        .select('*')
        .order('attempted_at', { ascending: false })
        .limit(20);

      if (attemptsError) {
        console.error('Error fetching attempts:', attemptsError);
      } else {
        setRecentAttempts(attemptsData || []);
        setTotalAttempts(attemptsData?.length || 0);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailClick(email: string) {
    setSelectedEmail(email);
    try {
      const { data, error } = await supabase
        .from('email_duplicates')
        .select('*')
        .eq('email', email)
        .order('attempted_at', { ascending: false });

      if (error) {
        console.error('Error fetching email details:', error);
      } else {
        setEmailDetails(data || []);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="text-center">Loading duplicate statistics...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Duplicate Email Dashboard</h1>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="text-gray-400 text-sm">Total Duplicate Attempts</div>
            <div className="text-3xl font-bold">{totalAttempts}</div>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="text-gray-400 text-sm">Unique Emails</div>
            <div className="text-3xl font-bold">{stats.length}</div>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="text-gray-400 text-sm">Average Attempts per Email</div>
            <div className="text-3xl font-bold">
              {stats.length > 0 ? (totalAttempts / stats.length).toFixed(1) : '0'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Duplicated Emails */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Top Duplicated Emails</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {stats.map((stat) => (
                <div
                  key={stat.email}
                  onClick={() => handleEmailClick(stat.email)}
                  className="bg-gray-700 p-4 rounded cursor-pointer hover:bg-gray-600 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-sm truncate text-blue-400">
                        {stat.email}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        First: {formatDate(stat.first_attempt)}
                      </div>
                      <div className="text-xs text-gray-400">
                        Last: {formatDate(stat.last_attempt)}
                      </div>
                    </div>
                    <div className="ml-4 text-right">
                      <div className="text-2xl font-bold text-red-400">
                        {stat.duplicate_count}
                      </div>
                      <div className="text-xs text-gray-400">attempts</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Attempts or Email Details */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">
              {selectedEmail ? `Details: ${selectedEmail}` : 'Recent Attempts'}
            </h2>
            {selectedEmail && (
              <button
                onClick={() => {
                  setSelectedEmail(null);
                  setEmailDetails([]);
                }}
                className="mb-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
              >
                ← Back to Recent
              </button>
            )}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {(selectedEmail ? emailDetails : recentAttempts).map((attempt) => (
                <div key={attempt.id} className="bg-gray-700 p-3 rounded text-xs">
                  <div className="flex justify-between mb-1">
                    <span className="font-mono text-blue-300">{attempt.email}</span>
                    <span className="text-gray-400">{formatDate(attempt.attempted_at)}</span>
                  </div>
                  <div className="text-gray-400">Reason: {attempt.reason}</div>
                  {attempt.user_agent && (
                    <div className="text-gray-500 truncate mt-1">
                      UA: {attempt.user_agent}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Raw Data View */}
        <div className="mt-8 bg-gray-800 p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">All Duplicate Records</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="text-left p-2">Email</th>
                  <th className="text-left p-2">Attempted</th>
                  <th className="text-left p-2">Reason</th>
                  <th className="text-left p-2">User Agent</th>
                </tr>
              </thead>
              <tbody>
                {recentAttempts.map((attempt) => (
                  <tr key={attempt.id} className="border-b border-gray-700 hover:bg-gray-700">
                    <td className="p-2 font-mono text-blue-300">{attempt.email}</td>
                    <td className="p-2 text-gray-400">{formatDate(attempt.attempted_at)}</td>
                    <td className="p-2">{attempt.reason}</td>
                    <td className="p-2 text-gray-500 truncate max-w-xs">{attempt.user_agent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
