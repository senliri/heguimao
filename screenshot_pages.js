const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, 'screenshots');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Pages to capture: [route, filename, viewport width]
const PAGES = [
  { route: '/', file: '01_landing_page.png', width: 1440 },
  { route: '/report?ai=true&market=US&product=wireless+earbuds', file: '02_search_analysis.png', width: 1440 },
  { route: '/report', file: '03_compliance_report.png', width: 1440 },
  { route: '/appeal', file: '04_appeal_assistant.png', width: 1440 },
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Navigating to local dev server...');
  
  // Wait for Vite to start if needed
  const BASE_URL = 'http://localhost:5174';
  
  // Try to reach the dev server
  let reachable = false;
  for (let attempt = 0; attempt < 10; attempt++) {
    try {
      const resp = await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 5000 });
      if (resp && resp.status() === 200) {
        reachable = true;
        console.log(`Server reachable on attempt ${attempt + 1}`);
        break;
      }
    } catch (e) {
      console.log(`Attempt ${attempt + 1}: waiting for server...`);
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  if (!reachable) {
    console.error('Could not reach Vite dev server at localhost:5173');
    console.log('Please make sure the dev server is running: cd heguimao-deploy/frontend && npm run dev');
    console.log('Or update BASE_URL to your deployed site.');
    await browser.close();
    process.exit(1);
  }

  for (const { route, file, width } of PAGES) {
    const url = `${BASE_URL}${route}`;
    console.log(`Capturing: ${file} -> ${url}`);
    
    await page.setViewportSize({ width, height: 900 });
    await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
    
    // Extra wait for animations/content to settle
    await new Promise(r => setTimeout(r, 1000));
    
    const outputPath = path.join(OUTPUT_DIR, file);
    await page.screenshot({ path: outputPath, fullPage: false });
    console.log(`  -> Saved to ${outputPath}`);
  }

  await browser.close();
  console.log('Done! All screenshots saved to:', OUTPUT_DIR);
})();
