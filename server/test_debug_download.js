const http = require('http');
const fs = require('fs');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/download/project/69ac31410d97aacdc252a9c0',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5YTZkYTM3MjBmNTIyMjFhNjgyMTE0YSIsImlhdCI6MTc3NTEyMTYxOCwiZXhwIjoxNzc3NzEzNjE4fQ.MTC8RFnx4FPNZBnTO6VwfrV9KX2pqf0Mgfi7u1QuNYo'
  }
};

const req = http.request(options, (res) => {
  console.log('STATUS:', res.statusCode);
  const file = fs.createWriteStream('debug_download.zip');
  res.pipe(file);
  file.on('finish', () => {
    file.close();
    console.log('Download finished.');
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.end();
