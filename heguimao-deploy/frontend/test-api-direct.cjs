const http = require('http');

// 测试 Vite proxy 是否能正确转发到 Agnes API
const options = {
  hostname: 'localhost',
  port: 5180,
  path: '/v1/chat/completions',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer sk-LgcxeEG9Qz6kCipH6mzmm9kkWj9J4gFla8FsV2qjzXhB8y8F'
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('=== API 测试结果 ===');
    console.log('Status:', res.statusCode);
    console.log('Response:', data.substring(0, 500));
  });
});

req.on('error', (err) => {
  console.log('❌ API 调用失败:', err.message);
});

req.write(JSON.stringify({
  model: 'agnes-2.0-flash',
  messages: [
    { role: 'system', content: 'You are a compliance expert.' },
    { role: 'user', content: 'What certifications do I need for a USB charger?' }
  ],
  temperature: 0.3
}));

req.end();
