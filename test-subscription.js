const http = require('http');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://verhrcogztsucfjrzqpb.supabase.co',
  'sb_publishable_2WjiVqFIhwoHoRP3VzC6iA_KI8Obk2o'
);

async function testSubscriptionFlow() {
  const testEmail = 'subscriber-' + Date.now() + '@example.com';
  
  console.log('═══════════════════════════════════════');
  console.log('TESTING EMAIL SUBSCRIPTION');
  console.log('═══════════════════════════════════════');
  console.log('Email:', testEmail);
  console.log('');
  
  // Step 1: Test API endpoint
  console.log('Step 1: Submitting email to /api/subscribe...');
  
  return new Promise((resolve) => {
    const postData = JSON.stringify({ email: testEmail });
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/subscribe',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', async () => {
        console.log('  Status: ' + res.statusCode);
        
        if (res.statusCode === 201) {
          console.log('  ✓ API returned 201 Created');
        } else if (res.statusCode === 409) {
          console.log('  ⚠ Email already exists (409 Conflict)');
        } else {
          console.log('  Response:', data);
        }
        
        console.log('');
        console.log('Step 2: Checking Supabase database...');
        
        // Step 2: Verify in Supabase
        try {
          const { data: records, error } = await supabase
            .from('email_subscriptions')
            .select('*')
            .eq('email', testEmail);
          
          if (error) {
            console.log('  ✗ Error:', error.message);
          } else if (records.length > 0) {
            console.log('  ✓ Email found in database');
            console.log('  Email:', records[0].email);
            console.log('  Created at:', records[0].created_at);
            console.log('');
            console.log('═══════════════════════════════════════');
            console.log('✓ SUCCESS: Email saved to Supabase!');
            console.log('═══════════════════════════════════════');
          } else {
            console.log('  ✗ Email not found in database');
          }
        } catch (err) {
          console.log('  ✗ Database error:', err.message);
        }
        
        resolve();
      });
    });
    
    req.on('error', (e) => {
      console.log('  ✗ Request failed:', e.message);
      resolve();
    });
    
    req.write(postData);
    req.end();
  });
}

testSubscriptionFlow().catch(console.error);
