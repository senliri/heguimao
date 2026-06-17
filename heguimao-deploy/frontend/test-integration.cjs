const { chromium } = require('playwright');
const assert = require('assert');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const errors = [];
  const warnings = [];
  const consoleLogs = [];
  
  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error') {
      errors.push(`[${msg.type()}] ${text}`);
      consoleLogs.push(`❌ ERROR: ${text}`);
    } else if (msg.type() === 'warning') {
      warnings.push(text);
      consoleLogs.push(`⚠️ WARN: ${text}`);
    } else {
      consoleLogs.push(`ℹ️  ${text.substring(0, 100)}`);
    }
  });
  
  page.on('pageerror', err => {
    errors.push(`PAGE ERROR: ${err.message}`);
  });
  
  console.log('=== Testing Frontend Page Load ===\n');
  
  // Test 1: Page loads without crash
  try {
    await page.goto('http://localhost:5178', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);
    
    const title = await page.title();
    const bodyText = await page.locator('body').textContent();
    
    console.log(`✅ Page loaded successfully`);
    console.log(`   Title: ${title}`);
    console.log(`   Body length: ${bodyText?.length || 0} chars`);
    
    // Check for key UI elements
    const hasLogo = await page.locator('text=/🐱/').first().isVisible().catch(false);
    const hasNav = await page.locator('nav').first().isVisible().catch(false);
    const hasHomeContent = bodyText?.includes('Compliance Cat') || bodyText?.includes('compliance');
    
    console.log(`   Logo visible: ${hasLogo ? '✅' : '❌'}`);
    console.log(`   Nav visible: ${hasNav ? '✅' : '❌'}`);
    console.log(`   Content rendered: ${hasHomeContent ? '✅' : '❌'}`);
    
    if (errors.length === 0) {
      console.log(`   JS errors: ✅ None`);
    } else {
      console.log(`   JS errors: ❌ ${errors.length} found`);
      errors.forEach(e => console.log(`      ${e}`));
    }
    
  } catch (err) {
    console.log(`❌ Page load failed: ${err.message}`);
  }
  
  // Test 2: Check if API proxy is working
  console.log('\n=== Testing API Proxy (/v1) ===\n');
  
  try {
    // The vite config proxies /v1 to apihub.agnes-ai.com
    // But we need an API key to test it
    console.log('Note: API proxy requires VITE_AGNES_API_KEY environment variable');
    console.log('Current proxy config: /v1 -> https://apihub.agnes-ai.com');
    
    // Check if the proxy route exists in the HTML
    const html = await page.content();
    const hasReactScripts = html.includes('react') || html.includes('React');
    console.log(`   React scripts in page: ${hasReactScripts ? '✅' : '⚠️'}`);
    
  } catch (err) {
    console.log(`   API check failed: ${err.message}`);
  }
  
  // Test 3: Test Cloudflare Worker URL accessibility
  console.log('\n=== Testing Cloudflare Worker URL ===\n');
  
  try {
    const workerUrl = 'https://heguimao-api.senliri028.workers.dev';
    const response = await page.evaluate(async (url) => {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'diagnose', prompt: 'test', message: 'test', temperature: 0.3 })
        });
        const data = await res.json();
        return { status: res.status, reply: data.reply?.substring(0, 50) };
      } catch (e) {
        return { error: e.message };
      }
    }, workerUrl);
    
    if (response.error) {
      console.log(`   Worker test ❌: ${response.error}`);
    } else {
      console.log(`   Worker status: ${response.status}`);
      console.log(`   Response: ${response.reply}`);
    }
  } catch (err) {
    console.log(`   Worker test failed: ${err.message}`);
  }
  
  // Summary
  console.log('\n=== Test Summary ===');
  console.log(`Total errors: ${errors.length}`);
  console.log(`Total warnings: ${warnings.length}`);
  
  if (errors.length > 0) {
    console.log('\n⚠️  ERRORS FOUND:');
    errors.forEach((e, i) => console.log(`  ${i + 1}. ${e}`));
  }
  
  if (warnings.length > 0) {
    console.log(`\nℹ️  WARNINGS (${warnings.length}):`);
    warnings.slice(0, 3).forEach((w, i) => console.log(`  ${i + 1}. ${w.substring(0, 100)}`));
  }
  
  console.log(`\n✅ Integration test completed`);
  
  await browser.close();
})();
