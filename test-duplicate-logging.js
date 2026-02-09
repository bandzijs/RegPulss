/**
 * Test duplicate email logging
 * This script tests that duplicate subscription attempts are properly logged
 * 
 * Usage: node test-duplicate-logging.js
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://verhrcogztsucfjrzqpb.supabase.co';
const supabaseKey = 'sb_publishable_2WjiVqFIhwoHoRP3VzC6iA_KI8Obk2o';
const apiBaseUrl = 'http://localhost:3000'; // Change if running on different port

const supabase = createClient(supabaseUrl, supabaseKey);

async function subscribeViaAPI(email) {
  try {
    const response = await fetch(`${apiBaseUrl}/api/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await response.json();
    return { status: response.status, data };
  } catch (err) {
    return { error: err.message };
  }
}

async function testDuplicateLogging() {
  console.log('🧪 Testing Duplicate Email Logging\n');
  console.log('='.repeat(60));

  try {
    // Generate a unique test email
    const testEmail = `duplicate-test-${Date.now()}@example.com`;
    console.log(`\n📧 Test Email: ${testEmail}\n`);

    // Step 1: Subscribe via API (will succeed)
    console.log('1️⃣  First subscription attempt via /api/subscribe...');
    const firstResult = await subscribeViaAPI(testEmail);
    
    if (firstResult.error) {
      console.log('   ❌ Connection error:', firstResult.error);
      console.log('   ℹ️  Make sure the dev server is running: npm run dev');
      process.exit(1);
    } else if (firstResult.status === 201) {
      console.log('   ✅ SUCCESS - Email subscribed (201)');
    } else {
      console.log(`   ❌ Unexpected status: ${firstResult.status}`);
      console.log(`   Response: ${JSON.stringify(firstResult.data)}`);
    }

    // Small delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Step 2: Try to subscribe with same email via API (should fail with 409)
    console.log('\n2️⃣  Second subscription attempt via /api/subscribe...');
    const secondResult = await subscribeViaAPI(testEmail);
    
    if (secondResult.status === 409) {
      console.log(`   ✅ EXPECTED ERROR: ${secondResult.data.error}`);
      console.log('   Status: 409 Conflict');
    } else if (secondResult.status === 201) {
      console.log('   ❌ ERROR: Second subscribe should have failed (409)');
    } else {
      console.log(`   ❌ Unexpected status: ${secondResult.status}`);
    }

    // Step 3: Check email_duplicates table
    console.log('\n3️⃣  Checking email_duplicates table...');
    const { data: duplicates, error: duplicateError } = await supabase
      .from('email_duplicates')
      .select('*')
      .eq('email', testEmail)
      .order('attempted_at', { ascending: false });

    if (duplicateError) {
      console.log('   ❌ Error querying duplicates:', duplicateError.message);
      process.exit(1);
    }

    if (!duplicates || duplicates.length === 0) {
      console.log('   ❌ No duplicates logged in email_duplicates table');
      console.log('   This may indicate the API endpoint is not logging duplicates');
    } else {
      console.log(`   ✅ Found ${duplicates.length} duplicate record(s):`);
      duplicates.forEach((dup, idx) => {
        console.log(`\n   Record ${idx + 1}:`);
        console.log(`     Email: ${dup.email}`);
        console.log(`     Attempted: ${dup.attempted_at}`);
        console.log(`     Reason: ${dup.reason}`);
        console.log(`     User Agent: ${dup.user_agent || '(none)'}`);
      });
    }

    // Step 4: Check subscription was successful
    console.log('\n4️⃣  Verifying email in email_subscriptions table...');
    const { data: subscriptions, error: subError } = await supabase
      .from('email_subscriptions')
      .select('*')
      .eq('email', testEmail);

    if (subError) {
      console.log('   ❌ Error:', subError.message);
    } else if (!subscriptions || subscriptions.length === 0) {
      console.log('   ❌ Email not found in subscriptions');
    } else {
      console.log(`   ✅ Email confirmed in subscriptions table`);
      console.log(`     Created at: ${subscriptions[0].created_at}`);
    }

    // Step 5: Check duplicate statistics view
    console.log('\n5️⃣  Checking duplicate_statistics view...');
    const { data: stats, error: statsError } = await supabase
      .from('duplicate_statistics')
      .select('*')
      .eq('email', testEmail);

    if (statsError) {
      console.log('   ❌ Error querying statistics:', statsError.message);
    } else if (!stats || stats.length === 0) {
      console.log('   ℹ️  No statistics yet (may need more attempts)');
    } else {
      console.log('   ✅ Statistics found:');
      stats.forEach(stat => {
        console.log(`     Email: ${stat.email}`);
        console.log(`     Total Duplicates: ${stat.duplicate_count}`);
        console.log(`     First Attempt: ${stat.first_attempt}`);
        console.log(`     Last Attempt: ${stat.last_attempt}`);
        console.log(`     Unique Reasons: ${stat.unique_reasons}`);
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Test Complete!\n');

  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    process.exit(1);
  }
}

// Run the test
testDuplicateLogging();
