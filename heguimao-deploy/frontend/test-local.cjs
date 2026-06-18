const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(`[${msg.type()}] ${msg.text()}`);
  });
  
  await page.goto('http://localhost:5179', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  
  console.log('=== 页面加载测试 ===');
  console.log('Title:', await page.title());
  console.log('Errors:', errors.length);
  errors.forEach(e => console.log('  -', e));
  
  // 检查页面是否正常渲染
  const bodyText = await page.locator('body').textContent();
  console.log('Body text length:', bodyText?.length || 0);
  
  // 检查关键元素
  const hasLogo = await page.locator('text=/🐱/').first().isVisible().catch(false);
  const hasNav = await page.locator('nav').first().isVisible().catch(false);
  console.log('Logo visible:', hasLogo);
  console.log('Nav visible:', hasNav);
  
  // 测试 API 调用（通过 Vite proxy）
  console.log('\n=== API 代理测试 ===');
  console.log('Vite proxy 配置: /v1 -> https://apihub.agnes-ai.com');
  console.log('注意: 需要设置 VITE_AGNES_API_KEY 环境变量才能调用');
  
  // 测试前端调用后端 API 的路径
  console.log('\n=== 前端 API 调用路径 ===');
  const html = await page.content();
  console.log('React loaded:', html.includes('react') || html.includes('React'));
  console.log('SPA working:', errors.length === 0);
  
  await browser.close();
})();
