const http = require('http');

const testData = {
  topic: 'API测试话题',
  status: 'completed',
  messages: [
    { role: '提案者', content: 'API测试内容', phase: 0, timestamp: '2026-05-11T10:00:00Z' }
  ],
  phases: [
    { name: '测试阶段', description: 'API测试' }
  ],
  currentPhase: 1
};

const options = {
  hostname: 'localhost',
  port: 9528,
  path: '/api/exports/docx',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
};

const req = http.request(options, (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Content-Type:', res.headers['content-type']);
  
  const chunks = [];
  res.on('data', (chunk) => chunks.push(chunk));
  res.on('end', () => {
    const buffer = Buffer.concat(chunks);
    console.log('Response Size:', buffer.length, 'bytes');
    
    if (res.statusCode === 200) {
      const fs = require('fs');
      fs.writeFileSync('api-test.docx', buffer);
      console.log('File saved: api-test.docx');
      console.log('TEST PASSED: DOCX API endpoint works!');
    } else {
      console.log('Response:', buffer.toString());
      console.log('TEST FAILED');
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
});

req.write(JSON.stringify(testData));
req.end();
