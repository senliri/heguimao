const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const apiCalls = [];
  const errors = [];
  
  // 监听网络请求
  page.on('request', req => {
    const url = req.url();
    if (url.includes('/v1/') || url.includes('worker') || url.includes('agnes')) {
      apiCalls.push(`➡️ ${req.method()} ${url.substring(0, 100)}`);
    }
  });
  page.on('response', resp => {
    const url = resp.url();
    if (url.includes('/v1/') || url.includes('worker') || url.includes('agnes')) {
      apiCalls.push(`⬅️ ${resp.status()} ${url.substring(0, 100)}`);
    }
  });
  page.on('pageerror', err => errors.push(err.message));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(`[${msg.type()}] ${msg.text()}`);
  });
  
  console.log('=== 完整用户流程测试 ===\n');
  
  // 1. 访问首页
  console.log('1. 访问首页...');
  await page.goto('http://localhost:5180', { waitUntil: 'networkidle' });
  console.log('   ✅ 首页加载完成');
  
  // 2. 在输入框中输入产品信息
  console.log('2. 输入产品信息...');
  const inputBox = await page.locator('input[type="text"]').first();
  if (await inputBox.isVisible()) {
    await inputBox.fill('USB charger for laptop');
    console.log('   ✅ 输入完成');
  } else {
    console.log('   ⚠️ 未找到输入框');
  }
  
  // 3. 点击发送按钮
  console.log('3. 点击发送...');
  const sendBtn = await page.locator('button').filter({ hasText: /发送|Submit|Send|🐱/ }).first();
  if (await sendBtn.isVisible()) {
    await sendBtn.click();
    console.log('   ✅ 点击发送');
  } else {
    // 尝试找其他发送按钮
    const allBtns = await page.locator('button').all();
    console.log(`   ℹ️  找到 ${allBtns.length} 个按钮`);
    for (const btn of allBtns.slice(0, 5)) {
      const text = await btn.textContent();
      if (text.includes('AI') || text.includes('Check') || text.includes('诊断')) {
        await btn.click();
        console.log('   ✅ 点击了:', text.trim().substring(0, 30));
        break;
      }
    }
  }
  
  // 等待 API 响应
  console.log('4. 等待 API 响应...');
  await page.waitForTimeout(5000);
  
  // 5. 检查结果
  console.log('\n=== 测试结果 ===');
  console.log('API 调用:', apiCalls.length);
  apiCalls.forEach(call => console.log('   ', call));
  
  console.log('\n错误:', errors.length);
  errors.forEach(err => console.log('   ❌', err.substring(0, 200)));
  
  // 检查页面是否有响应内容
  const bodyText = await page.locator('body').textContent();
  console.log('页面响应文本长度:', bodyText?.length || 0);
  
  if (bodyText?.includes('compliance') || bodyText?.includes('certification') || bodyText?.includes('CE') || bodyText?.includes('FCC')) {
    console.log('✅ 页面显示了合规相关内容');
  } else {
    console.log('⚠️ 页面未显示合规相关内容');
  }
  
  await browser.close();
})();
