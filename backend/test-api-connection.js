/**
 * 🔧 DeepSeek API 连接测试工具
 * 用法：node test-api-connection.js
 *
 * 功能：
 * 1. 测试 API 密钥是否有效
 * 2. 测试网络连接是否正常
 * 3. 测试模型响应速度
 * 4. 输出详细的诊断报告
 */

require('dotenv').config();
const OpenAI = require('openai');

const CONFIG = {
  apiKey: process.env.DEEPSEEK_API_KEY || 'sk-7f85a014ff1f4fb7938163b2717b70d5',
  baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
  model: process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash',
  timeout: parseInt(process.env.API_TIMEOUT_MS) || 30000, // 测试用30秒超时
};

console.log('='.repeat(60));
console.log('🔍 DeepSeek API 连接测试工具');
console.log('='.repeat(60));
console.log(`\n📋 配置信息:`);
console.log(`   API 端点: ${CONFIG.baseURL}`);
console.log(`   模型名称: ${CONFIG.model}`);
console.log(`   超时设置: ${CONFIG.timeout}ms`);
console.log(`   API 密钥: ${CONFIG.apiKey.substring(0, 10)}...${CONFIG.apiKey.substring(-4)}`);
console.log('');

async function testConnection() {
  const client = new OpenAI({
    apiKey: CONFIG.apiKey,
    baseURL: CONFIG.baseURL,
    timeout: CONFIG.timeout,
  });

  const results = {
    timestamp: new Date().toISOString(),
    tests: [],
    overallStatus: 'unknown',
  };

  // 测试1：基本连接
  console.log('📡 测试1：基本连接...');
  try {
    const startTime = Date.now();

    const response = await client.chat.completions.create({
      model: CONFIG.model,
      messages: [
        { role: 'user', content: '请用一句话回复：API连接正常' }
      ],
      max_tokens: 50,
      temperature: 0.1,
    });

    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
    const content = response.choices[0]?.message?.content || '';

    console.log(`   ✅ 成功! 耗时: ${elapsedTime}s`);
    console.log(`   📝 回复: ${content}`);

    results.tests.push({
      name: '基本连接',
      status: 'success',
      elapsedTime: `${elapsedTime}s`,
      response: content.substring(0, 100),
    });
  } catch (error) {
    console.error(`   ❌ 失败: ${error.message}`);
    results.tests.push({
      name: '基本连接',
      status: 'failed',
      error: error.message,
      errorType: classifyError(error),
    });
  }

  // 测试2：长文本生成（模拟实际使用场景）
  console.log('\n📝 测试2：长文本生成（模拟辩论场景）...');
  try {
    const startTime = Date.now();

    const response = await client.chat.completions.create({
      model: CONFIG.model,
      messages: [
        {
          role: 'system',
          content: '你是一位专业的辩论选手。请针对以下话题提出一个简洁的论点。'
        },
        {
          role: 'user',
          content: '话题：人工智能是否会取代人类的工作？请用100字以内回答。'
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
    const content = response.choices[0]?.message?.content || '';

    console.log(`   ✅ 成功! 耗时: ${elapsedTime}s`);
    console.log(`   📝 长度: ${content.length} 字符`);

    results.tests.push({
      name: '长文本生成',
      status: 'success',
      elapsedTime: `${elapsedTime}s`,
      contentLength: content.length,
    });
  } catch (error) {
    console.error(`   ❌ 失败: ${error.message}`);
    results.tests.push({
      name: '长文本生成',
      status: 'failed',
      error: error.message,
    });
  }

  // 测试3：并发请求（可选）
  console.log('\n⚡ 测试3：快速连续请求（检测限流）...');
  try {
    const startTime = Date.now();

    // 发送两个连续请求
    const [response1, response2] = await Promise.all([
      client.chat.completions.create({
        model: CONFIG.model,
        messages: [{ role: 'user', content: '回复OK' }],
        max_tokens: 10,
      }),
      client.chat.completions.create({
        model: CONFIG.model,
        messages: [{ role: 'user', content: '回复OK' }],
        max_tokens: 10,
      }),
    ]);

    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`   ✅ 成功! 2个请求耗时: ${elapsedTime}s`);
    console.log(`   📝 无限流问题`);

    results.tests.push({
      name: '并发请求',
      status: 'success',
      elapsedTime: `${elapsedTime}s`,
      requestCount: 2,
    });
  } catch (error) {
    console.error(`   ⚠️ 可能有限流: ${error.message}`);
    results.tests.push({
      name: '并发请求',
      status: 'warning',
      error: error.message,
      suggestion: '可能触发了速率限制，建议降低请求频率',
    });
  }

  // 生成总结
  console.log('\n' + '='.repeat(60));
  console.log('📊 测试结果总结');
  console.log('='.repeat(60));

  const successCount = results.tests.filter(t => t.status === 'success').length;
  const totalCount = results.tests.length;

  results.overallStatus = successCount === totalCount ? 'success' :
                         successCount > 0 ? 'partial' : 'failed';

  console.log(`\n✅ 通过: ${successCount}/${totalCount}`);
  console.log(`🎯 总体状态: ${results.overallStatus.toUpperCase()}`);

  if (results.overallStatus === 'success') {
    console.log('\n🎉 恭喜！所有测试通过，API 连接正常！');
    console.log('💡 您的系统应该可以正常工作了。');
  } else if (results.overallStatus === 'partial') {
    console.log('\n⚠️ 部分测试失败，请检查以下项目:');
    results.tests.filter(t => t.status !== 'success').forEach(test => {
      console.log(`   - ${test.name}: ${test.error || test.suggestion || '未知错误'}`);
    });
  } else {
    console.log('\n❌ 所有测试失败，请检查:');
    console.log('   1. 网络连接是否正常');
    console.log('   2. API 密钥是否正确');
    console.log('   3. 是否需要配置代理');
    console.log('   4. API 服务是否可用');
  }

  console.log('\n' + '='.repeat(60));

  return results;
}

function classifyError(error) {
  const message = (error.message || '').toLowerCase();

  if (message.includes('401') || message.includes('403')) return '认证失败';
  if (message.includes('429')) return '频率限制';
  if (message.includes('timeout') || message.includes('abort')) return '请求超时';
  if (message.includes('network') || message.includes('fetch')) return '网络错误';
  if (message.includes('500') || message.includes('502')) return '服务器错误';

  return '未知错误';
}

// 运行测试
testConnection()
  .then(results => {
    process.exit(results.overallStatus === 'success' ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 测试脚本出错:', error);
    process.exit(1);
  });
