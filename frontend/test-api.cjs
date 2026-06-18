const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const logs = [];
  page.on('console', msg => {
    if (msg.type() === 'error') logs.push(`❌ ERROR: ${msg.text()}`);
    if (msg.type() === 'log') logs.push(`ℹ️  ${msg.text().substring(0, 200)}`);
  });
  page.on('pageerror', err => logs.push(`💥 PAGE: ${err.message}`));
  
  console.log('=== 测试 API 调用 ===\n');
  
  // 访问首页
  await page.goto('http://localhost:5180', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  
  // 点击"AI Compliance Checker"按钮触发 API 调用
  const btn = await page.locator('text=AI Compliance Checker').first();
  if (await btn.isVisible()) {
    console.log('✅ 找到 AI 诊断按钮');
    await btn.click();
    await page.waitForTimeout(3000);
    
    // 检查是否有 API 调用日志
    const hasProxyLog = logs.some(l => l.includes('/v1/chat/completions'));
    const hasError = logs.some(l => l.includes('Error') || l.includes('error'));
    
    console.log('API 代理日志:', hasProxyLog ? '✅ 有' : '⚠️ 无');
    console.log('API 错误:', hasError ? '❌ 有' : '✅ 无');
    
    // 检查页面是否有响应内容
    const bodyText = await page.locator('body').textContent();
    console.log('页面响应文本长度:', bodyText?.length || 0);
    
    // 显示最近的日志
    console.log('\n=== 最近日志 ===');
    logs.slice(-10).forEach(l => console.log(l));
  } else {
    console.log('❌ 未找到 AI 诊断按钮');
  }
  
  await browser.close();
})();
