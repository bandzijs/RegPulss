'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function TestSupabase() {
  const [status, setStatus] = useState<string>('Testing connection...');
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Test 1: Check if client is initialized
        if (!supabase) {
          setStatus('❌ Supabase client not initialized');
          setIsConnected(false);
          return;
        }

        // Test 2: Try to get session
        const { error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          setStatus(`❌ Error getting session: ${sessionError.message}`);
          setIsConnected(false);
          return;
        }

        // Test 3: Check if we can access the API
        await supabase.auth.getUser();
        
        setStatus('✅ Supabase is connected successfully! Ready to use.');
        setIsConnected(true);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setStatus(`❌ Connection error: ${errorMessage}`);
        setIsConnected(false);
      }
    };

    testConnection();
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Supabase Connection Test</h1>
      <div style={{
        padding: '1rem',
        marginTop: '1rem',
        borderRadius: '8px',
        backgroundColor: isConnected === true ? '#d4edda' : isConnected === false ? '#f8d7da' : '#e2e3e5',
        color: isConnected === true ? '#155724' : isConnected === false ? '#721c24' : '#383d41',
      }}>
        <p>{status}</p>
      </div>
      
      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <h2>Quick Test Commands:</h2>
        <p>You can test in your browser console:</p>
        <pre style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '4px', overflow: 'auto' }}>
{`// Import supabase client
import { supabase } from '@/lib/supabaseClient';

// Check if you're logged in
await supabase.auth.getSession();

// List your tables
await supabase.from('your_table_name').select('*').limit(1);

// Sign up
await supabase.auth.signUp({ 
  email: 'test@example.com', 
  password: 'password123' 
});

// Sign in
await supabase.auth.signInWithPassword({ 
  email: 'test@example.com', 
  password: 'password123' 
});`}
        </pre>
      </div>
    </div>
  );
}
