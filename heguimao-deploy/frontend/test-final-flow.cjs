const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const apiRequests = [];
  const apiResponses = [];
  const errors = [];
  
  // 监听网络请求
  page.on('request', req => {
    const url = req.url();
    if (url.includes('/v1/') || url.includes('worker') || url.includes('agnes')) {
      apiRequests.push({
        url: url,
        method: req.method(),
        timestamp: Date.now()
      });
    }
  });
  
  page.on('response', resp => {
    const url = resp.url();
    if (url.includes('/v1/') || url.includes('worker') || url.includes('agnes')) {
      apiResponses.push({
        url: url,
        status: resp.status(),
        timestamp: Date.now()
      });
    }
  });
  
  page.on('pageerror', err => errors.push(err.message));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(`[${msg.type()}] ${msg.text()}`);
  });
  
  console.log('=== 最终前端流程测试 ===\n');
  
  // 1. 访问首页
  console.log('1. 访问首页...');
  await page.goto('http://localhost:5180', { waitUntil: 'networkidle' });
  console.log('   ✅ 首页加载完成');
  
  // 2. 输入产品信息
  console.log('2. 输入产品信息...');
  const inputBox = await page.locator('input[type="text"]').first();
  if (await inputBox.isVisible()) {
    await inputBox.fill('USB charger for laptop');
    console.log('   ✅ 输入完成');
  } else {
    console.log('   ❌ 未找到输入框');
    await browser.close();
    return;
  }
  
  // 3. 点击提交按钮（Analyze 按钮）
  console.log('3. 点击 Analyze 按钮...');
  const analyzeBtn = await page.locator('button:has-text("Analyze")').first();
  if (await analyzeBtn.isEnabled()) {
    await analyzeBtn.click();
    console.log('   ✅ 点击 Analyze 按钮');
  } else {
    console.log('   ⚠️ Analyze 按钮不可用，检查状态...');
    const isEnabled = await analyzeBtn.isEnabled();
    console.log(`   按钮可用状态: ${isEnabled}`);
  }
  
  // 4. 等待 API 响应
  console.log('4. 等待 API 响应...');
  await page.waitForTimeout(10000);
  
  // 5. 检查结果
  console.log('\n=== 测试结果 ===');
  console.log(`API 请求数: ${apiRequests.length}`);
  apiRequests.forEach(req => console.log(`   ➡️  ${req.method} ${req.url.substring(0, 80)}`));
  
  console.log(`API 响应数: ${apiResponses.length}`);
  apiResponses.forEach(resp => console.log(`   ⬅️  ${resp.status} ${resp.url.substring(0, 80)}`));
  
  console.log(`页面错误: ${errors.length}`);
  errors.forEach(err => console.log(`   ❌ ${err.substring(0, 100)}`));
  
  // 检查页面内容
  const bodyText = await page.locator('body').textContent();
  console.log(`页面响应文本长度: ${bodyText?.length || 0}`);
  
  // 检查是否有 AI 响应内容
  if (bodyText?.includes('compliance') || bodyText?.includes('certification') || bodyText?.includes('CE') || bodyText?.includes('FCC')) {
    console.log('✅ 页面显示了合规相关内容');
  } else {
    console.log('⚠️ 页面未显示合规相关内容');
  }
  
  // 截图
  await page.screenshot({ path: 'final-test-screenshot.png' });
  console.log('📸 截图已保存: final-test-screenshot.png');
  
  await browser.close();
  console.log('\n✅ 测试完成');
})();
