const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const apiRequests = [];
  const apiResponses = [];
  const errors = [];
  
  // 监听所有网络请求
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
  
  console.log('=== 完整前端流程测试 ===\n');
  
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
  
  // 3. 点击发送按钮
  console.log('3. 点击发送...');
  const sendBtn = await page.locator('button').filter({ hasText: /发送|Submit|Send|🐱/ }).first();
  if (await sendBtn.isVisible()) {
    await sendBtn.click();
    console.log('   ✅ 点击发送');
  } else {
    console.log('   ⚠️ 未找到发送按钮，尝试其他方式...');
    // 尝试找所有按钮
    const allBtns = await page.locator('button').all();
    console.log(`   ℹ️  找到 ${allBtns.length} 个按钮`);
    for (const btn of allBtns) {
      const text = await btn.textContent();
      if (text && (text.includes('AI') || text.includes('Check') || text.includes('诊断'))) {
        await btn.click();
        console.log(`   ✅ 点击了: "${text.trim().substring(0, 30)}"`);
        break;
      }
    }
  }
  
  // 4. 等待 API 响应
  console.log('4. 等待 API 响应...');
  await page.waitForTimeout(8000);
  
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
  
  if (bodyText?.includes('compliance') || bodyText?.includes('certification') || bodyText?.includes('CE') || bodyText?.includes('FCC')) {
    console.log('✅ 页面显示了合规相关内容');
  } else {
    console.log('⚠️ 页面未显示合规相关内容');
  }
  
  // 截图
  await page.screenshot({ path: 'test-screenshot.png' });
  console.log('📸 截图已保存: test-screenshot.png');
  
  await browser.close();
  console.log('\n✅ 测试完成');
})();
