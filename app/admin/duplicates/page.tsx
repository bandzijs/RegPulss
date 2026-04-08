import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

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

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString();
}

export default async function DuplicatesAdminPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/admin/login');
  }

  const [{ data: statsData, error: statsError }, { data: attemptsData, error: attemptsError }] =
    await Promise.all([
      supabase.from('duplicate_statistics').select('*'),
      supabase
        .from('email_duplicates')
        .select('*')
        .order('attempted_at', { ascending: false })
        .limit(20),
    ]);

  const stats = (statsData ?? []) as DuplicateStatistic[];
  const recentAttempts = (attemptsData ?? []) as DuplicateAttempt[];
  const totalAttempts = recentAttempts.length;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Duplicate Email Dashboard</h1>
        {statsError || attemptsError ? (
          <div className="mb-6 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
            Failed to load one or more duplicate datasets.
          </div>
        ) : null}

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
                <div key={stat.email} className="bg-gray-700 p-4 rounded">
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
            <h2 className="text-2xl font-bold mb-4">Recent Attempts</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {recentAttempts.map((attempt) => (
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
