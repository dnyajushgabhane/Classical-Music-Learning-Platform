const http = require('http');

const options = {
  host: '127.0.0.1',
  port: 7880, // ✅ LiveKit HTTP port
  path: '/',  // ✅ LiveKit returns "OK" here
  timeout: 2000,
};

const request = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`BODY: ${data}`);

    // ✅ IMPORTANT CHECK
    if (data === 'OK') {
      console.log('LiveKit is running ✅');
      process.exit(0);
    } else {
      console.log('Unexpected response ❌');
      process.exit(1);
    }
  });
});

request.on('error', (err) => {
  console.log('ERROR:', err.message);
  process.exit(1);
});

request.end();