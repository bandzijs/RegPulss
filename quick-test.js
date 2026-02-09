const http = require('http');

const testEmail = 'user-' + Date.now() + '@test.com';
const postData = JSON.stringify({ email: testEmail });

console.log('Testing API...');
console.log('Email:', testEmail);

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/subscribe',
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
}, (res) => {
  console.log('Status:', res.statusCode);
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Response:', data || '(empty)');
    if (res.statusCode === 201) {
      console.log('✓ Subscription saved!');
    }
  });
});

req.on('error', (e) => {
  console.error('✗ Error:', e.code || e.message);
  console.log('Make sure dev server is running on port 3000');
});

req.write(postData);
req.end();
