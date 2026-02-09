const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://verhrcogztsucfjrzqpb.supabase.co',
  'sb_publishable_2WjiVqFIhwoHoRP3VzC6iA_KI8Obk2o'
);

async function testEmailValidation() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('TESTING IMPROVED RLS POLICY WITH EMAIL VALIDATION');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  const testCases = [
    {
      name: 'Valid Email',
      email: 'valid-user-' + Date.now() + '@example.com',
      shouldSucceed: true,
    },
    {
      name: 'Invalid Email - Missing @',
      email: 'notanemail.com',
      shouldSucceed: false,
    },
    {
      name: 'Invalid Email - Missing domain',
      email: 'user@',
      shouldSucceed: false,
    },
    {
      name: 'Invalid Email - Only spaces',
      email: '   ',
      shouldSucceed: false,
    },
    {
      name: 'Invalid Email - SQL Injection attempt',
      email: "'; DROP TABLE users; --",
      shouldSucceed: false,
    },
  ];

  for (const testCase of testCases) {
    console.log(`Test: ${testCase.name}`);
    console.log(`Email: "${testCase.email}"`);

    const { data, error } = await supabase
      .from('email_subscriptions')
      .insert({ email: testCase.email });

    if (error) {
      console.log(`❌ Rejected - Error: ${error.message}`);
      if (!testCase.shouldSucceed) {
        console.log('✓ Expected behavior');
      } else {
        console.log('✗ UNEXPECTED: Should have succeeded');
      }
    } else {
      console.log(`✅ Inserted successfully`);
      if (testCase.shouldSucceed) {
        console.log('✓ Expected behavior');
      } else {
        console.log('✗ UNEXPECTED: Should have been rejected');
      }
    }
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log('NOTE: Run supabase-rls-fix.sql first to enable validation');
  console.log('═══════════════════════════════════════════════════════════');
}

testEmailValidation().catch(console.error);
