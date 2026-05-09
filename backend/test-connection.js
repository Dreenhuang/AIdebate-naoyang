require('dotenv').config();
const OpenAI = require('openai');

const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: process.env.DEEPSEEK_BASE_URL,
  timeout: 15000
});

console.log('Testing DeepSeek API connection...');
console.log('Model:', process.env.DEEPSEEK_MODEL);
console.log('Base URL:', process.env.DEEPSEEK_BASE_URL);

client.chat.completions.create({
  model: process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash',
  messages: [{ role: 'user', content: 'Reply with OK only' }],
  max_tokens: 10
}).then(r => {
  console.log('SUCCESS:', r.choices[0].message.content);
  process.exit(0);
}).catch(e => {
  console.error('FAIL:', e.message);
  process.exit(1);
});
