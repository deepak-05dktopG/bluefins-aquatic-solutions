import https from 'https';

const options = {
  hostname: 'bluefins-backend.onrender.com',
  port: 443,
  path: '/api/admin/login',
  method: 'OPTIONS',
  headers: {
    'Origin': 'https://bluefinsaquaticsolutions.com',
    'Access-Control-Request-Method': 'POST',
    'Access-Control-Request-Headers': 'content-type,authorization,x-requested-with'
  }
};

const req = https.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log('HEADERS:', JSON.stringify(res.headers, null, 2));
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.end();
